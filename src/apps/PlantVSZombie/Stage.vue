<template>
  <div class="c__stage">
    <div class="game" ref="ref_game">
      <div class="shop">
        <div class="shop--item" :class="{ is_over: item.cost > Sun.sun }" v-for="(item, index) in Shop.list" @mousedown="(e) => Shop.handleGridClick(item)">
          <Spirit :name="item.name" :height="Plant.height" v-model:width="item.width" :count="mapCount[item.name!]"></Spirit>
          <div class="shop--text">{{ item.cost }}</div>
        </div>
      </div>
      <div class="grid">
        <div class="grid--item" v-for="(item, index) in Grid.list" @mousedown="(e) => Grid.handleGridClick(e, index)">
          <div class="grid--item-inner"></div>
        </div>
      </div>
      <div class="bank" ref="ref_bank">
        <Spirit name="sunbank" :height="110" :width="100"></Spirit>
      </div>
      <div class="sun_score">{{ Sun.sun }}</div>
      <div class="game_score">{{ Game.score }}</div>
      <Spirit v-for="item in Plant.list" :key="item.id" :name="item.name" :count="mapCount[item.name!]" :height="Plant.height" :x="item.x" :y="item.y" :health="(100 * item.health) / item.maxHealth" v-model:width="item.width"></Spirit>
      <Spirit v-for="item in Zombie.list" :key="item.id" :name="Zombie.name" :count="mapCount[Zombie.name!]" :height="item.height" :x="item.x" :y="item.y" :health="(100 * item.health) / item.maxHealth" v-model:width="item.width"></Spirit>
      <Spirit v-for="item in Sun.list" name="sun" :height="Sun.height" :x="item.x" :y="item.y" :width="Sun.height" :z-index="99" :can-click="!item.collecting" @mousedown="Sun.handleClick(item)" @mouseenter="Sun.handleClick(item)"></Spirit>
      <Spirit v-if="Shop.active" :name="Shop.active.name" :x="Shop.mouse.x" :y="Shop.mouse.y" :height="Plant.height" v-model:width="Shop.active.widthShadow" :count="mapCount[Shop.active.name!]"></Spirit>
      <canvas ref="ref_cvs_bullet" class="cvs_bullet" :width="GAME_WIDTH" :height="GAME_HEIGHT"></canvas>
      <div class="gameover" v-if="Game.over">你被僵尸吃掉了脑子！（得分：{{ Game.scoreResult }}）</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { mapCount, type ISpirit, block } from "./common";
import { useMouse } from "@vueuse/core";
import img_bullet from "./assets/images/bullet_0.png";
import Spirit from "./Spirit.vue";

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 600;
const SUN_PLANT_CD = 600;
const SUN_LIVE_TIME = 2000;
const SUN_START = 400;
const ZOMBIE_CD = 1000;

const ref_game = ref<Element>();
const ref_bank = ref<Element>();
const ref_cvs_bullet = ref<any>();

const mouse = useMouse();

// 🌱 游戏 🌱
const Game = (() => {
  const s = reactive({
    score: 0,
    scoreResult: 0,
    over: false,
  });

  return s;
})();

// 🌱 阳光 🌱
const Sun = (() => {
  const add = (x: number = 0, y: number = 0) => {
    x -= 20;
    y -= 20;
    s.list.push({
      collecting: false,
      deleted: false,
      x,
      y,
      live: SUN_LIVE_TIME,
      bottom: y + Math.random() * 200 - 100,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 1 - 2,
    });
  };
  const act = () => {
    requestAnimationFrame(act);
    s.list = s.list.filter((o) => !o.deleted);
    s.list.forEach((o) => {
      o.live--;
      if (o.live < 0) {
        o.deleted = true;
      }
      if (o.collecting) {
        if (o.x! > GAME_WIDTH - s.height!) {
          o.deleted = true;
          Sun.sun += 10;
          if (Sun.sun > 1000) {
            Sun.sun = 1000;
          }
        }
        o.x! += o.vx!;
        o.y! += o.vy!;
      } else {
        if (o.vy! > 0 && (o.y! > o.bottom || o.y! > GAME_HEIGHT - s.height)) return;
        if (o.x! < 0) {
          o.x = 0;
        }
        if (o.x! > 1000) {
          o.x = 1000;
        }
        o.x! += o.vx!;
        o.y! += o.vy!;
        o.vy! += 1e-2;
      }
    });
  };
  const handleClick = (item: ISpirit) => {
    if (!item.collecting) {
      item.collecting = true;
      const speed = 8;
      const { x, y } = item;
      const angle = Math.atan2(-y!, GAME_WIDTH - x! - 100);
      item.vx = speed * Math.cos(angle);
      item.vy = speed * Math.sin(angle);
    }
  };

  const s = reactive({
    sun: SUN_START,
    height: 100,
    list: <ISpirit[]>[],
    //
    add,
    handleClick,
  });

  onMounted(act);

  return s;
})();

