"use client"
import { Columns, Grid, Plus } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Input } from "../../components/ui/input";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import axios from "axios";

export default function Dashboard () {

    const [ gridState , setGridState ] = useState<"grid" | "col">("grid")
    const [ loading , setLoading] = useState<boolean>(true) 

    const fetchDocs = async () => {

        const response = await axios.post( "http://localhost:3001/api/doc/" , {
            
            userId : "62543b6c-aeee-4a71-9804-fc44cd010803" // replace

        })

        console.log(response)
        
    }

    useEffect(() => {

        fetchDocs()       
        

    } , [])
    
    return (

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

                    <Button className="font-space bg-[#CCFF3A] hover:bg-[#CCFF3A]/80">

                        <Plus/>

                        New Doc                        

                    </Button>
                    
                </div>

            </div>        

            <div className="py-8 px-6">

                <div>

                    <h1 className="font-rubik text-2xl ">
                        My Documents
                    </h1>

                    <p className="font-sans text-[#666666]" >6 documents</p>
                                    
                </div>                
                            
            </div>           

        </div>

    )


}