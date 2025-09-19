import {AllActivePrefabs, AllPrefabs} from "@/gameScript/scripts/main";
import type {EntityScript} from "@/gameScript/scripts/entityscript";

export const Prefab = (name:string, fn:() => {}, assets:Assets[]) => {

    const s = reactive({
        fn,
        name:name,
        assets:assets,
    })
    AllPrefabs[name] = s
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

export const SpawnPrefab = (name:string):ReturnType<typeof EntityScript> => {
    const inst = AllPrefabs[name]?.fn()
    AllActivePrefabs.push(inst)
    return inst
}
