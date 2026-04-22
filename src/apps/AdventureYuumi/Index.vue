<template>
  <div class="game_shell">
    <div class="cloud_layer" aria-hidden="true">
      <div
        v-for="cloud in clouds"
        :key="cloud.id"
        class="cloud"
        :style="cloud.style"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <canvas ref="canvas" width="800" height="600"></canvas>
    <div class="overlay" v-if="game.global.over.value || game.global.win.value">
      <div class="overlay_card">
        <h2>{{ game.global.win.value ? "通关成功！" : "你失败了！" }}</h2>
        <p>{{ game.global.win.value ? "你已经抵达终点旗帜，准备开启下一张随机地图。" : "掉下平台或者碰到怪物都会失败，再来一次就能更稳。" }}</p>
        <button class="restart_btn" @click="game.reset()">重新开始</button>
      </div>
    </div>
    <div class="hud">
      <span>方向键移动 / ↑ 跳跃</span>
      <span>随机地图 · 到达终点旗帜获胜</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Game } from "./classes/Game";

type CloudSeed = {
  id: number;
  style: Record<string, string>;
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const createClouds = (count: number) =>
  Array.from({ length: count }, (_, index): CloudSeed => {
    const width = randomBetween(74, 152);
    const top = randomBetween(28, 142);
    const left = randomBetween(-6, 86);
    const duration = randomBetween(18, 34);
    const distance = randomBetween(26, 96);
    const opacity = randomBetween(0.68, 0.96);
    const scale = randomBetween(0.86, 1.28);
    const delay = -randomBetween(0, duration);
    return {
      id: index,
      style: {
        width: `${width}px`,
        top: `${top}px`,
        left: `${left}%`,
        opacity: opacity.toFixed(2),
        "--cloud-scale": scale.toFixed(2),
        "--cloud-drift": `${distance.toFixed(0)}px`,
        "--cloud-duration": `${duration.toFixed(2)}s`,
        "--cloud-delay": `${delay.toFixed(2)}s`,
      },
    };
  });

const canvas = ref<HTMLCanvasElement>();
const game = new Game();
const clouds = createClouds(7);
game.start(canvas);
</script>

<style lang="less" scoped>
.game_shell {
  position: relative;
  width: 800px;
  height: 600px;
  overflow: hidden;
  border-radius: 12px;
  background:
    radial-gradient(circle at 76% 14%, #fff8cb 0 34px, #fff8cb77 34px 72px, transparent 73px),
    linear-gradient(180deg, #60a5fa 0%, #93c5fd 42%, #dbeafe 76%, #eff6ff 100%);
}

canvas {
  display: block;
  position: relative;
  z-index: 1;
  background: transparent;
  border-radius: 12px;
}

.cloud_layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.cloud {
  --cloud-scale: 1;
  --cloud-drift: 40px;
  --cloud-duration: 24s;
  --cloud-delay: 0s;
  position: absolute;
  height: 34px;
  animation: cloud-drift var(--cloud-duration) ease-in-out infinite alternate;
  animation-delay: var(--cloud-delay);
  filter: drop-shadow(0 8px 8px rgba(255, 255, 255, 0.22));
  transform: translateX(0) scale(var(--cloud-scale));

  span {
    position: absolute;
    display: block;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 999px;
    box-shadow: inset 0 -6px 12px rgba(191, 219, 254, 0.35);
  }

  span:nth-child(1) {
    left: 0;
    top: 12px;
    width: 58%;
    height: 24px;
  }

  span:nth-child(2) {
    left: 24%;
    top: 0;
    width: 44%;
    height: 30px;
  }

  span:nth-child(3) {
    right: 0;
    top: 10px;
    width: 48%;
    height: 22px;
  }
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #0008;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay_card {
  min-width: 280px;
  padding: 28px 32px;
  border-radius: 18px;
  background: #111827dd;
  box-shadow: 0 16px 40px #00000033;
  color: #fff;
  text-align: center;

  h2 {
    margin: 0 0 10px;
    font-size: 30px;
  }

  p {
    margin: 0 0 18px;
    color: #d1d5db;
    line-height: 1.7;
  }
}

.restart_btn {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  cursor: pointer;
}

.hud {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 12px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.32);
  color: #ffffff;
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

@keyframes cloud-drift {
  from {
    transform: translateX(calc(var(--cloud-drift) * -1)) scale(var(--cloud-scale));
  }

  to {
    transform: translateX(var(--cloud-drift)) scale(var(--cloud-scale));
  }
}
</style>
