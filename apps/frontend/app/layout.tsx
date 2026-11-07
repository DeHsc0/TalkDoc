import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Mono, Rubik } from "next/font/google";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const rubik = Rubik({
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "TalkDoc, your documents, answering back",
  description:
    "Drop in your PDFs, ask the questions that matter, and turn pages of information into conversations that move your work forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${spaceMono.variable} ${rubik.variable} antialiased bg-background text-foreground`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
