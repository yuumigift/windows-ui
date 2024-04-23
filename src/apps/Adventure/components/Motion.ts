import type {EntityScript} from "@/gameScript/scripts/entityscript";
import {RegisterComponent} from "@/gameScript/scripts/entityscript";

/*export const motion = (inst:any) => {

    const setMaxHeight = (height: number) => {
        s.maxHeight = height
    }

    const jump = () => {
        s.inst.position.y ++
    }

    const s = reactive({
        name: 'Jump',
        maxHeight: 1,
        inst:inst,
        setMaxHeight,
        jump
    })
    return s
}*/
export class Motion extends RegisterComponent{
    maxHeight = 1
    setMaxHeight(height: number) {
        this.maxHeight = height
    }
    jump(){
        if (this.inst.components.health.isAlive()){
            this.inst.position.y ++
        }
    }
    constructor() {
        super();
    }
}
