---
name: vue-fixed-sfc-skeleton
description: "为 Vue 单文件组件生成或重构为固定骨架。用于新建 Vue 组件、按固定 import 顺序整理 script setup、套用 IIFE + reactive 模块模式、补齐 defineProps defineModel defineSlots useRouter useTemplateRef defineExpose 与类型声明。适用于“Vue 骨架”“固定模板”“按骨架重构”“严格套用模板”“script setup 模块化”等请求。"
argument-hint: "描述组件用途、模块名，以及是否强制保留完整骨架占位"
user-invocable: true
---

# Vue Fixed SFC Skeleton

## When to Use

- 新建 Vue 单文件组件时，需要严格遵循固定骨架。
- 现有 Vue 文件需要重构成统一的 script setup 模块化结构。
- 需要把零散逻辑收拢为 IIFE + reactive 模块，并保持暴露接口一致。
- 用户明确提到“严格按骨架”“按模板生成”“默认用这个 Vue 文件结构”。
- 需要把页面逻辑从散装变量和函数，改成模块对象驱动模板访问。

## Outcome

- 产出一个遵循固定骨架的 Vue 文件。
- 默认保留统一的 import 顺序、defineProps、defineModel、defineSlots、router、template ref、IIFE 模块、defineExpose、接口与类型声明。
- 如果模块没有初始化逻辑或 mounted 逻辑，可退化为精简模块骨架。
- 对现有组件重构时，尽量不改 template 和 style，只整理 script setup 结构。

## Scope

- 这是工作区级技能，默认面向当前仓库内的 Vue 单文件组件。
- 适合后台页、表单页、列表页、弹窗页，以及结构型壳组件。
- 对纯 canvas 游戏壳、Three.js 挂载壳、极轻薄桥接组件，不强制塞入完整占位；仍可保留 IIFE 模块化组织，但要避免无意义骨架污染。

## Decision Rules

1. 先判断用户是否明确要求偏离骨架。
2. 如果没有明确要求，严格使用“完整骨架”。
3. 只有在模块确实没有初始化逻辑、没有 mounted 后逻辑，且用户未要求保留这些空位时，才使用“精简模块骨架”。
4. 如果文件已有稳定公共类型、公共工具或外部模块，允许保留外部导入，但组件内部组织方式仍按该骨架落位。
5. 如果用户给了现成业务名词，替换 ExampleModule、Row、ExampleType 等示例命名；不要把示例命名原样留在生产代码里。
6. 如果某些能力确实未使用，例如 router、slots、modelValue、template ref，优先根据项目要求判断是否必须保留；若无明确要求，不保留会产生未使用告警的空占位。
7. 默认优先保留“结构一致性”，但不能为了形式一致而留下明显无意义代码。
8. 如果用户明确说“严格使用完整骨架”，则即便暂时未使用，也保留对应占位，并在能力接入点使用业务化命名。
9. 如果当前仓库已经启用自动导入，只有在用户明确要求时才手写 Vue API import；否则沿用仓库习惯。
10. 如果模板中的状态已经呈现为模块对象访问形式，优先维持这一方向，不回退成散装 ref 和函数。
11. 不要给 reactive 的 s 声明整体类型，例如不要写成 `const s: SomeState = reactive(...)`；优先依赖属性自动推断。
12. 如果确实需要约束 s 中某个属性的类型，只在该属性上使用 `as` 收窄，不给整个 s 套总类型。
13. 变量名统一使用小写加下划线，例如 `ref_example`、`current_image`、`grid_label`。
14. 方法名统一使用小写开头的驼峰，例如 `handleTileClick`、`syncSolvedState`、`initOnMounted`。
15. 模块名统一使用大写开头的驼峰，例如 `ExampleModule`、`PicturePuzzleBoard`、`ImagePanel`。
16. CSS 类名统一使用小写加下划线，例如 `.board_wrap`、`.status_card`、`.reference_image`。
17. 样式状态类统一使用 `.is_xxx` 命名，并且必须依附于基础类内部定义，例如 `.box { &.is_success { ... } }`；不允许单独写 `.is_success { ... }` 这类独立状态样式。
18. 如果组件存在根组件样式，根类名必须使用 `c__` 前缀，例如 `.c__component_root`；这个前缀规则只用于组件根类，不扩散到普通子类名。

