<template>
  <div class="outer-div">
    <div class="inner-div">
      <div v-for="(row, rowIndex) in snake.map" :key="rowIndex" class="row">
        <span v-for="(item, colIndex) in row" :key="colIndex" class="cell" :class="{
          isActive: item === 1,
          isFood: item === 2,
        }">{{ item }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {floor} from "lodash";

interface direction {
  ArrowUp: any,
  ArrowDown: any,
  ArrowLeft: any,
  ArrowRight: any,
}

const snake = (() => {
  const defaultMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ]
  const defaultPosition = {x: 0, y: 0} as { x: number; y: number }
  const control = <direction>{
    ArrowUp: () => {
      const pos = s.position
      let re = pos.y > 0
      if (re) {
        pos.y--
      }
      return re
    },
    ArrowDown: () => {
      const pos = s.position
      let re = pos.y < s.map.length - 1
      if (re) {
        pos.y++
      }
      return re
    },
    ArrowLeft: () => {
      const pos = s.position
      let re = pos.x > 0
      if (re) {
        s.position.x--
      }
      return re
    },
    ArrowRight: () => {
      const pos = s.position
      let re = pos.x < s.map.length - 1
      if (re) {
        s.position.x++
      }
      return re
    },
  }
  const motion = (key: keyof direction) => {
    const pos = s.position
    const result = control[key]()
    const x = pos.x
    const y = pos.y
    if (!result) return
    s.snakeBody.push({...pos})
    let first = s.snakeBody[0];
    if (s.map[y][x] === 2){
      eat()
    }else{
      s.map[first.y][first.x] = 0
      s.snakeBody.shift()
    }
    s.map[y][x] = 1
    s.snakeBody.map(item => {
      s.map[item.y][item.x] = 1

    })
  }
  const eat = () => {
    generateFood()
  }
  const generateFood = () => {
    const x = floor(Math.random() * 9)
    const y = floor(Math.random() * 9)
    console.log(y, x)
    s.map[y][x] = 2
  }
  const init = () => {
    s.map[0][0] = 1
    generateFood()
  }
  window.addEventListener('keydown', e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
      motion(e.key as keyof direction)
  })

  setInterval(() => {

  }, 1000)

  const s = reactive({
    position: {...defaultPosition},
    snakeBody: [defaultPosition],
    toward: "ArrowLeft",
    map: [...defaultMap]
  })
  init()
  return s
})()
</script>

<style scoped lang="less">
.outer-div {
  width: 100%;
  height: 100%;
  display: grid; /* 使用 Grid 布局 */
  place-items: center; /* 垂直和水平居中对齐 */
}

.inner-div {
  display: inline-block;
}

.row {
  display: grid;
  grid-template-columns: repeat(10, 50px); /* 10列，每列50px */
}

.cell {
  border: 1px solid red;
  width: 50px; /* 固定宽度 */
  height: 50px; /* 固定高度 */

  &.isActive {
    background: black;
  }

  &.isFood {
    background: red;
  }
}
</style>
