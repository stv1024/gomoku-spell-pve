# 技能五子棋 PVE — 开发计划

本文档是 Claude Code 的开发指引。按 Phase 顺序开发，每个 Phase 产出可运行的版本。

---

## 技术栈约定

- **框架**：React + TypeScript
- **构建**：Vite
- **样式**：Tailwind CSS
- **状态管理**：React Context + useReducer，不引入外部状态库
- **AI 接口**：OpenRouter API（通过 fetch 调用，兼容多模型）
- **部署**：纯前端静态站点，无后端。API Key 由用户在设置页自行填入，存 localStorage

---

## 目录结构约定

```
src/
  components/        # React 组件
    Board.tsx         # 棋盘渲染
    Stone.tsx         # 单颗棋子
    HandCards.tsx     # 手牌栏
    CardPicker.tsx    # 三选一抽卡面板
    LevelSelect.tsx   # 关卡选择
    OpponentDialog.tsx # 对手吐槽气泡
    SettingsPanel.tsx  # 设置面板（API Key 等）
  engine/            # 游戏引擎（纯逻辑，不依赖 React）
    board.ts          # 棋盘数据结构与操作
    rules.ts          # 胜负判定
    ai.ts             # AI 对手
    skillSandbox.ts   # 技能沙盒执行
    boardAPI.ts       # BoardAPI 实现
  game/              # 游戏流程控制
    gameState.ts      # 游戏状态定义与 reducer
    gameFlow.ts       # 回合流程编排
    cardSystem.ts     # 手牌系统
  levels/            # 关卡数据
    levels.ts         # 所有关卡定义（纯数据）
  ai/                # AI 技能生成
    skillGenerator.ts # 调用 OpenRouter API 生成技能
    prompt.ts         # prompt 模板
    skillCache.ts     # 局内技能缓存（第三张卡的自定义成语）
  data/              # 静态数据
    presetSkills.ts   # 预制成语技能库（30+ 条，手写 executeCode）
    taunts.ts         # 对手吐槽文案库
  types/             # 全局类型定义
    index.ts
```

---

## 全局类型定义

以下类型是整个项目的基础，所有模块都依赖它们。在 `types/index.ts` 中定义：

```typescript
// 棋子颜色
type Color = "black" | "white";

// 格子状态
type Cell = Color | null;

// 棋盘：15x15 二维数组
type Board = Cell[][];

// 坐标
type Pos = { row: number; col: number };

// 关卡定义
type Level = {
  id: number;
  name: string;
  description: string;
  blackStones: Pos[];          // 预置黑子坐标
  aiLevel: "random" | "basic" | "intermediate";
};

// 技能定义
type Skill = {
  name: string;                // 四字成语
  description: string;         // 一句话效果描述
  flavor: string;              // 趣味文案
  executeCode: string;         // 技能函数体字符串
};

// 手牌
type HandCard = {
  id: string;                  // 唯一 ID（用于 React key）
  skill: Skill;
};

// 游戏状态
type GameState = {
  board: Board;
  currentTurn: "player" | "ai";
  turnNumber: number;
  hand: HandCard[];            // 当前手牌（最多 5 张）
  phase:
    | "selecting"              // 关卡选择
    | "playerTurn"             // 等待玩家落子
    | "skillExecuting"         // 技能执行中（等待 requestChoice 交互）
    | "aiTurn"                 // AI 落子中
    | "cardPicking"            // 三选一抽卡
    | "won"
    | "lost";
  levelId: number;
  skillUsedThisTurn: boolean;  // 本回合是否已使用技能
};

// BoardAPI 接口（技能代码调用的 API）
interface BoardAPI {
  // 读
  get(row: number, col: number): Cell;
  findAll(color: Color): Pos[];
  findEmpty(): Pos[];
  countInDirection(row: number, col: number, color: Color, dr: number, dc: number): number;
  getBoardSize(): number;
  // 写
  place(row: number, col: number, color: Color): void;
  remove(row: number, col: number): void;
  transform(row: number, col: number, newColor: Color): void;
  move(fromRow: number, fromCol: number, toRow: number, toCol: number): void;
  swap(r1: number, c1: number, r2: number, c2: number): void;
  // 交互
  requestChoice(candidates: Pos[]): Promise<Pos>;
}
```

---

