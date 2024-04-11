<template>
  <MapTemplate :map="map">
    <template #bg>
      <img src="@/apps/PlantVsZombieMadoka/assets/images/bk1.png"  alt=""/>
    </template>
  </MapTemplate>
</template>
<script setup lang="ts">

import MapTemplate from "@/apps/PlantVsZombieMadoka/components/MapTemplate.vue";
import {Lawn} from "@/apps/PlantVsZombieMadoka/scripts/map/Lawn";
const map = Lawn
</script>
<style scoped lang="less">

</style>