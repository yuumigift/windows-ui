import {EntityScript} from "@/gameScript/scripts/entityscript";

export const motion = (inst:any) => {

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
}