## Skeleton Policy

- 完整骨架：用于明确要求严格套模板，或该组件确实会用到 props、model、slots、router、template ref、defineExpose 中的大部分能力。
- 精简骨架：用于单一模块、无初始化、无 mounted、无对外暴露、无路由依赖的轻量组件。
- 折中骨架：保留 IIFE 模块、必要的 defineProps 或 ref，但删除不会使用的 model、slots、router、defineExpose 占位。
- 如果用户没有显式指定，优先选择“完整骨架”或“折中骨架”，不要机械地总是生成最小版。

## Unused Capability Rules

- props：仅在组件确实接收外部输入，或用户明确要求完整骨架时保留。
- modelValue：仅在组件有双向绑定语义时保留。
- slots：仅在组件需要消费插槽，或用户要求完整骨架时保留。
- router：仅在组件存在跳转、路由读取、返回等行为时保留。
- template ref：仅在需要 DOM、子组件实例、测量、滚动、聚焦时保留。
- defineExpose：仅在父组件或外部调用需要访问内部状态和方法时保留。

## Naming Rules

- 变量名：小写加下划线。
- 方法名：小写开头的驼峰。
- 模块名：大写开头的驼峰。
- 类型名：沿用 TypeScript 常规，接口和类型别名使用大写开头的驼峰。
- CSS 类名：小写加下划线。
- 根组件样式类名：必须使用 `c__` 前缀，例如 `.c__picture_puzzle`、`.c__user_dialog_root`。
- CSS 状态类：统一使用 `.is_xxx`，且只能作为基础类的附加状态出现。

```ts
const ref_example = useTemplateRef<HTMLDivElement>("ref_example");
const grid_label = "4 x 4";

const handleTileClick = (index: number) => {
  console.log(index);
};

const PicturePuzzleBoard = (() => {
  const s = reactive({
    current_image: "",
  });

  return s;
})();
```

```less
.c__picture_puzzle {
  min-height: 100%;
}

.board_wrap {
  &.is_solved {
    box-shadow: 0 0 0 2px #fbbf24;
  }
}
```

## Procedure

1. 识别目标文件是“新建”还是“重构”。
2. 提取该组件真正需要的输入输出：props、model、slots、expose、refs、router、模块名、核心类型。
3. 判断应使用完整骨架、折中骨架还是精简骨架，并记录删除哪些未使用能力。
4. 先确定脚本骨架和命名方案，再把业务逻辑填入模块内，避免先写零散函数后再回收结构。
5. 默认使用以下 import 和定义顺序：

```ts
import { computed, onMounted, reactive, useTemplateRef } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  entry: {
    default: "service_manager" as "service_manager" | "financial_manager",
  },
  row: {
    default: () => ({}) as Row,
  },
});

const modelValue = defineModel<string>();

const slots = defineSlots<{}>();

const router = useRouter();

const ref_example = useTemplateRef<HTMLDivElement>("ref_example");
```

6. 如果仓库已使用 Vue 自动导入，可以按仓库约定省略这些 import，但保留其声明顺序和骨架位置。
7. 把主要逻辑写成单个或多个 IIFE 模块；每个模块内部优先使用这个顺序：同步方法、异步方法、初始化方法、mounted 方法、计算属性、选择/动作方法、reactive 状态、init 调用、onMounted 调用、return。
8. 定义 reactive 状态时，不要给 s 写总类型，保持自动推断；如果某个属性需要显式类型，直接在该属性值上用 `as`。
9. 命名时严格执行变量小写下划线、方法小驼峰、模块大驼峰、CSS 类小写下划线的规则；不要在同一文件混用不同命名风格。

```ts
const ExampleModule = (() => {
  const fn1 = () => {
    console.log(1);
  };

  const fn2 = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(2);
  };

  const init = () => {
    console.log("模块初始化示例");
  };

  const initOnMounted = () => {
    console.log("组件挂载后执行示例");
  };

  const computeStateOnePlusTwo = () => {
    return s.state1 + s.state2;
  };

  const selectRow = (row: Row) => {
    console.log(row.id);
  };

  const s = reactive({
    state1: "1",
    state2: "2",
    type: "a" as ExampleType,
    stateOnePlusTwo: computed(computeStateOnePlusTwo),
    fn1,
    fn2,
    selectRow,
  });

  init();
  onMounted(initOnMounted);

  return s;
})();
```

