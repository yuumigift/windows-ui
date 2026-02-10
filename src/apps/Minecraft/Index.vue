<template>
  <div class="world-root" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { createEngine } from '@/apps/Minecraft/world/engine'

let destroy: (() => void) | null = null

onMounted(() => {
  const root = document.querySelector('.world-root') as HTMLDivElement
  destroy = createEngine(root)
})

onBeforeUnmount(() => {
  destroy?.()
})
</script>

<style scoped lang="less">
.world-root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
