"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import { deleteDoc, fetchDocs, uploadDoc, type UploadProgress } from "./api"

/**
 * Binds the document API to the current Clerk session. Every call
 * resolves a fresh token, so long-lived sessions never send expired
 * credentials.
 */
export function useDocApi() {
  const { getToken } = useAuth()
  const getTokenRef = useRef(getToken)

  // Keep the latest token getter without changing callback identities.
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const getDocs = useCallback(() => fetchDocs(() => getTokenRef.current()), [])
  const addDoc = useCallback(
    (input: { name: string; description?: string; document: File }, onProgress?: (p: UploadProgress) => void) =>
      uploadDoc(() => getTokenRef.current(), input, onProgress),
    []
  )
  const removeDoc = useCallback((docId: string) => deleteDoc(() => getTokenRef.current(), docId), [])

  return { getDocs, addDoc, removeDoc }
}
