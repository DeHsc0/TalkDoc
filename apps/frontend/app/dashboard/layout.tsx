
import { Space_Mono , Rubik} from "next/font/google"
import { SidebarProvider } from "../../components/ui/sidebar"
import AppSideBar from "../../components/AppSideBar"

const spaceMono = Space_Mono({
  weight : "700",
  variable : "--font-space-mono"
})

const rubik = Rubik({

  variable : "--font-rubik"

})


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      
      <main className={`${spaceMono.variable} ${rubik.variable} flex w-full`}>
    
        {children}
      </main>
    
    </SidebarProvider>
  )
}