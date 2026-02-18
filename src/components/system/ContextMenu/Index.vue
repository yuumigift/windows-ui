<template>
    <div
            v-if="visible"
            class="context-menu"
            :style="{
      left: `${x}px`,
      top: `${y}px`
    }"
    >
        <div class="menu-item" @click="handleMenuClick('view')">
            <span class="menu-icon">👁️</span>
            <span>查看</span>
            <span class="arrow">▶</span>
        </div>
        <div class="menu-item has-submenu">
            <span class="menu-icon">📊</span>
            <span>排序方式</span>
            <span class="arrow">▶</span>
            <div class="submenu">
                <div class="submenu-item" @click.stop="handleMenuClick('sort-default')">默认排序</div>
                <div class="submenu-item" @click.stop="handleMenuClick('sort-name-asc')">按名称升序</div>
                <div class="submenu-item" @click.stop="handleMenuClick('sort-name-desc')">按名称降序</div>
            </div>
        </div>
        <div class="menu-item" @click="handleMenuClick('refresh')">
            <span class="menu-icon">🔄</span>
            <span>刷新</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuClick('paste')">
            <span class="menu-icon">📋</span>
            <span>粘贴</span>
            <span class="shortcut">Ctrl+V</span>
        </div>
        <div class="menu-item" @click="handleMenuClick('paste-shortcut')">
            <span class="menu-icon">🔗</span>
            <span>粘贴快捷方式</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuClick('undo')">
            <span class="menu-icon">↶</span>
            <span>撤销</span>
            <span class="shortcut">Ctrl+Z</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuClick('new')">
            <span class="menu-icon">📄</span>
            <span>新建</span>
            <span class="arrow">▶</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuClick('display-settings')">
            <span class="menu-icon">🖥️</span>
            <span>显示设置</span>
        </div>
        <div class="menu-item" @click="handleMenuClick('personalize')">
            <span class="menu-icon">🎨</span>
            <span>个性化</span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    const emit = defineEmits(['menuClick']);

    const visible = ref(false);
    const x = ref(0);
    const y = ref(0);

    const show = (clientX: number, clientY: number) => {
        // 确保菜单不会超出屏幕边界
        const menuWidth = 200;
        const menuHeight = 400;

        x.value = Math.min(clientX, window.innerWidth - menuWidth);
        y.value = Math.min(clientY, window.innerHeight - menuHeight);

        visible.value = true;
    };

    const hide = () => {
        visible.value = false;
    };

    const handleMenuClick = (action: string) => {
        emit('menuClick', action);
        hide();
    };

    defineExpose({
        show,
        hide
    });
</script>

<style lang="less" scoped>
    .context-menu {
        position: fixed;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow:
                0 8px 32px rgba(0, 0, 0, 0.12),
                0 2px 8px rgba(0, 0, 0, 0.08);
        padding: 6px;
        min-width: 200px;
        z-index: 1000;
        font-size: 14px;
        font-family: 'Segoe UI', sans-serif;
        user-select: none;
    }

    .menu-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.1s ease;
        color: #333;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        .menu-icon {
            width: 16px;
            margin-right: 12px;
            text-align: center;
            font-size: 12px;
        }

        .arrow {
            margin-left: auto;
            color: #666;
            font-size: 10px;
        }

        .shortcut {
            margin-left: auto;
            color: #666;
            font-size: 12px;
        }
    }

    .menu-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.1);
        margin: 4px 0;
    }

    .has-submenu {
        position: relative;

        .submenu {
            position: absolute;
            top: 0;
            left: 100%;
            min-width: 160px;
            background: rgba(255,255,255,0.98);
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            border-radius: 6px;
            display: none;
            z-index: 1001;
            padding: 6px 0;
        }

        &:hover {
            .submenu {
                display: block;
            }
        }

        .submenu-item {
            padding: 8px 12px;
            cursor: pointer;
            white-space: nowrap;

            &:hover {
                background: rgba(0,0,0,0.04);
            }
        }
    }
</style>