import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";
import {Jump} from "@/apps/Adventure/components/Jump";

const assets = [
    Assets("ANIM", "")
]

const fn = () => {
    const inst = CreateEntity("player")
    inst.AddComponent(Jump())
    inst.components.Jump.setMaxHeight(1)
    return inst
}

export const player = Prefab("player", fn, )