import { Ellipsis, MoveRight } from "lucide-react";
import { Button } from "./ui/button";

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



    return (
        <div style={{

            borderColor : `${props.color}`

        }} className="h-full border-t-2 rounded-xl bg-[#1a1a1a] ">

            <div className="flex flex-col py-4 px-6">

                <div className="flex justify-between items-center w-full pb-4 border-b">
                    
                    <h1 className="font-rubik ">
                        Risk Asset Framework
                    </h1>

                    <Button size={"icon-sm"} variant={"outline"} className="">
                        <Ellipsis />
                    </Button>

                </div>

                <div className="grid grid-cols-2 py-4 gap-2">

                    <div>
                        <p className="font-space text-[#666666] text-sm ">
                            PAGES 
                        </p>

                        <p>
                            67
                        </p>

                    </div>
                    <div>
                        <p className="font-space text-[#666666] text-sm ">
                            SIZE(MB)
                        </p>

                        <p>
                            2.1
                        </p>

                    </div>
                    <div>
                        <p className="font-space text-[#666666] text-sm ">
                            CREATED 
                        </p>

                        <p>
                            8 March 2019
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