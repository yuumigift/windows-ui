<template>
  <div class="backgroundColorDark backgroundColorDarkHeader" style="display: flex;height: 35px;align-items: center">
    <img style="width: 17px;height:17px;margin-left: 6px;margin-right: 10px;" src="public/icon/idea.webp" alt="">
    <div class="menu" style="width: 17px;height: 17px">
      <a-cascader :options="options">
        <MenuUnfoldOutlined />
      </a-cascader>

    </div>
  </div>
</template>
<script lang="ts" setup>
import {MenuUnfoldOutlined} from "@ant-design/icons-vue";
import '../css/Theme.css'

const options = [
  {
    label:'new',
    children:[
      {label:'Project...'},
      {label:'Project from version Control...'},
      {label:''}
    ]
  }
]

</script>
<style scoped>
.menu:hover{
  background-color: #2b2d30;
}


</style>