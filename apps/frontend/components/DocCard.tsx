import { Ellipsis, MoveRight, Pen } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useState } from "react";
import axios from "axios";

export default function DocCard (props : {

    docData : {
        title: string;
        pages: number;
        size: string;
        description: string;
        createdAt: string;
    },
    color : string

}) {

    const deleteDoc = async () => {

        const response = await axios.delete("http://localhost:3001/doc")

    }


    return (
        <div style={{

            borderColor : `${props.color}`

        }} className="h-full border-t-2 rounded-xl bg-[#1a1a1a] ">

            <div className="flex flex-col py-4 px-6">

                <div className="flex flex-col w-full pb-4 border-b">
                    
                    <div className="flex w-full justify-between">
                        <h1 className="font-rubik ">
                            {props.docData.title}
                        </h1>

                        <DropdownMenu>

                            <DropdownMenuTrigger asChild>

                                <Button size={"icon-sm"} variant={"outline"} className="">
                                    <Ellipsis />
                                </Button>

                            </DropdownMenuTrigger>
                            <DropdownMenuContent>

                                <DropdownMenuGroup>

                                    <DropdownMenuItem onClick={() => {}} className="font-rubik">

                                        Rename

                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="font-rubik">

                                        Delete

                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="font-rubik">

                                        Open Chat

                                    </DropdownMenuItem>

                                </DropdownMenuGroup>

                            </DropdownMenuContent>

                        </DropdownMenu>
                    </div>

                    <p className="font-rubik text-[#666666]">
                        {props.docData.description}
                    </p>

                </div>

                <div className="grid grid-cols-2 py-4 gap-2">

                    <div>
                        <p className="font-space text-[#666666] text-sm ">
                            PAGES 
                        </p>

                        <p>
                            { props.docData.pages}
                        </p>

                    </div>
                    <div>
                        <p className="font-space text-[#666666] text-sm ">
                            SIZE(MB)
                        </p>

                        <p>
                            {props.docData.size}
                        </p>

                    </div>
                    <div>
                        <p className="font-space text-[#666666] text-sm ">
                            CREATED 
                        </p>

                        <p>
                            {new Date(props.docData.createdAt).toLocaleDateString("en-GB" , {

                                day : "numeric",
                                month : "long",
                                year : "numeric"

                            })}
                        </p>

                    </div>


                </div>

            </div>
            
            <button style={{

                backgroundColor : `${props.color}1a`

            }} className="w-full flex justify-between py-4 items-center px-4 rounded-2xl cursor-pointer">

                <span style={{

                    color : props.color

                }} className="font-space text-sm">
                    OPEN CHAT
                </span>

                <MoveRight style={{
                    color : props.color
                }} />

            </button>


        </div>
    )

}