import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";
import {Health} from "@/apps/Adventure/components/Health";
import type {EntityScript} from "@/gameScript/scripts/entityscript";
import {AdventurePhysical} from "@/apps/Adventure/main/Physical";

const assets = [
    new Assets("ANIM", "")
]
type Direction = "ArrowUp" | "ArrowLeft" | "ArrowRight";
type Control = Record<Direction, () => void>;

const RegisterKeyListen = (inst:ReturnType<typeof EntityScript>) => {
    const phy = inst.Physical
    const speed = AdventurePhysical.XPOWER
    const control: Control = {
        ArrowUp: () => {
            phy.SetInitialVelocity(0 ,90)
        },
        ArrowLeft: () => {
            phy.SetInitialVelocity(-30 ,0)
        },
        ArrowRight: () => {
            phy.SetInitialVelocity(30 ,0)
        },
    };
    const motion = (key: Direction) => {
         control[key]();
    };
    const isDirectionKey = (key: string): key is Direction => {
        const keys = ["ArrowUp", "ArrowLeft", "ArrowRight"];
        return keys.includes(key);
    };

    window.addEventListener("keydown", (e) => {
        if (isDirectionKey(e.key)) {
            motion(e.key);
        }
    });
}

const fn = () => {
    const inst = CreateEntity("player")
    const health = new Health()
    inst.AddComponent(health)
    inst.AddTag("player")
    RegisterKeyListen(inst)
    return inst
}

Prefab("player", fn, assets)
