# Supabase 스키마 파일

각 테이블별로 분리된 SQL 파일입니다.

## 파일 구조

```
schemas/
├── 00_functions.sql  # 공통 함수 (트리거 함수 등)
├── 01_users.sql      # users 테이블
├── 02_slots.sql      # slots 테이블
└── README.md
```

## 실행 순서

번호 순서대로 실행해야 합니다:
1. `00_functions.sql` - 공통 함수 먼저 생성
2. `01_users.sql` - users 테이블 (다른 테이블에서 참조)
3. `02_slots.sql` - slots 테이블 (users 참조)

## 전체 스키마 실행

```bash
# 모든 스키마 파일을 순서대로 실행
cat supabase/schemas/*.sql | supabase db push
```

## 새 테이블 추가 시

`03_새테이블.sql` 형식으로 파일을 추가하세요.
