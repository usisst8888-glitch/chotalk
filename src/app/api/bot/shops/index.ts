// 가게별 모듈 라우터
// DB의 shop_name(한글) → 영문 폴더 매핑

import * as dopamine from './dopamine';
import * as unm from './unm';
import * as dalto from './dalto';
import * as perfect from './perfect';
import * as elite from './elite';
import * as aura from './aura';
import * as signet from './signet';

export type ShopModule = typeof dopamine;

const shopMap: Record<string, ShopModule> = {
  '도파민': dopamine,
  '유앤미': unm,
  '달토': dalto,
  '퍼펙트': perfect,
  '엘리트': elite,
  '아우라': aura,
  '시그넷': signet,
};

export function getShop(shopName: string): ShopModule {
  return shopMap[shopName] || shopMap['도파민'];
}

/**
 * 게시판 메시지의 지명 섹션 표시. 도파민 등은 "ㅈ.ㅁ", 시그넷은 "지.명"으로 쓴다.
 * 이 표시가 있으면 지명 처리를 하고, 그 줄 아래는 출근/종료 처리에서 뺀다.
 */
export function getDesignatedMarker(shopName: string): string {
  return shopName === '시그넷' ? '지.명' : 'ㅈ.ㅁ';
}
