<template>
  <div class="c__puzzle_app">
    <header class="hero">
      <div>
        <p class="eyebrow">Picture Puzzle</p>
        <h1>{{ Game.grid_label }} 拼图</h1>
        <p class="desc">左侧是完整参考图，右侧是打乱后的碎片。每次点击两个碎片即可交换位置，还原整张图即获胜。</p>
      </div>
      <div class="status_panel">
        <div class="status_card">
          <span>交换次数</span>
          <strong>{{ Board.swap_count }}</strong>
        </div>
        <div class="status_card">
          <span>当前状态</span>
          <strong>{{ Board.is_solved ? "已完成" : "进行中" }}</strong>
        </div>
        <button class="shuffle_btn" type="button" @click="Board.shuffle">重新打乱</button>
      </div>
    </header>

    <section class="workspace">
      <div class="panel">
        <div class="panel_head">
          <h2>参考图</h2>
          <span>保持不变</span>
        </div>
        <div class="reference_frame">
          <img :src="Image.current_image" alt="拼图参考图" class="reference_image" draggable="false" />
        </div>
      </div>

      <div class="panel">
        <div class="panel_head">
          <h2>拼图区</h2>
          <span>点击两块进行交换</span>
        </div>
        <div class="board_wrap">
          <div v-if="Board.is_solved" class="win_banner">拼图完成</div>
          <div class="board" :class="{ is_solved: Board.is_solved }">
            <button
              v-for="(tile, index) in Board.list"
              :key="`${tile}-${index}`"
              type="button"
              class="tile"
              :class="{
                is_selected: Board.selected_index === index,
                is_locked: Board.is_solved,
              }"
              :style="Board.getTileStyle(tile)"
              @click="Board.handleTileClick(index)"
            >
              <span class="sr_only">第 {{ index + 1 }} 块</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { createSolvedBoard, createTileStyle, grid_label, pickRandomImage, puzzle_size } from "./common";

const Game = (() => {
  const s = reactive({
    grid_label,
  });

  return s;
})();

const Image = (() => {
  const s = reactive({
    current_image: pickRandomImage(),
    refresh() {
      s.current_image = pickRandomImage(s.current_image);
    },
  });

  return s;
})();

const Board = (() => {
  const syncSolvedState = () => {
    s.is_solved = s.list.every((tile, index) => tile === index);
  };

  const shuffle = () => {
    const next_board = createSolvedBoard();
    Image.refresh();

    do {
      for (let index = next_board.length - 1; index > 0; index -= 1) {
        const random_index = Math.floor(Math.random() * (index + 1));
        const current_tile = next_board[index]!;
        next_board[index] = next_board[random_index]!;
        next_board[random_index] = current_tile;
      }
    } while (next_board.every((tile, index) => tile === index));

    s.list = next_board;
    s.selected_index = null;
    s.swap_count = 0;
    syncSolvedState();
  };

  const handleTileClick = (index: number) => {
    if (s.is_solved) {
      return;
    }

    if (s.selected_index === null) {
      s.selected_index = index;
      return;
    }

    if (s.selected_index === index) {
      s.selected_index = null;
      return;
    }

    const next_board = [...s.list];
    const previous_index = s.selected_index;

    const current_tile = next_board[index]!;
    next_board[index] = next_board[previous_index]!;
    next_board[previous_index] = current_tile;
    s.list = next_board;
    s.selected_index = null;
    s.swap_count += 1;
    syncSolvedState();
  };

  const s = reactive({
    list: [] as number[],
    selected_index: null as number | null,
    swap_count: 0,
    is_solved: false,
    shuffle,
    handleTileClick,
    getTileStyle(tile: number) {
      return createTileStyle(tile, Image.current_image);
    },
  });

  onMounted(shuffle);

  return s;
})();
</script>

<style lang="less" scoped>
.c__puzzle_app {
  min-height: 100%;
  padding: 24px;
  color: #f5f1e8;
  background:
    radial-gradient(circle at top left, rgba(255, 199, 92, 0.22), transparent 24%), radial-gradient(circle at bottom right, rgba(37, 167, 222, 0.24), transparent 30%),
    linear-gradient(135deg, #1f2937 0%, #111827 42%, #0f172a 100%);
}

.hero {
  display: flex;
  gap: 20px;
  align-items: stretch;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #fbbf24;
  font-size: 13px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.desc {
  max-width: 560px;
  margin: 12px 0 0;
  color: #d1d5db;
  line-height: 1.6;
}

.status_panel {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.status_card,
.shuffle_btn {
  min-width: 120px;
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.28);
}

.status_card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.status_card span {
  color: #cbd5e1;
  font-size: 13px;
}

.status_card strong {
  font-size: 28px;
}

.shuffle_btn {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.shuffle_btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 25px rgba(245, 158, 11, 0.28);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 20px;
}

.panel {
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.52);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.3);
}

.panel_head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.panel_head h2 {
  margin: 0;
  font-size: 18px;
}

.panel_head span {
  color: #94a3b8;
  font-size: 13px;
}

.reference_frame {
  display: grid;
  place-items: center;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(148, 163, 184, 0.08));
}

.reference_image {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.32);
  user-select: none;
}

.board_wrap {
  position: relative;
}

.win_banner {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 2;
  padding: 10px 18px;
  border: 1px solid rgba(251, 191, 36, 0.45);
  border-radius: 999px;
  color: #fef3c7;
  font-weight: 700;
  background: rgba(120, 53, 15, 0.85);
  transform: translateX(-50%);
}

.board {
  display: grid;
  grid-template-columns: repeat(v-bind(puzzle_size), 1fr);
  width: 520px;
  max-width: 100%;
  border-radius: 22px;
  overflow: hidden;
  background: #0b1120;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.board {
  &.is_solved {
    box-shadow:
      inset 0 0 0 1px rgba(251, 191, 36, 0.5),
      0 0 0 6px rgba(251, 191, 36, 0.16);
  }
}

.tile {
  aspect-ratio: 1;
  border: 1px solid rgba(15, 23, 42, 0.4);
  background-repeat: no-repeat;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.tile {
  &:hover {
    z-index: 1;
    transform: scale(1.02);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
  }

  &.is_selected {
    z-index: 1;
    transform: scale(1.02);
    box-shadow: inset 0 0 0 3px #fbbf24;
    filter: saturate(1.15) brightness(1.05);
  }

  &.is_locked {
    cursor: default;
  }
}

.sr_only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1180px) {
  .hero,
  .workspace {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .status_panel {
    flex-wrap: wrap;
  }
}

@media (max-width: 820px) {
  .c__puzzle_app {
    padding: 16px;
  }

  h1 {
    font-size: 28px;
  }

  .board {
    width: 100%;
  }
}
</style>
