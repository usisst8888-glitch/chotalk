/**
 * 아가씨 닉네임 규칙
 *
 * 한글 완성형 2글자만 허용한다. 숫자·영문·공백·자모(ㄱ,ㅏ)·1글자·3글자 모두 거부.
 *
 * 왜 이렇게 엄격한가:
 * 파서가 메시지에서 이름을 부분 문자열로 찾는다(`message.includes(name)`).
 * 이름이 숫자면 방번호에 걸린다 — 실제로 girl_name이 "1","2","3"이던 슬롯이
 * "803 이승기 도아" 같은 메시지의 방번호에 매칭되어 6시간 만에 상황판에
 * 유령 세션 441건을 만들었다(2026-11-09). 이름 형식을 고정하는 것이
 * 그 오매칭을 원천 차단하는 가장 확실한 방법이다.
 */
export const GIRL_NAME_PATTERN = /^[가-힣]{2}$/;

export const GIRL_NAME_RULE_MESSAGE =
  '아가씨 닉네임은 한글 2글자로만 입력해주세요. (숫자·영문·공백 불가)';

/** 규칙에 맞으면 true */
export function isValidGirlName(name: unknown): name is string {
  return typeof name === 'string' && GIRL_NAME_PATTERN.test(name);
}

/**
 * 규칙 위반이면 안내 문구를, 통과하면 null을 돌려준다.
 * API 라우트에서 `const err = validateGirlName(x); if (err) return 400(err);` 형태로 쓴다.
 */
export function validateGirlName(name: unknown): string | null {
  return isValidGirlName(name) ? null : GIRL_NAME_RULE_MESSAGE;
}

/**
 * 입력값에서 규칙에 맞지 않는 문자를 즉시 걷어낸다.
 * 완성형 한글만 남기고 2글자로 자른다 — 입력란에 숫자를 아예 못 치게 하는 용도.
 */
export function sanitizeGirlName(input: string): string {
  return input.replace(/[^가-힣]/g, '').slice(0, 2);
}
