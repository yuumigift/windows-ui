<template>
<!--  主题-->
  <a-config-provider
      :theme="{ token: { colorPrimary: data.colorPrimary, borderRadius: `${data.borderRadius}px` } }"
  >
  <div class="backgroundColorDark backgroundColorDarkHeader" style="display: flex;height: 35px;align-items: center">
    <img style="width: 17px;height:17px;margin-left: 6px;margin-right: 10px;" src="public/icon/idea.ico" alt="">
    <a-dropdown name="theme" :trigger="['click']">
      <a class="ant-dropdown-link" @click.prevent>
        <MenuUnfoldOutlined />
      </a>
      <template #overlay>
        <a-menu style="width: 300px;">
          <a-sub-menu key="new" style="text-indent: 21px" title="new">
            <a-menu-item><span class="menu-item-icon"></span>Project...</a-menu-item>
            <a-menu-item><span class="menu-item-icon"></span>Project from Version Control...</a-menu-item>
            <a-menu-item><AlignLeftOutlined /> &nbsp;File</a-menu-item>
            <a-menu-item><span class="menu-item-icon"></span>Scratch File</a-menu-item>
            <a-menu-item><FolderOutlined /> &nbsp;Directory</a-menu-item>
            <a-menu-item><span style="font-size: 8px;color: green;">&lt;&gt;</span>&nbsp;HTML File</a-menu-item>
          </a-sub-menu>
          <a-menu-item><FolderOutlined /> &nbsp;Open...</a-menu-item>
          <a-menu-item><span class="menu-item-icon"></span>Save As...<span class="menu-placeholder">Ctrl+Shift+S</span></a-menu-item>
          <a-menu-item><span class="menu-item-icon"></span>Attach project...</a-menu-item>
          <a-sub-menu key="Recent Projects..." style="text-indent: 21px" title="Recent Projects...">
          </a-sub-menu>
          <a-menu-item><span class="menu-item-icon"/>Close Project</a-menu-item>
          <a-menu-item><span class="menu-item-icon"/>Close All Projects</a-menu-item>
          <a-menu-item><span class="menu-item-icon"/>Close Other Projects</a-menu-item>
          <a-menu-item><span class="menu-item-icon"/>Rename Project...</a-menu-item>
          <hr/>
          <a-menu-item><span class="menu-item-icon"/>Remote Development...</a-menu-item>
          <hr/>
          <a-menu-item><SettingOutlined /> &nbsp;Settings...</a-menu-item>
          <a-sub-menu key="File Properties..." style="text-indent: 21px" title="File Properties...">
          </a-sub-menu>
          <hr/>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
  </a-config-provider>
</template>
<script lang="ts" setup>
import {AlignLeftOutlined, MenuUnfoldOutlined, FolderOutlined, SettingOutlined} from "@ant-design/icons-vue";
import '../css/Theme.css'
import {reactive, ref} from "vue";
import {theme} from "ant-design-vue";
const defaultData = {
  borderRadius: 6,
  colorPrimary: '#1677ff',
};
const data = ref(defaultData);
const { token } = theme.useToken();
</script>
<style scoped lang="less">
.menu:hover{
  background-color: #2b2d30;
}

.menu-item-icon::before {
  content: "";
  display: inline-block;
  width: 22px; /* 根据图标的宽度调整 */
  height: 1px; /* 根据图标的高度调整 */
  vertical-align: middle;
}
.menu-placeholder{
  float: right;
  color: #3c3f40;
}
</style>