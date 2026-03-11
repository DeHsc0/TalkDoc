
import {create} from "zustand" 
import { devtools, persist } from "zustand/middleware"
import { SideBarMenuState } from "../types/types"

interface MenuState {

    menu : SideBarMenuState,
    changeMenu : (menu : SideBarMenuState ) => void

}

export const useSideBarMenu = create<MenuState>()(
  devtools(
    
    (set) => ({

        menu : "collection",
        changeMenu : ( menu ) => set({ menu })  

    }),

    { name: "SideBar Menu Store" }
    
  )
)

