<template>
  <div class="c__star" ref="ref_star" @mousemove="handleMouseMove">
    <div class="star" v-for="(star, index) in Star.list" :key="index" :style="Star.getStyle(star)">
      <img v-if="star.img === 0" src="./assets/star_blue.png" alt="" />
      <img v-if="star.img === 1" src="./assets/star_green.png" alt="" />
      <img v-if="star.img === 2" src="./assets/star_pink.png" alt="" />
      <img v-if="star.img === 3" src="./assets/star_red.png" alt="" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";

interface IStar {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  vr: number;
  size: number;
  opacity: number;
  img: number;
  is_delete: boolean;
}

const ref_star = ref<Element>();

const Star = reactive({
  config: {
    size: 40,
    rotation_speed: 6,
    gravity: 8,
  },
  list: [] as IStar[],

  getStyle(item: IStar) {
    const rect = ref_star.value?.getBoundingClientRect() ?? { x: 0, y: 0 };
    return {
      width: `${item.size}px`,
      height: `${item.size}px`,
      left: `${item.x - rect.x}px`,
      top: `${item.y - rect.y}px`,
      transform: `translate(-50%, -50%) rotate(${(item.r * 180) / Math.PI}deg)`,
      opacity: item.opacity,
    };
  },
  addStar(x: number, y: number) {
    const direction = Math.random() * Math.PI * 2;
    Star.list.push({
      x,
      y,
      r: Math.random() * Math.PI * 2,
      vx: Math.cos(direction),
      vy: Math.sin(direction),
      vr: Math.random() * Star.config.rotation_speed - Star.config.rotation_speed / 2,
      size: Math.random() * Star.config.size + Star.config.size / 2,
      opacity: Math.random() * 0.2 + 0.8,
      img: Math.floor(Math.random() * 4),
      is_delete: false,
    });
  },
  enterFrame() {
    Star.list = Star.list.filter((star) => !star.is_delete);
    Star.list.forEach((star: IStar) => {
      star.x += star.vx;
      star.y += star.vy;
      star.r += star.vr / 100;
      star.vy += Star.config.gravity / 1000;
      star.opacity -= 0.005;
      if (star.opacity < 0) {
        star.is_delete = true;
      }
    });
    requestAnimationFrame(Star.enterFrame);
  },
});

const handleMouseMove = (e: MouseEvent) => {
  Star.addStar(e.clientX, e.clientY);
};

Star.enterFrame();
</script>

<style scoped lang="less">
.c__star {
  position: absolute;
  inset: 0;
  background: black;
  overflow: hidden;
}
.star {
  position: absolute;
  & > img {
    width: 100%;
    height: 100%;
  }
}
</style>
