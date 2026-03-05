"use client"
import { BookOpen } from "lucide-react"
import Silk from "../components/Silk"
import { useEffect, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Observer } from "gsap/all"

export default function Home() {

  gsap.registerPlugin(Observer)

  const container = useRef<HTMLDivElement | null>(null)

  useEffect(() => {

    if(!container)return    
    Observer.create({

    target : container.current,
    onHover : () => {

      gsap.to(container , {

        width : 

      })

    }


  })
  } , [container])
  
  return (

    <div className="relative w-screen h-screen p-3">
  
      <div className="absolute inset-4 rounded-2xl overflow-hidden ">
        <Silk
          speed={0}
          scale={1}
          color="#5227ff"
          noiseIntensity={6}
          rotation={0}
        />
      </div>

      <div className="relative z-10 flex justify-center h-full p-6">

        <div className="fixed items-center rounded-full backdrop-blur-sm py-4 px-6 bg-white/10" ref={container}>

          <BookOpen className="text-white"/>
                            
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