// 🌱 商店 🌱
const Shop = (() => {
  const s = reactive({
    active: <any>null,
    width: 0,
    list: <any[]>[
      {
        name: "plant_0",
        width: 0,
        widthShadow: 0,
        cost: 50,
        health: 100,
      },
      {
        name: "plant_1",
        width: 0,
        widthShadow: 0,
        cost: 100,
        health: 100,
      },
      {
        name: "plant_2",
        width: 0,
        widthShadow: 0,
        cost: 200,
        health: 100,
      },
      {
        name: "plant_4",
        width: 0,
        widthShadow: 0,
        cost: 800,
        health: 100,
      },
      {
        name: "plant_5",
        width: 0,
        widthShadow: 0,
        cost: 150,
        health: 500,
      },
      {
        name: "shovel",
        width: 0,
        widthShadow: 0,
        cost: 0,
        health: 100,
      },
    ],
    mouse: computed((): any => {
      const rectGame = ref_game.value!.getBoundingClientRect();
      const x = mouse.x.value - rectGame.x - 30;
      const y = mouse.y.value - rectGame.y - 30;
      return { x, y };
    }),
    //
    async handleGridClick(item: any) {
      if (item.cost > Sun.sun) return;
      if (s.active?.name && s.active.name === item?.name) {
        s.active = null;
      } else {
        s.active = null;
        await nextTick();
        s.active = item;
      }
    },
  });

  return s;
})();

// 🌱 田地 🌱
const Grid = (() => {
  const init = () => {
    for (let i = 0; i < 8 * 4; i++) {
      s.list.push(i);
    }
  };

  const handleGridClick = (e: any, index: number) => {
    if (!Shop.active) return;
    const el = e.target;
    const rect = el.getBoundingClientRect();
    const rectGame = ref_game.value!.getBoundingClientRect();
    const x = rect.x - rectGame.x + 15;
    const y = rect.y - rectGame.y + 20;
    if (Shop.active.name === "shovel") {
      Plant.list = Plant.list.filter((o) => o.gridIndex !== index);
    } else {
      if (Plant.list.find((o) => o.gridIndex === index)) return;
      Sun.sun -= Shop.active.cost;
      Plant.list.push({
        id: Math.random() + "",
        gridIndex: index,
        name: Shop.active.name,
        health: Shop.active.health,
        maxHealth: Shop.active.health,
        x: x,
        y: y,
        width: 0,
        actionCD: 0,
      });
    }
    Shop.active = null;
  };

  const s = reactive({
    list: <any[]>[],
    handleGridClick,
  });

  init();

  return s;
})();

// 🌱 植物 🌱
const Plant = (() => {
  const act = () => {
    if (Game.over) return;
    requestAnimationFrame(act);
    Plant.list.forEach((o) => {
      s.list = s.list.filter((o) => !o.deleted);
      if (o.health <= 0) {
        o.deleted = true;
      }
      if (o.actionCD > 0) {
        o.actionCD--;
      } else {
        switch (o.name) {
          case "plant_0":
            o.actionCD = SUN_PLANT_CD + Math.random() * (SUN_PLANT_CD / 2) - SUN_PLANT_CD / 4;
            Sun.add(o.x, o.y);
            break;
          case "plant_1":
            o.actionCD = 100;
            Bullet.add(o.x! + 50, o.y! + 6);
            break;
          case "plant_2":
            o.actionCD = 50;
            Bullet.add(o.x! + 50, o.y! + 6);
            break;
          case "plant_4":
            o.actionCD = 3;
            Bullet.add(o.x! + 50, o.y! + 13, 0.5);
            break;
          default:
            break;
        }
      }
    });
  };

  const s = reactive({
    list: <ISpirit[]>[],
    width: 0,
    height: 60,
    count: 8,
  });
  onMounted(act);
  return s;
})();