## Phase 1：可发布的离线版（预制技能 + 纯五子棋）

**目标**：不接 AI，依赖预制技能库，跑通完整的一局游戏。Phase 1 完成即可对外发布。

### 1.1 棋盘引擎 (`engine/board.ts`)

- `createBoard(): Board` — 创建空棋盘（15x15 全 null）
- `initBoard(blackStones: Pos[]): Board` — 用关卡数据初始化
- `cloneBoard(board: Board): Board` — 深拷贝
- `placeStoneTo(board: Board, pos: Pos, color: Color): Board` — 放置棋子，返回新 board（不可变更新）

所有 board 操作返回新对象，不 mutate 原数组。这是为了配合 React 状态更新和回滚能力。

### 1.2 胜负判定 (`engine/rules.ts`)

- `checkWin(board: Board): Color | null` — 扫描整个棋盘，返回五连的颜色或 null
- 四方向扫描（横、竖、两对角线），对每个有棋子的格子检查正方向连续同色数 ≥ 5

### 1.3 AI 对手 (`engine/ai.ts`)

Phase 1 只实现 random 和 basic：

- `aiMove(board: Board, level: "random" | "basic" | "intermediate"): Pos`
- **random**：从 `findEmpty()` 随机选一个
- **basic**：对每个空位打分。进攻分 = 落黑子后最长黑连线，防守分 = 该位置若被白子占则最长白连线。总分 = 进攻分 × 1.0 + 防守分 × 1.2。取最高分。分数相同时随机选。

### 1.4 技能沙盒 (`engine/skillSandbox.ts`)

- `executeSkill(board: Board, executeCode: string, onRequestChoice: ...): Promise<Board>`
- 用 `new Function("api", executeCode)` 构造函数
- 传入 BoardAPI 实例，内部操作一个 board 的深拷贝
- 执行完毕后校验：如果产生黑子五连，返回原 board（回滚）；否则返回修改后的 board
- 整个执行过程用 try-catch 包裹，任何运行时错误都 catch 住，跳过该技能，手牌退回，游戏继续

### 1.5 BoardAPI 实现 (`engine/boardAPI.ts`)

实现 `BoardAPI` 接口。所有写操作带校验：

| 操作 | 校验条件 |
|------|----------|
| place | 目标必须为 null，否则跳过 |
| remove | 目标必须非 null，否则跳过 |
| transform | 目标必须非 null 且颜色不同，否则跳过 |
| move | 起点非 null + 终点 null，否则跳过 |
| swap | 至少一个非 null，否则跳过 |

写操作直接修改内部 board 副本（沙盒内可 mutate，执行完后整体返回给引擎）。

### 1.6 预制技能库 (`data/presetSkills.ts`)

内置 30 个精选成语技能，每个都有手写的 `executeCode`。这是游戏的核心内容资产，也是无 API Key 玩家的完整体验基础。选题偏向动作感强、效果直观的成语。

示例（开发期先写 5 个跑通流程，上线前由作者补全至 30 个并人工验收）：

```typescript
// 釜底抽薪：移除一颗指定的黑子
{
  name: "釜底抽薪",
  description: "移除一颗指定的黑子",
  flavor: "抽掉关键一子，全盘皆活",
  executeCode: `
    const blacks = api.findAll("black");
    const target = await api.requestChoice(blacks);
    api.remove(target.row, target.col);
  `
}

// 偷梁换柱：将一颗黑子变为白子
{
  name: "偷梁换柱",
  description: "将一颗指定的黑子变为白子",
  flavor: "不知不觉，敌为我用",
  executeCode: `
    const blacks = api.findAll("black");
    const target = await api.requestChoice(blacks);
    api.transform(target.row, target.col, "white");
  `
}

// 乾坤大挪移：交换一颗黑子和一颗白子的位置
{
  name: "乾坤大挪移",
  description: "交换一颗黑子和一颗白子的位置",
  flavor: "乾坤倒转，黑白易位",
  executeCode: `
    const blacks = api.findAll("black");
    const whites = api.findAll("white");
    const b = await api.requestChoice(blacks);
    const w = await api.requestChoice(whites);
    api.swap(b.row, b.col, w.row, w.col);
  `
}
```

### 1.7 游戏流程 (`game/gameFlow.ts`)

编排一个完整回合：

