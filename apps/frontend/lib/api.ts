"use client"

import axios, { type AxiosProgressEvent } from "axios"
import { z } from "zod"
import { doc, docSchema, docSchemaResponse } from "../types/zod"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

type GetToken = () => Promise<string | null>

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function createClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    // Content-Type is intentionally not set for multipart requests: the browser
    // must generate the multipart boundary itself.
  })
}

async function withAuth(getToken: GetToken) {
  const token = await getToken()
  if (!token) {
    throw new ApiError("Your session has expired. Sign in again to continue.", 401)
  }
  return { Authorization: `Bearer ${token}` }
}

/** Fetch all documents for the signed-in user. */
export async function fetchDocs(getToken: GetToken): Promise<z.infer<typeof docSchema>> {
  try {
    const client = await createClient()
    const response = await client.get("/doc", { headers: await withAuth(getToken) })
    const parsed = docSchemaResponse.safeParse(response.data)
    if (!parsed.success) {
      throw new ApiError("Received an unexpected response from the server.")
    }
    return parsed.data.response
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        error.response?.status === 401
          ? "Your session has expired. Sign in again to continue."
          : "Could not reach the document service. Check your connection and try again.",
        error.response?.status
      )
    }
    throw new ApiError("Something went wrong while loading your documents.")
  }
}

export interface UploadDocInput {
  name: string
  description?: string
  document: File
}

export interface UploadProgress {
  /** 0-100 while the file is transferring, null while the server processes. */
  percent: number | null
}

/** Upload a PDF. The request stays open until backend ingestion completes. */
export async function uploadDoc(
  getToken: GetToken,
  input: UploadDocInput,
  onProgress?: (progress: UploadProgress) => void
): Promise<z.infer<typeof docSchema>[number]> {
  try {
    const client = await createClient()
    const formData = new FormData()
    formData.append("name", input.name)
    formData.append("description", input.description ?? "")
    formData.append("document", input.document)

    const response = await client.post("/doc", formData, {
      headers: await withAuth(getToken),
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (onProgress && event.total) {
          onProgress({ percent: Math.round((event.loaded / event.total) * 100) })
        }
      },
    })

    const parsed = doc.safeParse(response.data?.data)
    if (!parsed.success) {
      throw new ApiError("The server returned an unexpected document payload.")
    }
    return parsed.data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message =
        status === 400
          ? "The upload was rejected. Check the file is a PDF under 5 MB."
          : status === 401
            ? "Your session has expired. Sign in again to continue."
            : status === 413
              ? "That file is larger than the 5 MB limit."
              : "Upload failed while processing. Try again."
      throw new ApiError(message, status)
    }
    throw new ApiError("Upload failed. Try again.")
  }
}

/** Permanently delete a document and its indexed vectors. */
export async function deleteDoc(getToken: GetToken, docId: string): Promise<void> {
  try {
    const client = await createClient()
    await client.delete(`/doc/${docId}`, { headers: await withAuth(getToken) })
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      throw new ApiError(
        status === 404
          ? "That document no longer exists."
          : status === 401
            ? "Your session has expired. Sign in again to continue."
            : "Deletion failed. The document is still in your collection.",
        status
      )
    }
    throw new ApiError("Deletion failed. The document is still in your collection.")
  }
}
