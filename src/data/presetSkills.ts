import type { Skill } from "../types";

export const PRESET_SKILLS: Skill[] = [
  // ─── 普通 (common) ─── 基础单目标效果
  {
    name: "釜底抽薪",
    description: "移除一颗指定的黑子",
    flavor: "抽掉关键一子，全盘皆活",
    rarity: "common",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const target = await api.requestChoice(blacks);
      api.remove(target.row, target.col);
    `,
  },
  {
    name: "移花接木",
    description: "将一颗黑子移动到指定空位",
    flavor: "挪开碍眼之子，妙手布局",
    rarity: "common",
    executeCode: `
      const blacks = api.findAll("black");
      const empty = api.findEmpty();
      if (blacks.length === 0 || empty.length === 0) return;
      const from = await api.requestChoice(blacks);
      const to = await api.requestChoice(empty);
      api.move(from.row, from.col, to.row, to.col);
    `,
  },
  {
    name: "无中生有",
    description: "在指定空位放置一颗白子",
    flavor: "凭空一子，抢占要地",
    rarity: "common",
    executeCode: `
      const empty = api.findEmpty();
      if (empty.length === 0) return;
      const target = await api.requestChoice(empty);
      api.place(target.row, target.col, "white");
    `,
  },
  {
    name: "暗度陈仓",
    description: "在棋盘中心区域放置一颗白子",
    flavor: "出奇制胜，占据要津",
    rarity: "common",
    executeCode: `
      const empty = api.findEmpty();
      const center = empty.filter(p => p.row >= 5 && p.row <= 9 && p.col >= 5 && p.col <= 9);
      const pool = center.length > 0 ? center : empty;
      if (pool.length === 0) return;
      const target = pool[Math.floor(Math.random() * pool.length)];
      api.place(target.row, target.col, "white");
    `,
  },
  {
    name: "调虎离山",
    description: "将一颗黑子从当前位置移动到棋盘边缘",
    flavor: "引虎出山，本阵空虚",
    rarity: "common",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const target = await api.requestChoice(blacks);
      const edgeCells = api.findEmpty().filter(p => p.row === 0 || p.row === size-1 || p.col === 0 || p.col === size-1);
      if (edgeCells.length === 0) { api.remove(target.row, target.col); return; }
      let minDist = Infinity;
      let dest = edgeCells[0];
      for (const e of edgeCells) {
        const dist = Math.abs(e.row - target.row) + Math.abs(e.col - target.col);
        if (dist < minDist) { minDist = dist; dest = e; }
      }
      api.move(target.row, target.col, dest.row, dest.col);
    `,
  },
  {
    name: "顺水推舟",
    description: "将一颗黑子推向最近的边缘",
    flavor: "顺势而为，省力又高效",
    rarity: "common",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const target = await api.requestChoice(blacks);
      const distUp = target.row;
      const distDown = size - 1 - target.row;
      const distLeft = target.col;
      const distRight = size - 1 - target.col;
      const minDist = Math.min(distUp, distDown, distLeft, distRight);
      let dr = 0, dc = 0;
      if (minDist === distUp) dr = -1;
      else if (minDist === distDown) dr = 1;
      else if (minDist === distLeft) dc = -1;
      else dc = 1;
      let r = target.row + dr, c = target.col + dc;
      while (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === null) {
        r += dr; c += dc;
      }
      r -= dr; c -= dc;
      if (r !== target.row || c !== target.col) {
        api.move(target.row, target.col, r, c);
      }
    `,
  },
  {
    name: "攻其不备",
    description: "在黑子阵型的薄弱处放置白子",
    flavor: "出其不意，攻其不备",
    rarity: "common",
    executeCode: `
      const empty = api.findEmpty();
      if (empty.length === 0) return;
      const size = api.getBoardSize();
      let bestScore = -1;
      let bestPos = empty[0];
      for (const pos of empty) {
        let score = 0;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const r = pos.row + dr, c = pos.col + dc;
            if (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === "black") score++;
          }
        }
        if (score > bestScore) { bestScore = score; bestPos = pos; }
      }
      api.place(bestPos.row, bestPos.col, "white");
    `,
  },

  // ─── 稀有 (rare) ─── 智能选目标 / 组合效果
  {
    name: "偷梁换柱",
    description: "将一颗指定的黑子变为白子",
    flavor: "不知不觉，敌为我用",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const target = await api.requestChoice(blacks);
      api.transform(target.row, target.col, "white");
    `,
  },
  {
    name: "乾坤大挪移",
    description: "交换一颗黑子和一颗白子的位置",
    flavor: "乾坤倒转，黑白易位",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      const whites = api.findAll("white");
      if (blacks.length === 0 || whites.length === 0) return;
      const b = await api.requestChoice(blacks);
      const w = await api.requestChoice(whites);
      api.swap(b.row, b.col, w.row, w.col);
    `,
  },
  {
    name: "以逸待劳",
    description: "移除距白子最近的一颗黑子",
    flavor: "以静制动，以逸待劳",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      const whites = api.findAll("white");
      if (blacks.length === 0) return;
      if (whites.length === 0) {
        api.remove(blacks[0].row, blacks[0].col);
        return;
      }
      let minDist = Infinity;
      let target = blacks[0];
      for (const b of blacks) {
        for (const w of whites) {
          const dist = Math.abs(b.row - w.row) + Math.abs(b.col - w.col);
          if (dist < minDist) {
            minDist = dist;
            target = b;
          }
        }
      }
      api.remove(target.row, target.col);
    `,
  },
  {
    name: "顺手牵羊",
    description: "将一颗孤立的黑子变为白子",
    flavor: "随手捎走，不费吹灰之力",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      let minNeighbors = Infinity;
      let target = blacks[0];
      for (const b of blacks) {
        let neighbors = 0;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = b.row + dr, c = b.col + dc;
            if (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === "black") neighbors++;
          }
        }
        if (neighbors < minNeighbors) { minNeighbors = neighbors; target = b; }
      }
      api.transform(target.row, target.col, "white");
    `,
  },
  {
    name: "借刀杀人",
    description: "将最危险的黑子（形成最长连线）移走",
    flavor: "借他人之力，除心腹大患",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      let maxLen = 0;
      let target = blacks[0];
      for (const b of blacks) {
        for (const [dr, dc] of dirs) {
          let count = 1;
          for (const sign of [1, -1]) {
            let r = b.row + sign * dr, c = b.col + sign * dc;
            while (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === "black") {
              count++;
              r += sign * dr;
              c += sign * dc;
            }
          }
          if (count > maxLen) { maxLen = count; target = b; }
        }
      }
      const empty = api.findEmpty();
      if (empty.length === 0) { api.remove(target.row, target.col); return; }
      const dest = empty[Math.floor(Math.random() * empty.length)];
      api.move(target.row, target.col, dest.row, dest.col);
    `,
  },
  {
    name: "反客为主",
    description: "将最中心的黑子变为白子",
    flavor: "鸠占鹊巢，反客为主",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      let minDist = Infinity;
      let target = blacks[0];
      for (const b of blacks) {
        const dist = Math.abs(b.row - 7) + Math.abs(b.col - 7);
        if (dist < minDist) { minDist = dist; target = b; }
      }
      api.transform(target.row, target.col, "white");
    `,
  },
  {
    name: "隔岸观火",
    description: "将棋盘右侧的一颗黑子变为白子",
    flavor: "坐山观虎斗，坐收渔利",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const rightBlacks = blacks.filter(b => b.col >= 8).sort((a, b) => b.col - a.col);
      const target = rightBlacks.length > 0 ? rightBlacks[0] : blacks[Math.floor(Math.random() * blacks.length)];
      api.transform(target.row, target.col, "white");
    `,
  },
  {
    name: "上屋抽梯",
    description: "移除黑子连线中间的一颗，断开连线",
    flavor: "抽去梯子，让对手进退两难",
    rarity: "rare",
    executeCode: `
      const size = api.getBoardSize();
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      let bestLen = 0;
      let bestMid = null;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (api.get(row, col) !== "black") continue;
          for (const [dr, dc] of dirs) {
            let stones = [{ row, col }];
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === "black") {
              stones.push({ row: r, col: c });
              r += dr; c += dc;
            }
            if (stones.length > bestLen) {
              bestLen = stones.length;
              bestMid = stones[Math.floor(stones.length / 2)];
            }
          }
        }
      }
      if (bestMid) api.remove(bestMid.row, bestMid.col);
    `,
  },
  {
    name: "无懈可击",
    description: "封堵最长黑子连线的两端",
    flavor: "滴水不漏，无懈可击",
    rarity: "rare",
    executeCode: `
      const size = api.getBoardSize();
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      let maxLen = 0;
      let bestStart = null, bestEnd = null;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (api.get(row, col) !== "black") continue;
          for (const [dr, dc] of dirs) {
            let len = 1;
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === "black") {
              len++; r += dr; c += dc;
            }
            const endR = r, endC = c;
            const beforeR = row - dr, beforeC = col - dc;
            if (len > maxLen) {
              maxLen = len;
              bestStart = beforeR >= 0 && beforeR < size && beforeC >= 0 && beforeC < size && api.get(beforeR, beforeC) === null ? { row: beforeR, col: beforeC } : null;
              bestEnd = endR >= 0 && endR < size && endC >= 0 && endC < size && api.get(endR, endC) === null ? { row: endR, col: endC } : null;
            }
          }
        }
      }
      if (bestStart) api.place(bestStart.row, bestStart.col, "white");
      if (bestEnd) api.place(bestEnd.row, bestEnd.col, "white");
    `,
  },
  {
    name: "天衣无缝",
    description: "在最需要防守的位置放置白子",
    flavor: "无懈可击，防守如铁桶",
    rarity: "rare",
    executeCode: `
      const size = api.getBoardSize();
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      let bestScore = -1;
      let bestPos = null;
      const empty = api.findEmpty();
      for (const pos of empty) {
        api.place(pos.row, pos.col, "white");
        let score = 0;
        for (let dr_idx = 0; dr_idx < dirs.length; dr_idx++) {
          const [dr, dc] = dirs[dr_idx];
          let blackCount = 0;
          for (const sign of [1,-1]) {
            let r = pos.row + sign*dr, c = pos.col + sign*dc;
            while (r >= 0 && r < size && c >= 0 && c < size && api.get(r,c) === "black") { blackCount++; r += sign*dr; c += sign*dc; }
          }
          score = Math.max(score, blackCount);
        }
        api.remove(pos.row, pos.col);
        if (score > bestScore) { bestScore = score; bestPos = pos; }
      }
      if (bestPos) api.place(bestPos.row, bestPos.col, "white");
    `,
  },
  {
    name: "四两拨千斤",
    description: "移除一颗黑子，以小博大",
    flavor: "轻描淡写间，扭转乾坤",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      let best = blacks[0];
      let bestScore = -1;
      for (const b of blacks) {
        let score = 0;
        for (const [dr, dc] of dirs) {
          let len = 1;
          for (const sign of [1,-1]) {
            let r = b.row+sign*dr, c = b.col+sign*dc;
            while (r>=0&&r<size&&c>=0&&c<size&&api.get(r,c)==="black"){len++;r+=sign*dr;c+=sign*dc;}
          }
          score = Math.max(score, len);
        }
        if (score > bestScore) { bestScore = score; best = b; }
      }
      api.remove(best.row, best.col);
    `,
  },
  {
    name: "连环计",
    description: "移除一颗黑子，再在其旁边放置白子",
    flavor: "一计套一计，环环相扣",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const target = await api.requestChoice(blacks);
      api.remove(target.row, target.col);
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dr, dc] of dirs) {
        const nr = target.row + dr, nc = target.col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && api.get(nr, nc) === null) {
          api.place(nr, nc, "white");
          break;
        }
      }
    `,
  },
  {
    name: "围魏救赵",
    description: "在黑子阵型旁边放置两颗白子",
    flavor: "围其所爱，敌必自救",
    rarity: "rare",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      let maxNeighbors = 0;
      let center = blacks[0];
      for (const b of blacks) {
        let neighbors = 0;
        for (const other of blacks) {
          if (Math.abs(other.row - b.row) <= 2 && Math.abs(other.col - b.col) <= 2) neighbors++;
        }
        if (neighbors > maxNeighbors) { maxNeighbors = neighbors; center = b; }
      }
      const offsets = [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 2], [2, 0], [-2, 0], [0, -2]];
      let placed = 0;
      for (const [dr, dc] of offsets) {
        const r = center.row + dr, c = center.col + dc;
        if (r >= 0 && r < size && c >= 0 && c < size && api.get(r, c) === null) {
          api.place(r, c, "white");
          placed++;
          if (placed >= 2) break;
        }
      }
    `,
  },
  {
    name: "声东击西",
    description: "在棋盘两侧各放置一颗白子",
    flavor: "东声西击，令敌首尾难顾",
    rarity: "rare",
    executeCode: `
      const empty = api.findEmpty();
      if (empty.length < 2) return;
      const leftEmpty = empty.filter(p => p.col < 5).sort(() => Math.random() - 0.5);
      const rightEmpty = empty.filter(p => p.col > 9).sort(() => Math.random() - 0.5);
      if (leftEmpty.length > 0) api.place(leftEmpty[0].row, leftEmpty[0].col, "white");
      if (rightEmpty.length > 0) api.place(rightEmpty[0].row, rightEmpty[0].col, "white");
    `,
  },
  {
    name: "李代桃僵",
    description: "牺牲一颗白子位置，换取移除一颗黑子",
    flavor: "以小换大，代价值得",
    rarity: "rare",
    executeCode: `
      const whites = api.findAll("white");
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      if (whites.length === 0) {
        const target = await api.requestChoice(blacks);
        api.remove(target.row, target.col);
        return;
      }
      const w = whites[Math.floor(Math.random() * whites.length)];
      const target = await api.requestChoice(blacks);
      api.remove(w.row, w.col);
      api.remove(target.row, target.col);
    `,
  },
  {
    name: "苦肉计",
    description: "移除一颗白子，换取在任意空位放两颗白子",
    flavor: "小小牺牲，换取大局",
    rarity: "rare",
    executeCode: `
      const whites = api.findAll("white");
      const empty = api.findEmpty();
      if (empty.length < 2) return;
      if (whites.length > 0) {
        const w = whites[Math.floor(Math.random() * whites.length)];
        api.remove(w.row, w.col);
      }
      const shuffled = api.findEmpty().sort(() => Math.random() - 0.5);
      if (shuffled.length >= 1) api.place(shuffled[0].row, shuffled[0].col, "white");
      if (shuffled.length >= 2) api.place(shuffled[1].row, shuffled[1].col, "white");
    `,
  },

  // ─── 史诗 (epic) ─── 多目标 / 大范围
  {
    name: "浑水摸鱼",
    description: "随机移除两颗黑子",
    flavor: "混乱之中，顺势而为",
    rarity: "epic",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const shuffled = blacks.sort(() => Math.random() - 0.5);
      const count = Math.min(2, shuffled.length);
      for (let i = 0; i < count; i++) {
        api.remove(shuffled[i].row, shuffled[i].col);
      }
    `,
  },
  {
    name: "瞒天过海",
    description: "同时在两个随机空位放置白子",
    flavor: "两处落子，让对手措手不及",
    rarity: "epic",
    executeCode: `
      const empty = api.findEmpty();
      if (empty.length < 2) return;
      const shuffled = empty.sort(() => Math.random() - 0.5);
      api.place(shuffled[0].row, shuffled[0].col, "white");
      api.place(shuffled[1].row, shuffled[1].col, "white");
    `,
  },
  {
    name: "打草惊蛇",
    description: "随机将三颗黑子各移动一格",
    flavor: "虚张声势，扰乱敌阵",
    rarity: "epic",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const shuffled = blacks.sort(() => Math.random() - 0.5).slice(0, 3);
      for (const b of shuffled) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        const shuffledDirs = dirs.sort(() => Math.random() - 0.5);
        for (const [dr, dc] of shuffledDirs) {
          const nr = b.row + dr, nc = b.col + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && api.get(nr, nc) === null) {
            api.move(b.row, b.col, nr, nc);
            break;
          }
        }
      }
    `,
  },
  {
    name: "空城计",
    description: "清空棋盘中心 3×3 区域内所有黑子",
    flavor: "虚设空城，诱敌深入",
    rarity: "epic",
    executeCode: `
      const blacks = api.findAll("black");
      for (const b of blacks) {
        if (b.row >= 6 && b.row <= 8 && b.col >= 6 && b.col <= 8) {
          api.remove(b.row, b.col);
        }
      }
    `,
  },
  {
    name: "破釜沉舟",
    description: "移除三颗最危险的黑子",
    flavor: "置之死地而后生，背水一战",
    rarity: "epic",
    executeCode: `
      const blacks = api.findAll("black");
      if (blacks.length === 0) return;
      const size = api.getBoardSize();
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      const scored = blacks.map(b => {
        let maxLen = 0;
        for (const [dr, dc] of dirs) {
          let len = 1;
          for (const sign of [1,-1]) {
            let r = b.row + sign*dr, c = b.col + sign*dc;
            while (r >= 0 && r < size && c >= 0 && c < size && api.get(r,c) === "black") { len++; r += sign*dr; c += sign*dc; }
          }
          if (len > maxLen) maxLen = len;
        }
        return { pos: b, score: maxLen };
      });
      scored.sort((a, b) => b.score - a.score);
      for (let i = 0; i < Math.min(3, scored.length); i++) {
        api.remove(scored[i].pos.row, scored[i].pos.col);
      }
    `,
  },
  {
    name: "指鹿为马",
    description: "随机将一颗黑子变为白子，再将一颗白子变为黑子",
    flavor: "颠倒黑白，混淆视听",
    rarity: "epic",
    executeCode: `
      const blacks = api.findAll("black");
      const whites = api.findAll("white");
      if (blacks.length === 0 || whites.length === 0) return;
      const b = blacks[Math.floor(Math.random() * blacks.length)];
      const w = whites[Math.floor(Math.random() * whites.length)];
      api.transform(b.row, b.col, "white");
      api.transform(w.row, w.col, "black");
    `,
  },
];
