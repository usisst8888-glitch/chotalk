/**
 * 공지방 라인업 메시지를 파싱하여 층별 담당자 목록 추출
 *
 * 1부 형태: "10. 명태 01076749210" → floor=10
 * 2부 형태: "10층 감자 010 2307 4823" → floor=10
 * 들여쓰기 라인: "      하진 01041368680" → 이전 층에 추가 인원
 */

export interface FloorAssignment {
  floor: number;
  name: string;
  phone: string;
  part: number; // 1부=1, 2부=2
}

export function parseGongjiMessage(message: string): FloorAssignment[] {
  const lines = message.split('\n');
  const assignments: FloorAssignment[] = [];
  let currentFloor: number | null = null;
  let currentPart: number = 1; // 기본값 1부

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1부/2부 감지: "1부 라인업", "2부 라인업" 등
    const partMatch = line.match(/^(\d)부\s*라인업/);
    if (partMatch) {
      currentPart = parseInt(partMatch[1]);
      currentFloor = null;
      continue;
    }

    // "라인업", "장사", "보조장", "헬퍼" 등 메타 라인 스킵
    if (/^([\d.]+\s*(월|화|수|목|금|토|일)요일|.*라인업|보조장|헬퍼)/.test(line)) {
      currentFloor = null;
      continue;
    }

    // 1부 형태: "10. 명태 01076749210" 또는 "9.  종서 01093304446"
    const match1bu = line.match(/^(\d{1,2})\.\s+(\S+)\s+(01[0-9][\s-]?\d{3,4}[\s-]?\d{4})/);
    if (match1bu) {
      currentFloor = parseInt(match1bu[1]);
      assignments.push({
        floor: currentFloor,
        name: match1bu[2],
        phone: normalizePhone(match1bu[3]),
        part: currentPart,
      });
      continue;
    }

    // 2부 형태: "10층 감자 010 2307 4823" 또는 "9층   세준 010 8019 4674"
    const match2bu = line.match(/^(\d{1,2})층\s+(\S+)\s+(01[0-9][\s-]?\d{3,4}[\s-]?\d{4})/);
    if (match2bu) {
      currentFloor = parseInt(match2bu[1]);
      assignments.push({
        floor: currentFloor,
        name: match2bu[2],
        phone: normalizePhone(match2bu[3]),
        part: currentPart,
      });
      continue;
    }

    // 들여쓰기 라인 (같은 층 추가 인원): "      하진 01041368680"
    if (currentFloor !== null) {
      const matchIndent = line.match(/^(\S+)\s+(01[0-9][\s-]?\d{3,4}[\s-]?\d{4})/);
      if (matchIndent) {
        assignments.push({
          floor: currentFloor,
          name: matchIndent[1],
          phone: normalizePhone(matchIndent[2]),
          part: currentPart,
        });
        continue;
      }
    }
  }

  return assignments;
}

/** 전화번호 정규화: 공백/하이픈 제거 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}
