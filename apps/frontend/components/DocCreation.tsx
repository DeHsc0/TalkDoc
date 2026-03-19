import { FolderOpen, Loader2, MoveRight, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { doc, docCreationSchema, docSchema } from "../types/zod";
import z from "zod";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function DocCreation ( props : { addDoc : (addedDocData : z.infer<typeof doc>) => void  }) {

    const { getToken } = useAuth()

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [ loading , setLoading ] = useState<boolean>(false)

    const [ open  , setOpen ] = useState<boolean>(false)
    
    const { register , handleSubmit , setValue , watch , reset} = useForm({

        resolver : zodResolver(docCreationSchema)

    })

    const handleDocCreation = async (data : z.infer<typeof docCreationSchema>) => {

        setLoading(true)

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description || "");
        formData.append("document", data.document);
        
        const response = await axios.post("http://localhost:3001/api/doc" , formData , {
            headers : {
                Authorization : `Bearer ${await getToken()}`
            }
        })

        if(response.status !== 200) return // alert
        
        const parsedData = doc.safeParse(response.data.data)

        if(!parsedData.success)return // alert

        props.addDoc(parsedData.data)
        
        setLoading(false)

        setOpen(false)

    }

    const handleFileChange = ( e : React.ChangeEvent<HTMLInputElement>) => {

        const file = e.target.files?.[0]

        if(!file)return // alert
        
        setValue("document" , file)

    }
    
    return (

        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) reset() }}>
        
            <DialogTrigger asChild> 

                <Button className="font-space bg-[#CCFF3A] hover:bg-[#CCFF3A]/80">

                    <Plus/>

                    New Doc                        

                </Button>
            </DialogTrigger>

            <DialogContent className="">

                <DialogHeader>
                    <DialogTitle className="font-space text-xs text-[#CCFF3A]"> 
                        NEW DOCUMENT
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleDocCreation)} className="flex flex-col gap-2">
                    <h1 className="font-rubik text-xl font-semibold">
                        Create a TalkDoc
                    </h1>

                    { loading ? <div className=" py-28 gap-4 w-full flex flex-col items-center justify-center">

                        <Loader2 className="animate-spin text-white size-16" />

                        <p className="text-md text-white font-rubik">This may take a while....</p>

                    </div> : <div className="flex flex-col gap-4">

                        <div className="flex flex-col gap-2 group">

                            <label className="text-xs text-[#CCFF3A] font-space group-focus-within:text-[#666666] transition-colors duration-300">
                                Title
                            </label>

                            <input required placeholder="eq. Q4 Investor Report 2025" className="border-2 border-[#666666] rounded-md p-2 focus:border-[#CCFF3A] focus:outline-none hover:border-[#CCFF3A] transition-colors duration-200 font-rubik text-sm" type="text" {...register("name")} />

                        </div>

                        <div className="flex flex-col gap-2 group">

                            <label className="text-xs text-[#CCFF3A] font-space group-focus-within:text-[#666666] transition-colors duration-300">
                                Description
                            </label>

                            <textarea rows={4} placeholder="eq. Q4 Investor Report 2025" className="border-2 border-[#666666] rounded-md p-2 focus:border-[#CCFF3A] hover:border-[#CCFF3A] focus:outline-none resize-none transition-colors duration-200 font-rubik text-sm" {...register("description")} />

                        </div>

                        <div>

                            <input className="hidden" required accept={"application/pdf"} onChange={(e) => handleFileChange(e)} ref={fileInputRef} type="file"/>
                            
                            <div onClick={() => {

                                if(!watch("document"))return fileInputRef.current?.click()

                            }} className="h-44 flex flex-col justify-center items-center rounded-lg border-dashed border-2 border-[#666666] hover:border-[#CCFF3A]">


                                <FolderOpen className="fill-amber-400 text-transparent size-10"/>

                                <div className="flex flex-col items-center">

                                    <h1 className="font-rubik">
                                        { watch("document") ? watch("document").name  :"Attack a PDF"} 
                                    </h1>
                                    
                                    <span className="font-rubik text-sm text-[#666666]">
                                        { watch("document") ? `Size: ${(watch("document").size / (1024 * 1024)).toFixed(2)} MB ` :"Drag & drop or click to browse"}
                                    </span>  

                                </div>

                            </div>

                        </div>

                        <div className="flex justify-between">

                            <DialogClose asChild>

                                <Button size={"lg"} variant={"destructive"}>
                                    Cancel
                                </Button>

                            </DialogClose>


                            <Button type="submit" size={"lg"} className="font-space bg-[#CCFF3A]">
                                Create
                            </Button>

                        </div>

                    </div>
                    }

                </form>

            </DialogContent>

        </Dialog>

    )

}