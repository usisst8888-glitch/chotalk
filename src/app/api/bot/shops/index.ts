// 가게별 모듈 라우터
// DB의 shop_name(한글) → 영문 폴더 매핑

import * as dopamine from './dopamine';
import * as unm from './unm';
import * as dalto from './dalto';
import * as perfect from './perfect';
import * as elite from './elite';

export type ShopModule = typeof dopamine;

const shopMap: Record<string, ShopModule> = {
  '도파민': dopamine,
  '유앤미': unm,
  '달토': dalto,
  '퍼펙트': perfect,
  '엘리트': elite,
};

export function getShop(shopName: string): ShopModule {
  return shopMap[shopName] || shopMap['도파민'];
}
