<template>
  <!-- 整个 app 只有一个舞台壳层，真实绘制由内部 canvas 完成。 -->
  <div class="tank_game">
    <div class="stage_shell">
      <!-- Game.mount 会在这里插入 canvas，并驱动整场对局。 -->
      <div ref="stageRef" class="stage" :style="game.viewportStyle"></div>

      <!-- HUD 只展示最核心的战局信息。 -->
      <div class="hud">
        <div class="badge">得分 {{ game.score.value }}</div>
        <div class="badge">地图 32 x 32</div>
        <div class="badge">视口 16 x 16</div>
      </div>

      <!-- 角落保留操作说明，避免首次进入不知道键位。 -->
      <div class="legend">
        <span>WASD / 方向键移动</span>
        <span>空格 / J 发射</span>
      </div>

      <!-- 游戏结束后显示结算层，底下仍保留最后一帧战场画面。 -->
      <div v-if="game.over.value" class="game_over">
        <div class="panel">
          <div class="title">基地失守</div>
          <div class="summary">本局得分：{{ game.score.value }}</div>
          <button class="restart" @click="game.restart()">重新开始</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Game } from "./classes/Game";

/** 舞台容器引用，供 Game 在 mounted 后挂载 canvas。 */
const stageRef = useTemplateRef("stageRef");

/** 游戏主控制器，内部维护状态、更新循环和渲染。 */
const game = new Game();

onMounted(() => {
  // 只有容器真正挂到 DOM 后，才能安全创建 canvas 并启动循环。
  if (stageRef.value) {
    game.mount(stageRef.value);
  }
});

onBeforeUnmount(() => {
  // 组件销毁时同步清理动画循环和全局键盘监听。
  game.destroy();
});
</script>

<style lang="less" scoped>
/* 整个界面使用偏土黄与焦褐色，营造战场与钢铁感。 */
.tank_game {
  display: flex;
  align-items: center;
  justify-content: center;
  display: grid;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: radial-gradient(circle at top, rgba(255, 201, 92, 0.12), transparent 42%), linear-gradient(180deg, #504232 0%, #2f261d 100%);
  padding: 8px;
  box-sizing: border-box;
}

.stage_shell {
  /* 外框模拟街机柜台的金属包边。 */
  position: relative;
  overflow: hidden;
  border: 4px solid rgba(255, 218, 152, 0.36);
  border-radius: 24px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.stage {
  /* 实际尺寸由 Game.viewportStyle 提供，这里作为基础兜底。 */
  width: 768px;
  height: 768px;
  background: #16120d;
}

.hud {
  /* HUD 浮在画面上层，不参与 canvas 本身绘制。 */
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 10px;
}

.badge {
  border: 1px solid rgba(255, 225, 178, 0.2);
  border-radius: 999px;
  background: rgba(16, 12, 8, 0.78);
  padding: 7px 12px;
  color: #f7ead0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.legend {
  /* 操作提示放在右下角，尽量避免挡住主战区。 */
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 16px;
  background: rgba(16, 12, 8, 0.74);
  padding: 12px 14px;
  color: rgba(247, 234, 208, 0.92);
  font-size: 13px;
}

.game_over {
  /* 失败时加一层半透明遮罩，把视觉重心拉到面板上。 */
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 7, 5, 0.6);
  backdrop-filter: blur(3px);
}

.panel {
  /* 面板保持半透明，保留一点战场氛围。 */
  display: flex;
  min-width: 260px;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(255, 225, 178, 0.18);
  border-radius: 20px;
  background: rgba(32, 24, 17, 0.92);
  padding: 28px 32px;
  color: #f7ead0;
}

.title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.summary {
  font-size: 18px;
}

.restart {
  /* 按钮使用更亮的暖色，便于快速定位重开操作。 */
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #f7c25c, #d96b2b);
  cursor: pointer;
  padding: 10px 24px;
  color: #2d1f13;
  font-size: 16px;
  font-weight: 800;
}
</style>
