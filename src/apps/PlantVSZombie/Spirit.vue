<template>
  <div class="c__spirit" :style="styleContainer">
    <div class="spirit" :style="styleWrapper">
      <img ref="ref_spirit" :style="styleImg" :src="s.src" alt="" @load="handleLoad" />
    </div>
    <div class="health" v-if="health < 100">
      <div class="health--bar" :style="{ width: `${health}%` }"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { type StyleValue } from "vue";

const props = defineProps({
  // 图片名称
  name: { default: "" },
  // 图片数量
  count: { default: 1 },
  // 图片高度
  height: { default: 50 },
  // 轮播延迟
  delay: { default: 25 },
  // x
  x: { default: 0 },
  // y
  y: { default: 0 },
  // z-index
  zIndex: { default: 0 },
  // 血量
  health: { default: 100 },
  // 可点击
  canClick: { default: false },
});
const width = defineModel("width", { default: 0 });

const ref_spirit = ref<Element>();

const styleContainer = computed((): StyleValue => {
  return {
    transform: `translate(${props.x}px, ${props.y}px)`,
  };
});
const styleWrapper = computed((): StyleValue => {
  return {
    width: `${width.value}px`,
    height: `${props.height}px`,
  };
});
const styleImg = computed((): StyleValue => {
  return {
    transform: `translateX(${s.index * -width.value}px)`,
  };
});
const css_pointerEvent = computed((): string => (props.canClick ? "auto" : "none"));

const handleLoad = () => {
  if (width.value === 0) {
    const rect = ref_spirit.value?.getBoundingClientRect();
    width.value = (rect?.width ?? 0) / props.count;
  }
  if (props.count > 1) {
    nextImg();
  }
};
const nextImg = () => {
  requestAnimationFrame(nextImg);
  if (s.imgTick > 0) {
    s.imgTick--;
  } else {
    s.imgTick = props.delay;
    s.index++;
    if (s.index >= props.count) {
      s.index = 0;
    }
  }
};
const init = async () => {
  const globs = import.meta.glob(`./assets/images/*.*`);
  const keys = Object.keys(globs);
  const path = keys.find((o) => o.includes(props.name));
  if (path) {
    const m = globs[path];
    const img: { default: string } = await (<Promise<{ default: string }>>m());
    s.src = img.default;
  } else {
    console.error(`图片不存在: ${props.name}`);
  }
};

const s = reactive({
  index: 0,
  imgTick: 0,
  src: "",
  timer: <null | number>null,
});

onMounted(init);
</script>
<style lang="less" scoped>
.c__spirit {
  position: absolute;
  pointer-events: v-bind(css_pointerEvent);
  z-index: v-bind("props.zIndex");
  user-select: none;
}
.spirit {
  position: relative;
  height: 100%;
  overflow: hidden;
  // 
  &>img{
    display: block;
    object-fit: cover;
    width:auto;
  }
}
.health {
  position: absolute;
  top: -10px;
  left: 0;
  width: 100%;
  height: 6px;
  border: 1px solid #0001;
  //
  &--bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: #f009;
    height: 100%;
  }
}
</style>
