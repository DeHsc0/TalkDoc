"use client"

import { CloudUpload, FileText, Loader2, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { docCreationSchema } from "../../types/zod"
import { ApiError } from "../../lib/api"
import { useDocApi } from "../../lib/useDocApi"

type UploadForm = z.infer<typeof docCreationSchema>
type UploadStage = "idle" | "uploading" | "processing"

export default function DocUploadDialog({
  onUploaded,
  trigger,
}: {
  onUploaded: () => void
  trigger?: React.ReactNode
}) {
  const { addDoc } = useDocApi()
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<UploadStage>("idle")
  const [serverError, setServerError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [progressPercent, setProgressPercent] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const processingStartedAt = useRef(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(docCreationSchema),
    defaultValues: { name: "", description: "" },
  })

  const selectedFile = watch("document")

  const setFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      if (file.type !== "application/pdf") {
        setError("document", { message: "Only PDF files are supported." })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("document", {
          message: `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 5 MB.`,
        })
        return
      }
      clearErrors("document")
      setValue("document", file, { shouldValidate: true })
      if (!getValues("name")) {
        const baseName = file.name.replace(/\.pdf$/i, "").slice(0, 150)
        if (baseName) setValue("name", baseName, { shouldValidate: true })
      }
    },
    [clearErrors, setError, setValue, getValues]
  )

  // Guard against duplicate submissions if the dialog unmounts mid-flight.
  useEffect(() => {
    return () => setStage("idle")
  }, [])

  const resetAndClose = () => {
    setOpen(false)
    setStage("idle")
    setServerError(null)
    setProgressPercent(null)
    reset()
  }

  const onSubmit = handleSubmit(async (data) => {
    if (stage !== "idle") return
    setServerError(null)
    setStage("uploading")
    processingStartedAt.current = Date.now()

    try {
      await addDoc(
        { name: data.name, description: data.description, document: data.document },
        (progress) => {
          setProgressPercent(progress.percent)
          if (progress.percent === null || progress.percent >= 100) {
            const elapsed = Date.now() - processingStartedAt.current
            if (elapsed > 400) setStage("processing")
          }
        }
      )
      toast.success(`"${data.name}" is ready in your collection.`)
      onUploaded()
      resetAndClose()
    } catch (error) {
      setStage("idle")
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Upload failed. Check your connection and try again."
      )
    }
  })

  const busy = stage !== "idle"

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (busy) return
        setOpen(isOpen)
        if (!isOpen) {
          reset()
          setServerError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-amber-signal font-space text-sm font-bold text-primary-foreground hover:bg-amber-signal/90">
            Upload document
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-space text-xs tracking-[0.3em] text-amber-signal uppercase">
            New document
          </DialogTitle>
          <p className="text-lg font-medium tracking-tight text-ivory">Upload a PDF</p>
          <DialogDescription>
            TalkDoc reads every page, then you ask it anything. PDFs up to 5 MB.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
          {/* Dropzone */}
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              if (busy) return
              setFile(event.dataTransfer.files?.[0])
            }}
            className={`flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors ${
              dragActive ? "border-amber-signal bg-amber-signal/5" : "border-input"
            } ${busy ? "opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                setFile(event.target.files?.[0])
                event.target.value = ""
              }}
            />

            {selectedFile ? (
              <div className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-left">
                <FileText className="size-5 shrink-0 text-amber-signal" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ivory">{selectedFile.name}</p>
                  <p className="font-space text-[10px] tracking-wider text-muted-foreground uppercase">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-ivory"
                  disabled={busy}
                  aria-label="Remove selected file"
                  onClick={() => {
                    setValue("document", undefined as unknown as File, { shouldValidate: false })
                    fileInputRef.current?.focus()
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <CloudUpload className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-ivory">Drag your PDF here</p>
                <p className="font-space text-[10px] tracking-wider text-muted-foreground uppercase">
                  or browse files, PDF only, max 5 MB
                </p>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 font-space text-[10px] tracking-[0.2em] uppercase"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? "Choose another file" : "Browse files"}
            </Button>
          </div>
          {errors.document ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.document.message}
            </p>
          ) : null}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="doc-title" className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              Title
            </label>
            <Input
              id="doc-title"
              placeholder="e.g. Q3 platform architecture"
              autoComplete="off"
              className="text-base sm:text-sm"
              {...register("name")}
            />
            {errors.name ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="doc-description" className="font-space text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              Description <span className="normal-case">(optional)</span>
            </label>
            <textarea
              id="doc-description"
              rows={2}
              placeholder="What is this document for?"
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base text-ivory placeholder:text-muted-foreground focus-visible:border-amber-signal/50 focus-visible:outline-none sm:text-sm"
              {...register("description")}
            />
            {errors.description ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {serverError ? (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-signal font-space font-bold text-primary-foreground hover:bg-amber-signal/90"
              disabled={busy || !selectedFile}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {stage === "uploading"
                    ? progressPercent !== null && progressPercent < 100
                      ? `Uploading ${progressPercent}%`
                      : "Uploading"
                    : "Processing document"}
                </>
              ) : (
                "Upload and process"
              )}
            </Button>
          </div>

          {stage === "processing" ? (
            <p className="font-space text-[10px] tracking-wider text-muted-foreground uppercase" aria-live="polite">
              Reading and indexing every page. This can take a moment for long documents.
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  )
}
