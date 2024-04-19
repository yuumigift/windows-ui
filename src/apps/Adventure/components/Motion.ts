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
export class Motion{
    name: string
    maxHeight: number
    inst:any
    setMaxHeight(height: number) {
        this.maxHeight = height
    }
    jump(){
        this.inst.position.y ++
    }
    constructor(inst:any) {
        this.inst = inst
        this.name = "Jump"
        this.maxHeight = 1
    }
}
