<template>
	<div class="minecraft_game">
		<!-- Three.js 渲染画面会挂载到这个容器里。 -->
		<div ref="root" class="viewport"></div>

		<!-- 固定在屏幕中心的准星，用于辅助瞄准方块。 -->
		<div class="crosshair"></div>

		<!-- 左上角 HUD：显示世界方块统计和当前选中方块。 -->
		<div class="hud top_left">
			<div>方块总数：{{ game.blockCount.value }}</div>
			<div>当前放置：{{ blockLabelMap[game.blockName.value] }}</div>
		</div>

		<!-- 右上角操作区：当前只保留一个重置按钮。 -->
		<div class="hud top_right">
			<button class="action_btn" @click="game.restart()">重置地形</button>
		</div>

		<!-- 底部工具栏：支持点击切换当前准备放置的方块类型。 -->
		<div class="toolbar">
			<button
				v-for="type in blockTypes"
				:key="type"
				class="tool_btn"
				:class="{ is_active: game.blockName.value === type }"
				@click="game.setBlockType(type)"
			>
				{{ blockLabelMap[type] }}
			</button>
		</div>

		<!-- 左下角提示文案：告诉玩家当前世界支持的操作和内容。 -->
		<div class="hud bottom_left">
			<div>点击画面锁定鼠标，WASD 移动，空格跳跃，Shift 冲刺。</div>
			<div>左键破坏方块，右键放置方块，滚轮切换方块，Esc 解除鼠标锁定。</div>
			<div>世界现已支持区块加载、玻璃木屋、小路和整片木质树林。</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { Game } from "./classes/Game";
import { BLOCK_TYPES, type BlockType } from "./types";

// `root` 对应上方 viewport 容器，Three.js canvas 会在挂载时插入这里。
const root = useTemplateRef("root");
// 游戏主控制器：负责串联视口、世界与 UI 状态。
const game = new Game();
// 工具栏直接复用类型常量数组，确保顺序和滚轮切换逻辑一致。
const blockTypes = BLOCK_TYPES;
// 用更友好的中文名显示各类方块。
const blockLabelMap: Record<BlockType, string> = {
	grass: "草方块",
	dirt: "泥土",
	stone: "石头",
	wood: "木块",
	glass: "玻璃",
	leaf: "树叶",
};

// 在组件生命周期内启动游戏循环，`Game` 内部会负责销毁清理。
game.start(root);
</script>

<style lang="less" scoped>
/* 整个 Minecraft 应用窗口的根容器。 */
.minecraft_game {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: linear-gradient(#90d8ff, #dff3ff);
}

/* Three.js 渲染区域占满整个窗口。 */
.viewport {
	width: 100%;
	height: 100%;

	/* canvas 由脚本动态插入，因此通过 :deep 设定其尺寸表现。 */
	:deep(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
}

/* 简单十字准星，帮助玩家对准交互目标。 */
.crosshair {
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 3;
	width: 16px;
	height: 16px;
	transform: translate(-50%, -50%);
	pointer-events: none;

	&::before,
	&::after {
		content: "";
		position: absolute;
		background: #fff;
		box-shadow: 0 0 4px #0009;
	}

	&::before {
		top: 7px;
		left: 0;
		width: 16px;
		height: 2px;
	}

	&::after {
		top: 0;
		left: 7px;
		width: 2px;
		height: 16px;
	}
}

/* HUD 卡片的通用视觉风格。 */
.hud {
	position: absolute;
	z-index: 4;
	border-radius: 16px;
	background: #0f172ab8;
	padding: 10px 14px;
	color: #eff6ff;
	font-size: 14px;
	line-height: 1.6;
	backdrop-filter: blur(10px);
}

/* 左上角状态区。 */
.top_left {
	top: 16px;
	left: 16px;
}

/* 右上角操作区。 */
.top_right {
	top: 16px;
	right: 16px;
}

/* 左下角操作说明。 */
.bottom_left {
	bottom: 66px;
	left: 16px;
}

/* 居中的快捷方块工具栏。 */
.toolbar {
	position: absolute;
	left: 50%;
	bottom: 16px;
	z-index: 4;
	display: flex;
	gap: 10px;
	transform: translateX(-50%);
}

/* 工具栏按钮和右上角按钮共用同一套基础样式。 */
.tool_btn,
.action_btn {
	transition: 0.2s ease;
	border: none;
	border-radius: 999px;
	background: #ffffffdc;
	cursor: pointer;
	padding: 10px 16px;
	color: #0f172a;
	font-weight: 700;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 20px #00000022;
	}
}

/* 当前激活的方块按钮使用高亮色强调。 */
.tool_btn.is_active {
	background: linear-gradient(135deg, #fde68a, #f59e0b);
	color: #fff;
}
</style>
