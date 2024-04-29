import {SpawnPrefab} from "@/gameScript/scripts/prefabs";
import type {EntityScript} from "@/gameScript/scripts/entityscript";


export class LoadGameAssets {
    public ThePlayer: ReturnType<typeof EntityScript> = {} as any
    private isLoad = false
    public IsLoad() {
        return this.isLoad;
    }

    constructor() {
        this.load().then(() => {
            this.isLoad = true;
            this.enterFrame()
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
            const getPosition = () => {
                const pos = s.player.Physical.GetPosition()
                return {
                    marginLeft:pos.x,
                    marginBottom:pos.y,
                }
            }
            const s = reactive({
                player:this.ThePlayer as ReturnType<typeof EntityScript>,
                getPosition
            });

            return s;
        })()
    }
}
