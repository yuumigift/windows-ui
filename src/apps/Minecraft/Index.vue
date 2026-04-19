<template>
	<div class="minecraft_game">
		<div ref="root" class="viewport"></div>

		<div class="crosshair"></div>

		<div class="hud top_left">
			<div>方块总数：{{ game.blockCount.value }}</div>
			<div>当前放置：{{ blockLabelMap[game.blockName.value] }}</div>
		</div>

		<div class="hud top_right">
			<button class="action_btn" @click="game.restart()">重置地形</button>
		</div>

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

const root = useTemplateRef("root");
const game = new Game();
const blockTypes = BLOCK_TYPES;
const blockLabelMap: Record<BlockType, string> = {
	grass: "草方块",
	dirt: "泥土",
	stone: "石头",
	wood: "木块",
	glass: "玻璃",
};

game.start(root);
</script>

<style lang="less" scoped>
.minecraft_game {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: linear-gradient(#90d8ff, #dff3ff);
}

.viewport {
	width: 100%;
	height: 100%;

	:deep(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
}

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

.top_left {
	top: 16px;
	left: 16px;
}

.top_right {
	top: 16px;
	right: 16px;
}

.bottom_left {
	bottom: 16px;
	left: 16px;
}

.toolbar {
	position: absolute;
	left: 50%;
	bottom: 16px;
	z-index: 4;
	display: flex;
	gap: 10px;
	transform: translateX(-50%);
}

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

.tool_btn.is_active {
	background: linear-gradient(135deg, #fde68a, #f59e0b);
	color: #fff;
}
</style>