// 🌱 豌豆 🌱
const Bullet = (() => {
  const add = (x: number, y: number, yTolerance: number = 0) => {
    s.list.push({
      deleted: false,
      x: x,
      y: y,
      vx: 2,
      width: s.size,
      height: s.size,
      vy: Math.random() * yTolerance - yTolerance / 2,
    });
  };
  const act = () => {
    if (Game.over) return;
    requestAnimationFrame(act);
    s.list = s.list.filter((o) => !o.deleted);
    s.ctx?.clearRect(0, 0, ref_cvs_bullet.value!.width, ref_cvs_bullet.value!.height);
    s.list.forEach((o: any) => {
      o.x! += o.vx!;
      o.y! += o.vy!;
      if (o.x! > GAME_WIDTH) {
        o.deleted = true;
      }
      if (s.imgSuccess) {
        s.ctx.drawImage(s.img, o.x, o.y, s.size, s.size);
      }

      Zombie.list.forEach((z: any) => {
        if (block(o, z)) {
          o.deleted = true;
          z.health -= 1;
          Game.score++;
        }
      });
    });
  };

  const s = reactive({
    list: <ISpirit[]>[],
    name: "bullet_0",
    size: 20,
    ctx: null as any,
    img: new Image(),
    imgSuccess: false,
    //
    add,
  });
  act();
  onMounted(() => {
    s.ctx = ref_cvs_bullet.value!.getContext("2d");
    s.ctx.globalAlpha = 0.2;
    s.img.src = img_bullet;
    s.img.onload = () => {
      s.imgSuccess = true;
    };
  });
  return s;
})();

// 🌱 僵尸 🌱
const Zombie = (() => {
  const add = () => {
    const top = 200;
    const lineHeight = 100;
    const line = Math.floor(Math.random() * 4);
    const y = top + line * lineHeight;
    const x = 1200;
    s.list.push({
      deleted: false,
      id: Math.random() + "",
      health: s.health,
      maxHealth: s.health,
      width: 0,
      height: 100,
      x,
      y,
    });
    if (Game.score < 3000) {
      s.health += Plant.list.length * 0.9;
    } else {
      s.health += Plant.list.length * 8;
    }
  };
  const act = () => {
    if (Game.over) return;
    requestAnimationFrame(act);
    s.cd--;
    if (s.cd <= 0) {
      s.cd = ZOMBIE_CD;
      add();
    }
    s.list = s.list.filter((o) => !o.deleted);
    s.list.forEach((o: any) => {
      if (o.x! < 0) {
        o.deleted = true;
        Game.over = true;
        Game.scoreResult = Game.score;
        return;
      }
      if (o.health <= 0) {
        o.deleted = true;
        Game.score += 100;
      }
      let eating = false;
      Plant.list.forEach((p: any) => {
        if (block(o, p)) {
          p.health -= 0.1;
          eating = true;
        }
      });
      if (!eating) {
        o.x! -= 0.1;
      }
    });
  };

  const s = reactive({
    list: <ISpirit[]>[],
    name: "zomb_0",
    cd: 0,
    health: 5,
  });

  onMounted(act);

  return s;
})();
</script>
<style lang="less" scoped>
.c__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.game {
  position: relative;
  width: 1200px;
  height: 600px;
  background: #4fc1;
  border-radius: 8px;
  overflow: hidden;
}
.shop {
  position: absolute;
  width: 600px;
  height: 400px;
  display: grid;
  grid-template-columns: repeat(8, 100px);
  grid-template-rows: repeat(3, 100px);
  top: 0;
  // left: 100px;
  //
  &--item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    //
    &.is_over {
      opacity: 0.5;
    }
  }
  &--text {
    position: absolute;
    text-align: center;
    width: 100%;
    bottom: -6px;
    font-size: 16px;
    font-weight: bold;
    color: green;
  }
}
.grid {
  position: absolute;
  width: 800px;
  height: 400px;
  display: grid;
  grid-template-columns: repeat(8, 100px);
  grid-template-rows: repeat(4, 100px);
  top: 200px;
  // left: 100px;
  //
  &--item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }
  &--item-inner {
    background: #4fc6;
    width: 90px;
    height: 90px;
    border-radius: 8px;
    transition: 0.2s;
    //
    &:hover {
      background: #4fcc;
    }
  }
}
.bank {
  position: absolute;
  right: 0;
  top: 0;
  width: 100px;
  height: 110px;
}
.sun_score {
  position: absolute;
  text-align: center;
  width: 100px;
  right: 0;
  top: 78px;
  font-size: 20px;
  font-weight: bold;
  color: red;
}
.game_score {
  position: absolute;
  text-align: center;
  width: 100px;
  right: 0;
  top: 120px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: green;
  padding: 0.4em 0;
  border-radius: 8px;
}
.gameover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2em 0;
  font-size: 30px;
  color: #f55;
  font-weight: bold;
  z-index: 999;
  background: #000c;
}
.cvs_bullet {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}
</style>
