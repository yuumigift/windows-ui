import {SpawnPrefab} from "@/gameScript/scripts/prefabs";
import type {EntityScript} from "@/gameScript/scripts/entityscript";
import type {StyleValue} from "vue";


export class LoadGameAssets {
    public ThePlayer: ReturnType<typeof EntityScript> = {} as any
    private isLoad = false
    public IsLoad() {
        return this.isLoad;
    }
    constructor(callback:()=>void) {
        this.load().then(() => {
            this.isLoad = true;
            this.enterFrame()
            callback()
        })
    }
    async load() {
        // 异步加载所有模块
        const prefabs = import.meta.glob("@/apps/Adventure/prefabs/*.ts");
        const prefabKeys = Object.keys(prefabs);
        const importPromises = prefabKeys.map(async key => await import(key));

// 使用 Promise.all 等待所有模块加载完成
        await Promise.all(importPromises).then(() => {
            // 在所有模块加载完成后执行后续代码
            this.ThePlayer = SpawnPrefab("player");
        }).catch((error) => {
            // 处理加载模块失败的情况
            console.error("Failed to load modules:", error);
        });
    }
    enterFrame() {
        requestAnimationFrame(() => this.enterFrame());
        this.ThePlayer.Physical.UpdatePosition()
    }
    public Init(){
        return (() => {
            const getPosition = computed(() :StyleValue=>{
                return {
                    marginLeft:`${s.pos.x}px`,
                    marginBottom:`${s.pos.y}px`,
                }
            })
            const s = reactive({
                player:this.ThePlayer as ReturnType<typeof EntityScript>,
                pos:{} as any,
                getPosition
            });
            s.pos = s.player.Physical.pos
            return s;
        })()
    }
}
