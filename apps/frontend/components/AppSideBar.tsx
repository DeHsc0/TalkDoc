
import { Folder } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu } from "./ui/sidebar";

export default function AppSideBar () {

    const menuItems = ["Collection" , "Starred" , "Settings"]

    
    return (

        <Sidebar>

            <SidebarHeader className="p-8 border-b-2 border-b-[#1a1a1a]">

                <div className="">

                    <div className="flex gap-1 items-center">
                        <h1 className="text-[#CCFF3A] text-xl font-space font-bold">
                            Talk 
                        </h1>
                        <span className="text-white text-xl font-space font-bold">Doc</span>
                    </div>
                    <p className="text-xs text-[#666666] font-space ">DASHBOARD</p>
                    
                </div>

            </SidebarHeader>      

            <SidebarContent>

                <div className="flex justify-center py-6 px-4">

                    <div className="p-2 bg-[#CCFF3A]/10 rounded-md w-full flex justify-center border-2 items-center gap-2" >

                        <Folder className="size-4 fill-amber-300 text-transparent" />

                        <h1 className="font-rubik text-sm font-medium ">
                            My Documents
                        </h1>

                    </div>

                </div>
                                
            </SidebarContent>   
            
        </Sidebar>

    )

}