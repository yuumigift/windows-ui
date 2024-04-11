<template>
  <div class="map">
    <slot name="bg"></slot>
  </div>
  <div class="map-container">
    <div v-for='(item,index) in map'>
      <div class="cell" :style="{
        marginTop: `${index * 60}px`,
        marginLeft: `${i * 50}px`
      }" v-for="(it,i) in item">草皮</div>
    </div>
  </div>
</template>
<script setup lang="ts">

const props = defineProps({
  map:{
    default:() => ([] as number[][])
  },
})


</script>
<style scoped lang="less">
.map-container {
  display: grid;
}
.cell{
  top:40px;
  left: 62px;
  width: 50px;
  height: 60px;
  display: inline-grid;
  position: absolute;
}

.cell:hover{
  border: 1px solid;
}

.map{
  position: absolute;
}

</style>