import { SpawnPrefab } from "@/gameScript/scripts/prefabs";
import type { EntityScript } from "@/gameScript/scripts/entityscript";
import type { Ref, StyleValue } from "vue";
import type { ent } from "@/gameScript/scripts/main";

export let ThePlayer: Ref<ReturnType<typeof EntityScript> | undefined> = ref();

export class LoadGameAssets {
  public ThePlayer: ent = {} as any;
  private isLoad = ref(false);

  public IsLoad() {
    return this.isLoad;
  }

  constructor(callback: () => void) {
    this.load().then(() => {
      this.isLoad.value = true;
      this.enterFrame(performance.now());
      this.generateThorns();
      callback();
    });
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
      ThePlayer.value = this.ThePlayer;
    }).catch((error) => {
      // 处理加载模块失败的情况
      console.error("Failed to load modules:", error);
    });
  }

  enterFrame(timestamp: number) {
    requestAnimationFrame(timestamp => this.enterFrame(timestamp));
    if (!this.ThePlayer) return;
    this.ThePlayer.Physical.UpdatePosition(timestamp);
  }

  //生成尖刺
  generateThorns() {
    const num = Math.random() * 10;
    for (let i = 0; i < num; i++) {
      const inst = SpawnPrefab("thorn");
      inst.Physical.SetPosition(200, 0)
    }
  }
}
