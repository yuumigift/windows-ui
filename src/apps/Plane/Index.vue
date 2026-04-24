<template>
  <div class="plane_game">
    <div class="sky">
      <div class="cloud c1"></div>
      <div class="cloud c2"></div>
      <div class="cloud c3"></div>
    </div>
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

.plane_game canvas {
  position: relative;
  z-index: 2; /* above sky but below HUD/game over */
  display: block;
}

.sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, #87cefa 0%, #b0e2ff 60%, #e6f7ff 100%);
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50px;
  filter: blur(6px);
  opacity: 0.95;
}

.cloud.c1 {
  width: 220px;
  height: 60px;
  left: 0%;
  top: 60px;
  animation: moveClouds 70s linear infinite;
}
.cloud.c2 {
  width: 320px;
  height: 80px;
  left: 60%;
  top: 160px;
  animation: moveClouds 100s linear infinite;
  opacity: 0.9;
}
.cloud.c3 {
  width: 180px;
  height: 50px;
  left: 20%;
  top: 260px;
  animation: moveClouds 50s linear infinite;
  opacity: 0.92;
}

.cloud::before,
.cloud::after {
  content: "";
  position: absolute;
  background: inherit;
  border-radius: 50px;
}
.cloud::before {
  width: 60%;
  height: 100%;
  left: -20px;
  top: -12px;
}
.cloud::after {
  width: 50%;
  height: 80%;
  right: -18px;
  top: -8px;
}

@keyframes moveClouds {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(160%);
  }
  100% {
    transform: translateX(0);
  }
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