```
function playerTurn():
  1. if turnNumber > 0 && turnNumber % 3 === 0 → 触发抽卡（phase = "cardPicking"）
  2. 等待玩家操作（使用手牌 and/or 落子）
     - 使用手牌时 phase = "skillExecuting"，执行完后回到 "playerTurn"
  3. 落子后 checkWin → 白赢则 phase = "won"

function aiTurn():
  1. pos = aiMove(board, level)
  2. board = placeStoneTo(board, pos, "black")
  3. checkWin → 黑赢则 phase = "lost"
  4. 触发吐槽判定
  5. turnNumber++
```

### 1.8 React 组件

**Board.tsx**：渲染 15×15 棋盘。用 CSS Grid。每个格子是一个可点击区域。棋盘背景色 `#d4a843`，网格线 1px `#8B6914`。黑子用径向渐变 `#555 → #111`，白子 `#fff → #ccc`。

**HandCards.tsx**：底部横排卡片。每张卡显示成语名和一句话描述。点击选中，再点击棋盘目标执行。选中状态用边框高亮。

**CardPicker.tsx**：三选一浮层。三张卡并排展示。Phase 1 中三张卡全部从 `presetSkills` 随机抽取（Phase 2 改造第三张）。

**OpponentDialog.tsx**：棋盘上方的气泡。显示对手头像 + 一句话。3 秒后自动消失。

### 1.9 关卡数据

Phase 1 写 10 个关卡，在 `levels/levels.ts` 中定义。分两个难度段：
- 关卡 1-5：random AI，黑子 6-15 颗，无威胁阵型
- 关卡 6-10：basic AI，黑子 15-30 颗，有简单三连

### 1.10 Phase 1 验收标准

- [ ] 能选关卡进入游戏
- [ ] 棋盘正确渲染预置黑子
- [ ] 玩家能落白子
- [ ] AI 能自动落黑子
- [ ] 胜负判定正确
- [ ] 能使用预制技能卡（含 requestChoice 交互）
- [ ] 技能效果正确反映在棋盘上
- [ ] skillExecuting phase 期间棋盘点击用于选目标，不触发落子
- [ ] 三选一抽卡流程可用
- [ ] 对手吐槽在正确时机出现
- [ ] 手牌上限 5 张

---

## Phase 2：AI 技能生成（第三张卡）

**目标**：接入 OpenRouter API，仅用于第三张卡的自定义成语实时生成。

### 2.1 设置页 (`components/SettingsPanel.tsx`)

- 输入 OpenRouter API Key，存 localStorage
- 提供模型选择下拉框，默认 `anthropic/claude-sonnet-4`，支持切换其他模型
- 启动时检查是否有 Key，无则在第三张卡位置展示引导提示

### 2.2 Prompt 模板 (`ai/prompt.ts`)

System prompt 包含：

- BoardAPI 的完整接口说明（方法签名和语义）
- 约束规则（最多影响 5 格、不要直接凑白五连、不能全清黑子）
- 输出格式（JSON：name, description, flavor, executeCode）
- 3 个示例技能作为 few-shot

User prompt：`请将成语「{idiom}」解读为一个五子棋技能。`

### 2.3 技能生成器 (`ai/skillGenerator.ts`)

- `generateSkill(idiom: string, apiKey: string, model: string): Promise<Skill>`
- 调用 OpenRouter API（`https://openrouter.ai/api/v1/chat/completions`，OpenAI 兼容格式）
- 请求头：`Authorization: Bearer {apiKey}`
- 解析返回的 JSON
- 错误处理：JSON 解析失败时重试一次；API 错误时返回一个兜底技能（随机移除一颗黑子）

### 2.4 技能缓存 (`ai/skillCache.ts`)

- 局内缓存：`Map<string, Skill>`，key 是成语文本
- 同一局中同一个成语只生成一次
- 新一局清空缓存

### 2.5 CardPicker 改造

Phase 2 对 CardPicker 的三张卡行为做如下区分：

| 卡位 | 有 API Key | 无 API Key |
|------|-----------|-----------|
| 第一张 | 从预制池随机抽取 | 从预制池随机抽取 |
| 第二张 | 从预制池随机抽取 | 从预制池随机抽取 |
| 第三张 | 显示输入框，玩家输入成语后实时生成 | 显示锁定状态 + "前往设置填写 API Key 解锁" |

