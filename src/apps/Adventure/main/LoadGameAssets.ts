import {SpawnPrefab} from "@/gameScript/scripts/prefabs";
import type {EntityScript} from "@/gameScript/scripts/entityscript";



export class LoadGameAssets{
    public static ThePlayer: ReturnType<typeof EntityScript>
    static async load() {
        // 异步加载所有模块
        const prefabs = import.meta.glob("@/apps/Adventure/prefabs/*.ts");
        const prefabKeys = Object.keys(prefabs);
        const importPromises = prefabKeys.map(key => import(key));

// 使用 Promise.all 等待所有模块加载完成
        Promise.resolve(importPromises).then(() => {
            // 在所有模块加载完成后执行后续代码
            this.ThePlayer = SpawnPrefab("player");
            console.log(this.ThePlayer)

        }).catch((error) => {
            // 处理加载模块失败的情况
            console.error("Failed to load modules:", error);
        });
    }
}
