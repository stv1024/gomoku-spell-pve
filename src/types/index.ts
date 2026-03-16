// 棋子颜色
export type Color = "black" | "white";

// 格子状态
export type Cell = Color | null;

// 棋盘：15x15 二维数组
export type Board = Cell[][];

// 坐标
export type Pos = { row: number; col: number };

// 关卡定义
export type Level = {
  id: number;
  name: string;
  description: string;
  blackStones: Pos[];
};

// 技能定义
export type Skill = {
  name: string;
  description: string;
  flavor: string;
  executeCode: string;
};

// 手牌
export type HandCard = {
  id: string;
  skill: Skill;
};

// 游戏状态
export type GameState = {
  board: Board;
  currentTurn: "player" | "ai";
  turnNumber: number;
  hand: HandCard[];
  phase:
    | "selecting"
    | "playerTurn"
    | "skillExecuting"
    | "aiTurn"
    | "cardPicking"
    | "won"
    | "lost";
  levelId: number;
  skillUsedThisTurn: boolean;
  pendingChoiceResolve: ((pos: Pos) => void) | null;
  choiceCandidates: Pos[];
  taunt: string | null;
  lastMove: Pos | null;
  highlightedCells: Pos[];
};

// BoardAPI 接口（技能代码调用的 API）
export interface BoardAPI {
  get(row: number, col: number): Cell;
  findAll(color: Color): Pos[];
  findEmpty(): Pos[];
  countInDirection(row: number, col: number, color: Color, dr: number, dc: number): number;
  getBoardSize(): number;
  place(row: number, col: number, color: Color): void;
  remove(row: number, col: number): void;
  transform(row: number, col: number, newColor: Color): void;
  move(fromRow: number, fromCol: number, toRow: number, toCol: number): void;
  swap(r1: number, c1: number, r2: number, c2: number): void;
  requestChoice(candidates: Pos[]): Promise<Pos>;
}
