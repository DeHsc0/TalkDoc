import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

export default function DocCreation () {


    
    return (

        <Dialog>
        
            <DialogTrigger asChild> 

                <Button className="font-space bg-[#CCFF3A] hover:bg-[#CCFF3A]/80">

                    <Plus/>

                    New Doc                        

                </Button>
            </DialogTrigger>

            <DialogContent className="font-space">

                <DialogHeader>
                    <DialogTitle className="font-space text-xs text-[#CCFF3A]"> 
                        NEW DOCUMENT
                    </DialogTitle>
                </DialogHeader>

            </DialogContent>

        </Dialog>

    )

}