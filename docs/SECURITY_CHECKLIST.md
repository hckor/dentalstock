# DentalStock Security Checklist

작성일: 2026-05-20

## Critical

- [ ] 도매몰 ID/PW는 클라이언트 저장 금지
- [ ] 도매몰 비밀번호는 AES-256-GCM으로 암호화하고 KMS/Secret Manager 키와 분리
- [ ] 모든 문서 경로는 `clinicId` 하위에 둔다
- [ ] 요청자의 `auth.token.clinicId`와 문서의 `clinicId`가 항상 일치해야 한다
- [ ] 자동 주문은 `owner` 또는 `manager` 승인 이후에만 실행한다
- [ ] 1회 최대 주문금액 한도를 서버에서도 검증한다
- [ ] 주문 실행/송장 수집 워커 로그에 비밀번호, 카드번호, 세션 쿠키를 남기지 않는다

## High

- [ ] PIN은 원문 저장 금지, PBKDF2/Argon2 해시만 저장
- [ ] 관리자 계정 2FA 준비
- [ ] 환자명은 최소 보관하고 알림/로그에는 반복 저장하지 않는다
- [x] 입출고/발주/수술 삭제는 audit log로 남긴다
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
- 실제 운영 전에는 `vendorCredentials`를 클라이언트 저장소에서 제거하고 server-only 암호화 저장소로 옮겨야 한다.
