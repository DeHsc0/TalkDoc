import { MoveLeft } from "lucide-react";
import { Sidebar, SidebarHeader } from "./ui/sidebar";
import { Button } from "./ui/button";

export default function ChatSideBar () {

    return (

        <Sidebar>

            <SidebarHeader className="p-6 w-full flex items-center">
                
                <button className="flex items-center text-[13px] gap-1 hover:text-white text-[#666666] w-fit hover:cursor-pointer">

                    <MoveLeft className="size-5"/>      
                    <p className="font-space" >DASHBOARD</p>            

                </button>

            </SidebarHeader>

        </Sidebar>

    )

}