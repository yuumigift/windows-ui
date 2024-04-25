import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";
import {Health} from "@/apps/Adventure/components/Health";

const assets = [
    new Assets("ANIM", "")
]

const fn = () => {
    const inst = CreateEntity("player")
    const health = new Health()
    inst.AddComponent(health)
    inst.AddTag("player")
    return inst
}

export const player = Prefab("player", fn, assets)