第三张卡的生成流程：
1. 玩家输入成语，点击确认
2. 卡片切换为 loading 状态（显示成语名 + 转圈）
3. 生成完成后展示技能效果，玩家可选择或重新输入

### 2.6 Phase 2 验收标准

- [ ] 设置页可输入 OpenRouter API Key 和选择模型
- [ ] 第三张卡在有 API Key 时显示自定义输入框
- [ ] 第三张卡在无 API Key 时显示锁定状态和引导文案
- [ ] 自定义成语能实时生成技能并展示
- [ ] 生成的技能能在沙盒中正确执行
- [ ] 局内缓存生效（同一成语不重复调用 API）
- [ ] API 调用失败时有兜底处理

---

## Phase 3：内容扩充与关卡进度

**目标**：扩充到 20 关，完善 AI 对手，保存关卡进度。

### 3.1 关卡扩充

- 扩充到 20 关，写入 `levels/levels.ts`
- 分 3 个章节：入门（1-7）、进阶（8-14）、高手（15-20）
- 每章引入新的 AI 水平和黑子密度

### 3.2 intermediate AI

- 在 basic 基础上加 2 层 minimax + alpha-beta 剪枝
- 评估函数：活四 > 冲四 > 活三 > 眠三 > 活二，分值递减
- 在主线程执行（2 层搜索通常 < 50ms，无需 Web Worker）

### 3.3 关卡进度

- 通关记录存 localStorage
- 关卡列表中已通关标绿，下一关可进入，后续关卡锁定
- 支持重玩已通关关卡

### 3.4 Phase 3 验收标准

- [ ] 20 关可游玩
- [ ] intermediate AI 明显比 basic 更强
- [ ] 关卡进度正确保存和恢复
- [ ] 关卡选择界面清晰展示进度

---

## Phase 4：体验打磨

**目标**：让产品可以分享出去。

### 4.1 技能动画

- 移除棋子：淡出 + 缩小
- 变色：翻转动画
- 移动/交换：滑动动画
- 落子：弹性缩放

技能执行时逐步播放动画，不要瞬间完成，让玩家看到发生了什么。

### 4.2 对手吐槽完善

- 扩充文案库到每类 10-20 条
- 根据关卡章节切换对手人格（入门章是菜鸟、进阶章是正常对手、高手章是老手口吻）

### 4.3 音效

- 落子音效
- 技能使用音效
- 胜利/失败音效

### 4.4 移动端适配

- 棋盘触控适配（点击精度、缩放）
- 手牌栏横向滚动
- 抽卡面板全屏展示

### 4.5 Phase 4 验收标准

- [ ] 技能执行有流畅的视觉反馈
- [ ] 对手吐槽不重复、有性格
- [ ] 手机上可以正常游玩
- [ ] 可以分享 URL 给他人直接玩

---

## 开发约定

### 不可变数据

Board 的所有更新都返回新数组，不 mutate。组件通过状态变化触发重渲染。唯一允许 mutate 的地方是 skillSandbox 内部的工作副本。

### 引擎与 UI 分离

`engine/` 目录下的所有模块不 import React，不访问 DOM。它们是纯函数/纯逻辑，输入输出都是普通 JS 对象。这样方便单独测试，也为未来可能的 Worker 迁移留口子。

### 异步处理

技能执行中的 `requestChoice` 是异步操作（需要等待用户交互）。用 Promise 实现：调用 requestChoice 时游戏进入 `skillExecuting` phase，UI 切换为选目标模式，用户点击后 resolve Promise，技能函数继续执行，完成后 phase 回到 `playerTurn`。

### 错误边界

技能沙盒执行用 try-catch 包裹。任何运行时错误（AI 生成的代码有 bug，或预制技能遇到边界情况）都 catch 住，跳过该技能，手牌退回，游戏继续。控制台打印错误信息用于调试。

### 坐标系

行 row 从上到下 0-14，列 col 从左到右 0-14。`board[row][col]`。所有 API、数据、组件统一使用此约定。

### 安全说明

技能沙盒用 `new Function` 执行字符串代码，存在 XSS 风险。这是已知的设计 tradeoff：预制技能由作者手写并人工验收，AI 生成的技能所用的 API Key 是玩家自己的，风险自担。不引入 iframe 沙盒等额外复杂度。
