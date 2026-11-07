"use client"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

export function formatPages(pages: number | null | undefined): string {
  if (pages === null || pages === undefined) return "—"
  return `${pages} page${pages === 1 ? "" : "s"}`
}

export function formatSize(size: number | string | null | undefined): string {
  if (size === null || size === undefined || size === "") return "—"
  const value = typeof size === "string" ? Number(size) : size
  if (Number.isNaN(value)) return "—"
  return `${value.toFixed(2)} MB`
}
