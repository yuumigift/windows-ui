export const Prefab = (name:string, fn:() => {}, assets: {} = {}) => {

    const s = reactive({
        name:name,
        fn:fn,
        assets:assets,
    })
    return s
}

export const Assets = (type:string, path:string) => {

    const s = reactive({
        type:type,
        path:path,
    })
    return s
}