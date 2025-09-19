import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";

const assets = [
    new Assets("ANIM", "")
]

const fn = () => {
    const inst = CreateEntity("thorn")
    inst.width = 50
    inst.height = 50
    inst.AddTag("build")
    inst.AddTag("trap")
    inst.AddTag("hurt")
    return inst
}

Prefab("thorn", fn, assets)