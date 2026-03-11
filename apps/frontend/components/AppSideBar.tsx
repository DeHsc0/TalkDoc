"use client"
import { Folder, Settings, Star } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu } from "./ui/sidebar";
import { MenuData } from "../types";
import { useSideBarMenu } from "../store";
import { useEffect } from "react";

export default function AppSideBar () {

    const menuItems : MenuData[] = [
        
        {

            menuState : "collection",
            icon : Folder,
            fillColor : "amber-300",
            title : "My Collection"

        },
            
        {

            menuState : "starred",
            icon : Star,
            fillColor : "amber-300",
            title : "Starred"
            

        },
        
        {

            menuState : "settings",
            icon : Settings,
            fillColor : "stone-500",
            title : "Settings"

        },

    ]

    const { menu , changeMenu } = useSideBarMenu()

    return (

        <Sidebar collapsible="none" className="w-2/12" >

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
                <div className="flex justify-center py-6 px-4 flex-col gap-5">

                    {

                        menuItems.map((item) => {
                            

                            return (
                                <div key={menuItems.indexOf(item)} className="flex justify-center ">
                                    
                                    <div  onClick={() => changeMenu(item.menuState) } className={`p-2 select-none ${ item.menuState === menu && "bg-[#CCFF3A]/10" } hover:bg-[#CCFF3A]/10 rounded-md w-full flex border-2 border-transparent cursor-pointer items-center gap-2`} >

                                        <item.icon className={`size-4 fill-${item.fillColor} text-transparent`} />

                                        <h1 className="font-rubik text-sm font-medium ">
                                            {item.title}
                                        </h1>

                                    </div>
                                    
                                </div>

                            )

                        })

                    }
                
                </div>
                           
            </SidebarContent>   
            
        </Sidebar>

    )

}
