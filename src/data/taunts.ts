export type TauntType = "opening" | "skillUsed" | "playerThreaten" | "aiThreaten" | "winning" | "losing";

const TAUNTS: Record<TauntType, string[]> = {
  opening: [
    "哼，今天本棋圣就让你见识见识真正的五子棋！",
    "你来了？那就别想走了。",
    "以为靠几张破卡就能赢我？做梦！",
    "我已经想好怎么赢你了，你呢？",
    "嘿嘿，棋盘已经布置好了，就等你来送死。",
  ],
  skillUsed: [
    "什么鬼技能？不过是小把戏而已！",
    "哼，雕虫小技！",
    "你以为这样就能赢我？太天真了！",
    "就这？就这？！",
    "使出这种招数，说明你已经黔驴技穷了吧？",
    "呵，投机取巧罢了。",
    "好吧，我承认这招有点出乎意料……但也仅此而已！",
  ],
  playerThreaten: [
    "嘿！你以为我没看到吗？",
    "喂喂喂，别想玩花样！",
    "有点意思……但还不够！",
    "你以为形成三连就赢了？太早了！",
    "呦，还真有两下子，继续吧。",
  ],
  aiThreaten: [
    "看到了吗？这才叫布局！",
    "嘿嘿，你感受到压力了吗？",
    "四连了哦，你慌了吗？",
    "我的棋势已成，你挡得住吗？",
    "大势已去，不如早点认负？",
  ],
  winning: [
    "哈哈哈！黑子五连！你输了！",
    "我就说嘛，靠几张卡怎么可能赢我！",
    "承认吧，你的棋艺还需要修炼！",
    "再战一局？下次我会更快赢你！",
    "这就是差距！",
  ],
  losing: [
    "不可能！绝对不可能！",
    "一定是那该死的成语技能！不公平！",
    "这……这不算数！重来！",
    "哼，故意放水，让你高兴高兴。",
    "下次你就没这么好运了！",
  ],
};

export function getRandomTaunt(type: TauntType): string {
  const list = TAUNTS[type];
  return list[Math.floor(Math.random() * list.length)];
}
