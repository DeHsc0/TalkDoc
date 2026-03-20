import { File, MoveLeft } from "lucide-react";
import { Sidebar, SidebarHeader } from "./ui/sidebar";
import { Button } from "./ui/button";
import z from "zod";
import { doc } from "../types/zod"

export default function ChatSideBar ( props : { docData : z.infer<typeof doc>}) {

    return (

        <Sidebar collapsible="none" >

            <SidebarHeader className="p-6 w-full">
                
                <button className="flex  text-[13px] gap-1 hover:text-white text-[#666666] w-fit hover:cursor-pointer">

                    <MoveLeft className="size-5"/>      
                    <p className="font-space" >DASHBOARD</p>            

                </button>

                <div className="py-3 px-3 border-l-3 rounded-lg border-[#CCFF3A] bg-[#1a1a1a] flex gap-4 items-center">

                    <div className="p-2 bg-[#CCFF3A]/20 rounded-lg">
                        <File className="text-white fill-white size-5"/>
                    </div>

                    <div>

                        <h1 className="font-rubik text-white text-xs ">
                            {props.docData.title}
                        </h1>

                        <div className="flex gap-3">

                            <p className="font-space text-[#666666] text-xs ">{props.docData.pages} pages</p>
                            <p className="font-space text-[#666666] text-xs ">{ props.docData.size } mb</p>

                        </div>
                        
                    </div>                        
                    

                </div>

            </SidebarHeader>

        </Sidebar>

    )

}