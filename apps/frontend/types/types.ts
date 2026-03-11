import { LucideProps } from "lucide-react"
import { ForwardRefExoticComponent, RefAttributes } from "react"

type SideBarMenuState = "collection" | "settings" | "starred"
type menuItemTitle = "My Collection" | "Settings" | "Starred"

interface MenuData {

    menuState : SideBarMenuState,
    icon : ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>,
    fillColor : string,
    title : menuItemTitle

}

export { SideBarMenuState , MenuData }