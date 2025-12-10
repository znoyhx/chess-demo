export type AdventureType = "dare" | "reward";

export const DARES: string[] = [
  "学猫叫三声",
  "做5个俯卧撑",
  "夸赞对手30秒",
  "模仿一个表情包",
  "用方言解说下三步",
  "深情对视10秒",
  "大喊'我是菜鸟'",
  "唱一首儿歌",
  "喝半杯水",
  "真心话大冒险",

  // 新增 30 个
  "用反话夸对手一句",
  "原地转五圈然后走下一步棋",
  "模仿自己最菜的时候的声音说一句话",
  "学狗叫三声",
  "连续说三次“我不是开玩笑，我是真的菜”",
  "闭眼下一步棋（队友可提醒不撞子）",
  "用手指比心三次",
  "模仿主播吃鸡的语气来一句话",
  "用一句诗形容自己的失误",
  "随机抽一个棋子并向它表白10秒",
  "做一个“我看穿一切”的中二动作",
  "夸对手的棋风像一位名将",
  "给自己的棋王起一个霸气外号",
  "用 rap 描述你下一步的计划",
  "原地跳舞5秒（随便跳）",
  "拍桌轻喊：“我还能赢！”",
  "把对手当导师问一句：我做得怎么样老师？",
  "随机说一句英文（乱说也可以）",
  "拍手10下再走棋",
  "做一个“过肩看天”的帅气姿势",
  "用地方方言模仿一句“你走得很好”",
  "下一步棋前必须比耶手势",
  "做一秒钟僵尸定格动作",
  "用新闻播报的语气复盘刚才失误",
  "模仿一只鸽子的走路方式走到棋盘前",
  "说一句夸张的吹牛话：我下一步将死世界冠军！",
  "对空气鞠躬三次表示歉意",
  "用机器人语音说：启动重新计算程序",
  "下一步棋只能用非惯用手",
  "对着棋盘说：对不起我辜负了你",
];

export const REWARDS: string[] = [
  "连击时刻: 下回合连续走两步(第二步不可吃子)",
  "神速战车: 下回合车可以移动两次",
  "绝对零度: 随机冻结对手一个棋子",
  "和平主义: 对手下回合无法吃子",
  "暴击准备: 下次吃子后可再动一步",
];

export const ADVENTURE_CATALOG: Record<AdventureType, readonly string[]> = {
  dare: DARES,
  reward: REWARDS,
};

export const isAdventureType = (value: unknown): value is AdventureType =>
  value === "dare" || value === "reward";

export const getAdventureByIndex = (
  type: AdventureType,
  index: number
): string | null => {
  const items = ADVENTURE_CATALOG[type];
  return items[index] ?? null;
};
