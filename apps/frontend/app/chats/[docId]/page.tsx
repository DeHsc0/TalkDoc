"use client"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { useEffect, useState } from "react"
import { chatsDataSchema } from "../../../types/zod"
import { z } from "zod"
import { Loader2Icon } from "lucide-react"
import ChatSideBar from "../../../components/ChatSideBar"

export default function ChatPage ( { params } : { params : Promise<{ docId : string }>} ) {


    const { getToken } = useAuth()

    const [ chatData , setChatData ] = useState<z.infer<typeof chatsDataSchema > | undefined>()

    const [ loading , setLoading ] = useState<boolean>(false)

    const fetchDocChats = async () => {

        setLoading(true)

        try{

            const response = await axios.get(`http://localhost:3001/api/chats/${(await params).docId}` , {

                headers : {
                    Authorization : `Bearer ${await getToken()}`
                }

            } )

            const parsedData = chatsDataSchema.safeParse(response.data.data)

            if(!parsedData.success)return // alert


            setChatData(() => parsedData.data)

        } catch(e){

            console.error("Unable to Fetch data: " , e) //alert

        } finally{

            setLoading(false)
        }


    }

    useEffect( () => {

        fetchDocChats()

    } , [] )
     
    return (

        loading ? <div className="flex w-full h-full justify-center items-center">

            <Loader2Icon className="text-white animate-spin size-16"/>

        </div> : <div className="flex w-full h-full">

            { chatData && <ChatSideBar docData={chatData.doc}/>}

            <div className="flex-1 h-full ">

                <div className=" border-b-2 flex justify-between px-12 py-4 items-center">

                    <div className="bg-[#1a1a1a] py-2 px-3 flex gap-3 items-center rounded-lg">

                        <div className="p-1 bg-[#CCFF3A] rounded-full">

                        </div>                    

                        <h1 className="font-rubik font-semibold text-xs text-white">
                            {chatData?.doc.title}
                        </h1>

                        <p className="font-space text-[#666666] text-xs">{chatData?.doc.pages}p</p>

                    </div>

                    <div className="bg-[#CCFF3A]/12 px-3 py-2 rounded-md flex items-center gap-2 ">

                        <div className="p-1 bg-[#CCFF3A] rounded-full animate-caret-blink">

                        </div>

                        <h1 className="text-xs font-space text-[#CCFF3A]">
                            GEMINI 3 FlASH
                        </h1>

                    </div>

                </div>

                <div className="grid grid-rows-2 h-full" id="container">

                    <div className="border border-red-800">

                    </div>
                    <div className="border border-red-800">

                    </div>


                </div>

            </div>



        </div>

    )

}