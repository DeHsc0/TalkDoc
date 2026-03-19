import { Ellipsis, MoveRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import axios from "axios";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function DocCard (props : {

    docData : {
        id : string
        title: string
        pages: number
        size: string
        description: string
        createdAt: string
    },

    deleteDoc : (id : string) => void

}) {

    const { getToken } = useAuth()

    const router = useRouter()

    const colors : string[] = [ "#4D65FF" , "#CCFF3A" , "#FF4444" , "#FFB800" , "#702949" , "#00D4AA" , "#FF6B35" ]

    const handleDocDelete = async () => {

        const response = await axios.delete(`http://localhost:3001/api/doc/${props.docData.id}` , {

            headers : {
                Authorization : `Bearer ${ await getToken()}`
            }

        } )

        if(response.status !== 200)return // alert
        
        props.deleteDoc(props.docData.id)


    }

    const [nativeColor , setNativeColor] = useState<string>(colors[Math.floor(Math.random() * colors.length)] || "#000000")


    return (
        <div style={{

            borderColor : `${nativeColor}`

        }} className="h-full border-t-2 rounded-xl bg-[#1a1a1a] flex flex-col">

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

                                    <DropdownMenuItem className="font-rubik">

                                        Rename

                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocDelete() } className="font-rubik">

                                        Delete

                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push(`/chat/${props.docData.id}`)} className="font-rubik">

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

                backgroundColor : `${nativeColor}1a`

            }} onClick={() => router.push(`/chat/${props.docData.id}`)} className="mt-auto w-full flex justify-between py-4 items-center px-4 rounded-2xl cursor-pointer">

                <span style={{

                    color : nativeColor

                }} className="font-space text-sm">
                    OPEN CHAT
                </span>

                <MoveRight style={{
                    color : nativeColor
                }} />

            </button>


        </div>
    )

}