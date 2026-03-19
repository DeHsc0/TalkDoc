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

    const [ chatData , setChatData ] = useState<z.infer<typeof chatsDataSchema >>([])

    const [ loading , setLoading ] = useState<boolean>(false)

    const fetchDocChats = async () => {

        setLoading(true)

        const response = await axios.get(`http://localhost:3001/api/chats/${(await params).docId}` , {

            headers : {
                Authorization : `Bearer ${await getToken()}`
            }

        } )

        const parsedData = await chatsDataSchema.safeParse(response.data.data)

        if(!parsedData.success)return // alert

        setChatData(() => parsedData.data)

        setLoading(false)

    }   

    useEffect( () => {

        fetchDocChats()

    } , [] )
     
    return (

        loading ? <div className="flex w-screen h-screen justify-center items-center">

            <Loader2Icon className="text-white animate-spin size-16"/>

        </div> : <div>

            <ChatSideBar/>


        </div>

    )

}