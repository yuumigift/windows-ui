import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";
import {motion} from "@/apps/Adventure/components/Motion";

const assets = [
    new Assets("ANIM", "")
]

const fn = () => {
    const inst = CreateEntity("player")
    inst.AddComponent(motion)
    inst.components.motion.setMaxHeight(1)
    return inst
}

export const player = Prefab("player", fn, assets)
