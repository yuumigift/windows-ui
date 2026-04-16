<template>
  <div class="plane_game">
    <canvas ref="canvas" width="800" height="600"></canvas>
    <div class="hud">得分：{{ game.score.value }}</div>
    <div v-if="game.over.value" class="game_over">
      <div class="panel">
        <div class="title">撞墙啦，再开一局吧</div>
        <div class="score">本局得分：{{ game.score.value }}</div>
        <button class="restart" @click="game.restart()">重新开始</button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Game } from "./classes/Game";

const canvas = useTemplateRef("canvas");
const game = new Game();
game.start(canvas);
</script>

<style lang="less" scoped>
.plane_game {
  position: relative;
  width: 800px;
  height: 600px;
}

.hud {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 5;
  border-radius: 999px;
  background: #0007;
  padding: 8px 14px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

.game_over {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #0009;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel {
  display: flex;
  min-width: 280px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-radius: 20px;
  background: #ffffffee;
  padding: 28px 32px;
  box-shadow: 0 12px 40px #0004;
}

.title {
  color: #1f2937;
  font-size: 30px;
  font-weight: 700;
}

.score {
  color: #475569;
  font-size: 18px;
}

.restart {
  transition: 0.2s ease;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #60a5fa, #2563eb);
  cursor: pointer;
  padding: 10px 24px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px #2563eb55;
  }
}
</style>
