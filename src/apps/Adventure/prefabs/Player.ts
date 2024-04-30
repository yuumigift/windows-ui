import {CreateEntity} from "@/gameScript/scripts/mainfunctions";
import {Assets, Prefab} from "@/gameScript/scripts/prefabs";
import {Health} from "@/apps/Adventure/components/Health";
import type {EntityScript} from "@/gameScript/scripts/entityscript";
import {Toward} from "@/gameScript/scripts/utils/MapEnum";

const assets = [
    new Assets("ANIM", "")
]
type Direction = "ArrowUp" | "ArrowLeft" | "ArrowRight";
type Control = Record<Direction, () => void>;

const RegisterKeyListen = (inst:ReturnType<typeof EntityScript>) => {
    const phy = inst.Physical
    const toward = phy.toward
    const fn = (tow:string, x:number, y:number) => {
        if (!toward[tow]){
            phy.SetInitialVelocity(x ,y)
            toward[tow] = true
        }
    }
    const control: Control = {
        ArrowUp: () => fn(Toward.UP, 0, phy.playerJumpPower),
        ArrowLeft: () => {
            toward[Toward.LEFT] = true
        },
        ArrowRight: () => {
            toward[Toward.RIGHT] = true
        },
    };
    const motion = (key: Direction) => {
         control[key]();
    };
    const isDirectionKey = (key: string): key is Direction => {
        const keys = ["ArrowUp", "ArrowLeft", "ArrowRight"];
        return keys.includes(key);
    };

    addEventListener("keydown", (e) => {
        if (isDirectionKey(e.key)) {
            motion(e.key);
        }
    });
    addEventListener("keyup", (e) => {
        switch (e.key) {
            case "ArrowUp": {
                phy.toward[Toward.UP] = false
                break;
            }
            case "ArrowLeft": {
                phy.toward[Toward.LEFT] = false
                break;
            }
            case "ArrowRight": {
                phy.toward[Toward.RIGHT] = false
                break;
            }
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
