"use client"
import { Columns, Grid, Loader2Icon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Input } from "../../components/ui/input";
import { useEffect, useState } from "react";
import axios from "axios";
import { docSchema } from "../../types/zod"
import z from "zod";
import AppSideBar from "../../components/AppSideBar";
import DocCard from "../../components/DocCard";
import { useAuth } from "@clerk/nextjs";
import DocCreation from "../../components/DocCreation";

export default function Dashboard () {

    const [ gridState , setGridState ] = useState<"grid" | "col">("grid")

    const [ docData , setDocData ] = useState<z.infer<typeof docSchema>>([])

    const [ loading , setLoading ] = useState<boolean>(true) 

    const { getToken }  = useAuth()

    const fetchDocs = async () => {

        const response = await axios.get( "http://localhost:3001/api/doc/" , {

            headers : {

                Authorization : `Bearer ${ await getToken()}`

            }

        } )

        const parsedResponse = docSchema.safeParse(response.data.response)

        if(!parsedResponse.success){
            //alert
            console.log("Failed to validate")
            return            
        }

        setDocData(() => parsedResponse.data)        
        setLoading(false)
    }

    useEffect(() => {

        fetchDocs()       
        

    } , [])

    return (
    
        !loading ? <div className="flex w-full">

            <AppSideBar  />

            <div className="w-full">

                <div className="w-full py-4 px-6 border-b-2 flex justify-between">

                    <Input placeholder="🔍 Search documents..." className="font-rubik text-white/80 w-1/4"/>
                    <div className="flex gap-4 items-center">

                        <ToggleGroup defaultValue={gridState} className="border" type="single" onValueChange={ (val : "grid" | "col")  => setGridState(val)}>
                            <ToggleGroupItem value="grid">
                                <Grid/>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="col">
                                <Columns/>
                            </ToggleGroupItem>
                        </ToggleGroup>

                        <DocCreation addDoc={(item) => setDocData( [ ...docData, item ] )} />
                        
                    </div>

                </div>        

                <div className="py-8 px-6">

                    <div>

                        <h1 className="font-rubik text-2xl ">
                            My Documents
                        </h1>

                        <p className="font-sans text-[#666666]" >{docData.length} documents</p>
                                        
                    </div>                

                    <div className="grid grid-cols-3 mt-5 gap-5 ">

                        {

                            docData.map((item) => {

                                return <DocCard deleteDoc={(id: string) => setDocData(prev => prev.filter(item => item.id !== id))} key={docData.indexOf(item)} docData={item} />

                            })

                        }
                        

                    </div>
                                
                </div>           

            </div>

        </div>

     : <div  className="w-full h-full flex justify-center items-center">
        <Loader2Icon className="animate-spin size-10"/>
     </div>
    )


}