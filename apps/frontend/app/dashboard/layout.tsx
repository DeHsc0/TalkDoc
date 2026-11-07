export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-svh w-full bg-background">{children}</div>
}
