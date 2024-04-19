export const Prefab = (name:string, fn:() => {}, assets:Assets[]) => {

    const s = reactive({
        name:name,
        fn:fn,
        assets:assets,
    })
    return s
}

export class Assets {

    private type:string
    private path:string
    constructor(type:string, path:string) {
        this.type = type
        this.path = path
    }
}
