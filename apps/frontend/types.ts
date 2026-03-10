import { LucideProps } from "lucide-react"
import { ForwardRefExoticComponent, RefAttributes } from "react"

type SideBarMenuState = "collection" | "settings" | "starred"

interface MenuData {

    key : SideBarMenuState,
    icon : ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>

}

export { SideBarMenuState , MenuData }