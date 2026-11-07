"use client"

import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { ApiError } from "../../lib/api"
import { useDocApi } from "../../lib/useDocApi"
import type { DashboardDoc } from "./DocCard"

export default function DeleteDocDialog({
  doc,
  open,
  onOpenChange,
  onDeleted,
}: {
  doc: DashboardDoc
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (docId: string) => void
}) {
  const { removeDoc } = useDocApi()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await removeDoc(doc.id)
      toast.success(`"${doc.title}" deleted.`)
      onOpenChange(false)
      onDeleted?.(doc.id)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Deletion failed. The document is still in your collection."
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{doc.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the document and its indexed content. Your chat history
            for this document will no longer have it as a source. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Deleting
              </>
            ) : (
              <>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete document
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
