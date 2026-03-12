// 허용되는 방 종류 → 테이블 매핑
export const ROOM_TYPE_TABLE: Record<string, string> = {
  '아톡': 'aktalk_atok',
  '공지방': 'aktalk_gongji',
  '초톡': 'aktalk_chotok',
};

export const VALID_ROOM_TYPES = Object.keys(ROOM_TYPE_TABLE);