10. 如果模块没有初始化逻辑或 mounted 后逻辑，改用精简写法，不要保留空实现：

```ts
const ExampleModule = (() => {
  const fn1 = () => {
    console.log(1);
  };

  const s = reactive({
    fn1,
  });

  return s;
})();
```

11. 写样式时，如果存在组件根样式，根类名必须使用 `c__` 前缀；其余基础类使用小写下划线；状态类必须写成 `&.is_xxx` 并挂在基础类内，不允许把状态类拆成独立选择器。

```less
.c__user_panel {
  padding: 16px;
}

.status_card {
  color: #cbd5e1;

  &.is_active {
    color: #0f172a;
    background: #fde68a;
  }
}
```

12. 在 script 尾部统一放置 expose 和类型声明；如果没有 expose 需求，则只保留类型声明：

```ts
defineExpose({
  ExampleModule,
  ref_example,
});

interface Row {
  id: string;
  name: string;
}

type ExampleType = "a" | "b";
```

13. 如果是重构现有文件：

- 先保持模板和样式尽量不动。
- 只重组 script setup 的结构与命名。
- 把散落状态并入 reactive 模块。
- 把模板上的状态访问改成模块对象访问，例如从 state 改成 ExampleModule.state。
- 如果已存在 common.ts、types.ts、classes/ 等稳定边界，优先复用，不把外部模块硬塞回单文件里。
- 如果现有文件命名风格不一致，在本次重构范围内统一为变量下划线、方法小驼峰、模块大驼峰、类名下划线。
- 如果现有文件存在根组件样式，把根类名统一为 `c__xxx` 形式。
- 如果现有状态样式是独立 `.is_xxx`，改为挂在基础类上的 `&.is_xxx` 形式。

14. 完成后做最小验证：

- 检查 import 是否与实际使用一致。
- 检查 defineExpose 暴露项是否真实存在。
- 检查 computed 是否通过函数定义后再注入 reactive。
- 检查 onMounted 中的方法是否只处理挂载后逻辑。
- 检查是否错误保留了未使用的 router、slots、model、template ref。
- 检查是否错误给 s 添加了整体类型，而不是只在属性上使用 `as`。
- 检查变量、方法、模块、CSS 类名是否符合命名规范。
- 检查根组件样式类名是否使用 `c__` 前缀。
- 检查 `.is_xxx` 是否全部依附于基础类，而不是独立定义。
- 对 Vue/TypeScript 项目运行受影响切片的类型检查。

## Quality Bar

- 骨架顺序稳定，不随单个组件习惯漂移。
- 模块命名和业务语义一致，不保留 Example 占位名。
- 没有空的 init、空的 onMounted、空的 slots 或无意义占位代码，除非用户明确要求保留。
- 模板访问路径清晰，优先通过模块对象访问。
- 类型声明放在文件尾部，命名明确。
- s 保持自动推断，不写总类型；需要显式类型时，仅在单个属性上使用 `as`。
- 变量名使用小写加下划线，方法名使用小驼峰，模块名使用大驼峰。
- 根组件样式使用 `c__` 前缀，其余 CSS 类名使用小写加下划线，状态类统一使用依附基础类的 `&.is_xxx`。
- 对仓库约定敏感：自动导入、common.ts、types.ts、薄壳组件模式不能被骨架强行破坏。

## Notes

- 这是“固定骨架技能”，重点是结构一致性，不是自由发挥的 Vue 最佳实践集合。
- 如果仓库已有更高优先级的项目约定，先满足项目约定，再在可兼容范围内套用该骨架。

## Example Prompts

- 按这个固定骨架新建一个用户详情弹窗组件。
- 把这个 Vue 文件按固定模板重构成 IIFE 模块结构，尽量不改模板和样式。
- 用完整骨架生成一个带 props、modelValue、router 跳转的表单页组件。
- 用折中骨架重构这个轻量组件，删掉未使用的 slots、router 和 defineExpose。
