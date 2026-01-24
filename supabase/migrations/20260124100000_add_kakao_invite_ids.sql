-- 카카오톡 초대 아이디 관리 테이블
CREATE TABLE kakao_invite_ids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kakao_id VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_kakao_invite_ids_kakao_id ON kakao_invite_ids(kakao_id);
CREATE INDEX idx_kakao_invite_ids_is_active ON kakao_invite_ids(is_active);
