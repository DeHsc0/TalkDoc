"use client"
import { BookOpen } from "lucide-react"
import Silk from "../components/Silk"
import { useEffect, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Observer } from "gsap/all"
import { SignUpButton } from "@clerk/nextjs"

gsap.registerPlugin(Observer)
export default function Home() {

  

  const navContainer = useRef<HTMLDivElement | null>(null)

  const boxContainer = useRef< HTMLDivElement | null>(null)

  useGSAP(() => {

    if(!navContainer.current || !boxContainer.current )return    

    const tl = gsap.timeline({ paused : true })

    tl.to( navContainer.current , {

      width : 515

    })
    .set(boxContainer.current , {
      display : "flex"
    })
    .fromTo( boxContainer.current.children , {

      scale : 1.1,
      opacity : 0

    } , {

      scale : 1,
      opacity : 1,
      stagger : 0.4,

    } , "-=0.1")

    Observer.create({

    target : navContainer.current,
    onHover : () => tl.play(),
    onHoverEnd : () => tl.reverse(0.5)


  })
  } , { dependencies : [] , scope : navContainer })

  return (

    <div className="relative w-screen h-screen p-3">
  
      <div className="absolute inset-4 rounded-2xl overflow-hidden ">
        <Silk
          speed={5}
          scale={1}
          color="#5227ff"
          noiseIntensity={4}
          rotation={0}
        />
      </div>

      <div className="relative z-10 flex justify-center h-full p-6">

        <div className="fixed flex gap-3 items-center rounded-full backdrop-blur-sm py-4 px-6 bg-white/10 " ref={navContainer}>

              <div className="flex gap-2 items-center " >
              
                <BookOpen className="text-white"/>

                <div className="gap-4 items-center hidden" ref={boxContainer}>
                  
                  <h1 className="font-mono text-md text-white">
                    TalkDoc
                  </h1>

                  <button className="text-white text-md px-4 rounded-full ">
                    
                    Home

                  </button>

                  <button className="text-white text-md px-4 rounded-full ">
                    
                    How it Works

                  </button>

                  <SignUpButton >

                    <button className="text-white text-md px-4 rounded-full ">

                      Get Started

                    </button>
                  
                  </SignUpButton>

                
                </div>

          </div>
                            
        </div>
        
        <div className="flex flex-col justify-center items-center gap-4">
          <h1 className="text-white text-5xl font-bold font-mono">
            Your documents, finally answering back
          </h1>
          <p className="text-white/80 text-center font-mono w-3/4">
            Upload any PDF and have a real conversation with it. TalkDoc reads, understands, and pinpoints exactly where every answer lives.          
          </p>
        </div>
      </div>

    </div>

  )

}
