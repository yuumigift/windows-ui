import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";
import {Motion, motion} from "@/apps/Adventure/components/Motion";

const assets = [
    new Assets("ANIM", "")
]

const fn = () => {
    const inst = CreateEntity("player")
    inst.AddComponent(Motion)
    const motion1 = inst.components.motion as ReturnType<typeof motion>
    motion1.setMaxHeight(1)
    return inst
}

export const player = Prefab("player", fn, assets)
