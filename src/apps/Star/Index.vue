<template>
  <div class="c__star" ref="ref_star" @mousemove="handleMouseMove">
    <!-- <div class="star" v-for="(star, index) in Star.list" :key="index" :style="Star.getStyle(star)">
      <img v-if="star.img === 0" src="./assets/star_one.png" alt="" />
      <img v-if="star.img === 1" src="./assets/star_two.png" alt="" />
      <img v-if="star.img === 2" src="./assets/star_three.png" alt="" />
      <img v-if="star.img === 3" src="./assets/star_four.png" alt="" />
    </div> -->
    <canvas class="cvs" ref="ref_cvs" :width="Star.width" :height="Star.height"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import imgPath1 from "./assets/star_one.png";
import imgPath2 from "./assets/star_two.png";
import imgPath3 from "./assets/star_three.png";
import imgPath4 from "./assets/star_four.png";

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
const ref_cvs = ref<HTMLCanvasElement>();

const Star = reactive({
  config: {
    size: 60,
    rotation_speed: 6,
    gravity: 8,
  },
  width: 800,
  height: 560,
  img1: new Image(),
  img2: new Image(),
  img3: new Image(),
  img4: new Image(),
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
    const rect = ref_star.value?.getBoundingClientRect() ?? { width: 800, height: 560, x: 0, y: 0 };
    Star.width = rect.width;
    Star.height = rect.height;

    const cvs = ref_cvs.value;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, Star.width, Star.height);

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

      const imgMap: any = {
        1: Star.img1,
        2: Star.img2,
        3: Star.img3,
        4: Star.img4,
      };
      const img = imgMap[star.img];
      if (!img) return;
      ctx.globalAlpha = star.opacity;
      ctx.drawImage(img, star.x - Star.config.size / 2 - rect.x, star.y - Star.config.size / 2 - rect.y, Star.config.size, Star.config.size);
      ctx.globalAlpha = 0;
    });
    requestAnimationFrame(Star.enterFrame);
  },
});

const handleMouseMove = (e: MouseEvent) => {
  for (let i = 0; i < 8; i++) {
    Star.addStar(e.clientX, e.clientY);
  }
};
onMounted(() => {
  Star.img1.src = imgPath1;
  Star.img2.src = imgPath2;
  Star.img3.src = imgPath3;
  Star.img4.src = imgPath4;
  Star.enterFrame();
});
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
.cvs {
  position: absolute;
  inset: 0;
}
</style>
