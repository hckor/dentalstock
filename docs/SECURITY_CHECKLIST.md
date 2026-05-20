# DentalStock Security Checklist

작성일: 2026-05-20

## Critical

- [ ] 도매몰 ID/PW는 클라이언트 저장 금지
- [ ] 도매몰 비밀번호는 AES-256-GCM으로 암호화하고 KMS/Secret Manager 키와 분리
- [x] Supabase 주요 테이블은 `clinic_id`를 기준으로 RLS를 적용한다
- [x] 요청자의 Supabase profile과 row의 `clinic_id`가 항상 일치해야 한다
- [ ] `profiles.role` 변경은 owner 전용 정책으로만 허용한다
- [ ] `orders.requested_by`, `txs.actor_id`는 서버/DB 레벨에서 `auth.uid()`와 일치해야 한다
- [ ] 자동 주문은 `owner` 또는 `manager` 승인 이후에만 실행한다
- [ ] 1회 최대 주문금액 한도를 서버에서도 검증한다
- [ ] 주문 실행/송장 수집 워커 로그에 비밀번호, 카드번호, 세션 쿠키를 남기지 않는다
- [x] `SUPABASE_SERVICE_ROLE_KEY`는 프론트엔드/Vercel client 변수에 노출하지 않는다

## High

- [ ] PIN은 원문 저장 금지, PBKDF2/Argon2 해시만 저장
- [ ] Supabase Auth 공개 회원가입을 끄고 관리자 초대/생성 계정만 허용한다
- [ ] Supabase Auth 이메일 인증을 운영 전에 켠다
- [ ] 관리자 계정 2FA 준비
- [ ] 환자명은 최소 보관하고 알림/로그에는 반복 저장하지 않는다
- [x] 입출고/발주/수술 삭제는 audit log로 남긴다
- [x] 서버 audit log service는 create/list만 노출하고 update/delete 경로를 만들지 않는다
- [ ] API rate limit과 계정 잠금 정책을 서버에서도 적용한다
- [ ] 백엔드 함수는 역할 기반 권한을 재검증한다

## Medium

- [ ] 로컬 데모 저장소에는 실제 계정을 입력하지 않도록 UI 경고 유지
- [ ] 백업/복구 정책 정의
- [ ] 운영 워커 장비 FileVault 또는 디스크 암호화 적용
- [ ] Playwright 자동화 계정별 세션 격리
- [ ] 외부 배송 API 키를 환경변수/Secret Manager로 관리

## 현재 코드 상태

- 로컬 앱은 데모 단계라 도매 계정 입력값이 localStorage에 저장될 수 있다. 실제 계정 입력은 금지한다.
- 현재 UI 입력값은 `settings.vendors[]`에서 분리해 `vendorCredentials` 저장소로 격리했다.
- 로컬 repository 키는 `clinics/{clinicId}` 네임스페이스로 감싸 병원 단위 데이터 분리 구조를 미리 맞췄다.
- 입출고, 발주 요청/승인/반려/송장 등록/입고 확인, 수술 등록/준비확인/품목수정/삭제는 `auditLogs`에 기록한다.
- audit log metadata의 `username/password/token/session/pin/card` 계열 키는 저장 전에 마스킹한다.
- 서버 전환용 `auditLogService`와 메모리 repository 골격은 append-only 계약을 테스트한다.
- 자동주문 worker와 배송 provider는 `server/workers/README.md`에 queue/job 경계부터 정의했다.
- 실제 운영 전에는 `vendorCredentials`를 클라이언트 저장소에서 제거하고 server-only 암호화 저장소로 옮겨야 한다.
- Supabase Auth 로그인 모드는 붙었지만, 재고/발주/수술 데이터 동기화는 아직 로컬 저장소에 남아 있다.
- Supabase `publishable` 키는 브라우저에 사용 가능하지만, 모든 보호는 RLS 정책에 의존한다.
- Vercel에는 `VITE_DENTALSTOCK_API_MODE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`만 등록한다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 기능을 붙일 때까지 등록하지 않는다.
