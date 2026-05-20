# DentalStock Backend Data Schema

작성일: 2026-05-20

## 목표

현재 PWA의 `localStorage` 데이터를 Firebase/백엔드로 옮길 때 유지할 도메인 계약을 정의한다. 핵심 원칙은 세 가지다.

- 모든 업무 데이터는 `clinicId` 아래에 격리한다.
- 도매몰 비밀번호와 세션성 데이터는 클라이언트 문서에 저장하지 않는다.
- 자동 주문은 항상 승인 이벤트 이후에만 실행한다.

## Collection 구조

```txt
clinics/{clinicId}
  users/{userId}
  items/{itemId}
  txs/{txId}
  orders/{orderId}
  surgeries/{surgeryId}
  notifs/{notifId}
  settings/app
  vendorCredentials/{vendorId}        server-only
  auditLogs/{auditId}                 append-only
```

## 공통 필드

모든 clinic 하위 문서는 다음 메타 필드를 갖는다.

| 필드 | 설명 |
|---|---|
| `clinicId` | 상위 clinic id와 동일해야 한다 |
| `createdAt` | 서버 타임스탬프 |
| `updatedAt` | 서버 타임스탬프 |
| `createdBy` | 사용자 id |
| `updatedBy` | 사용자 id |

## 주요 문서

### `users/{userId}`

```js
{
  clinicId,
  name,
  role: "owner" | "manager" | "hygienist",
  pinHash,
  active,
}
```

보안:
- PIN 원문 저장 금지.
- `owner`, `manager`만 사용자 활성/비활성 변경 가능.
- 본인 프로필 읽기는 허용하되 다른 사용자 목록은 병원 내부 사용자에게만 허용.

### `items/{itemId}`

```js
{
  clinicId,
  name,
  categoryId,
  unit,
  currentQty,
  minQty,
  location,
  expiry,
  autoOrderEnabled,
  preferredVendorId,
}
```

보안:
- 읽기: clinic 소속 사용자.
- 쓰기: `owner`, `manager`.
- 입출고로 인한 수량 변경은 `txs` 생성과 같은 트랜잭션에서 처리한다.

### `txs/{txId}`

```js
{
  clinicId,
  itemId,
  type: "in" | "out" | "adjust",
  qty,
  note,
  userId,
  userNameSnapshot,
  createdAt,
}
```

보안:
- append-only를 기본으로 한다.
- 정정은 기존 로그 삭제가 아니라 `adjust` 이벤트를 추가한다.

### `orders/{orderId}`

```js
{
  clinicId,
  itemId,
  qty,
  note,
  requestedBy,
  requestedAt,
  status: "pending" | "ordered" | "received" | "rejected" | "failed",
  reviewedBy,
  reviewedAt,
  reviewNote,
  vendorId,
  vendorOrderNo,
  carrier,
  trackingNumber,
  shippingEvents: [
    { status, timestamp, location, completed }
  ],
  receivedAt,
}
```

보안:
- 위생사는 본인이 요청한 주문 또는 clinic 정책상 공개된 주문만 읽는다.
- `approve/reject/startTracking/confirmReceipt`는 `owner`, `manager`만 가능.
- 자동 주문 워커는 `status === "ordered"`이며 승인자가 있는 주문만 실행한다.

### `surgeries/{surgeryId}`

```js
{
  clinicId,
  title,
  patientDisplayName,
  patientRef,
  type,
  scheduledDate,
  scheduledTime,
  note,
  requiredItems: [{ itemId, qty }],
  prepConfirmed,
  preparedBy,
  preparedAt,
}
```

보안:
- 환자명은 개인정보다. 외부 연동 전까지는 표시명만 저장하고, EMR 연동 시 `patientRef`로 전환한다.
- 로그/알림에는 환자명을 불필요하게 반복 저장하지 않는다.

### `settings/app`

```js
{
  clinicId,
  vendors: [
    { id, name, connected, automaticOrdering }
  ],
  preferredVendor,
  maxOrderAmount,
}
```

보안:
- 도매몰 `username/password`는 이 문서에 저장하지 않는다.
- 클라이언트가 읽어도 되는 설정만 둔다.

### `vendorCredentials/{vendorId}` server-only

```js
{
  clinicId,
  vendorId,
  usernameCiphertext,
  passwordCiphertext,
  nonce,
  tag,
  keyVersion,
  updatedBy,
  updatedAt,
}
```

보안:
- 클라이언트 직접 읽기 금지.
- Cloud Function 또는 별도 백엔드만 접근.
- AES-256-GCM + KMS/Secret Manager 키 버전으로 암호화한다.
- 로그에 username/password 원문 금지.

## Firestore Rules 초안

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function sameClinic(clinicId) {
      return signedIn() && request.auth.token.clinicId == clinicId;
    }

    function role() {
      return request.auth.token.role;
    }

    function canManage() {
      return role() in ['owner', 'manager'];
    }

    match /clinics/{clinicId}/{document=**} {
      allow read: if sameClinic(clinicId);
      allow write: if false;
    }

    match /clinics/{clinicId}/items/{itemId} {
      allow read: if sameClinic(clinicId);
      allow create, update: if sameClinic(clinicId) && canManage();
      allow delete: if false;
    }

    match /clinics/{clinicId}/txs/{txId} {
      allow read: if sameClinic(clinicId);
      allow create: if sameClinic(clinicId);
      allow update, delete: if false;
    }

    match /clinics/{clinicId}/orders/{orderId} {
      allow read: if sameClinic(clinicId);
      allow create: if sameClinic(clinicId);
      allow update: if sameClinic(clinicId) && canManage();
      allow delete: if false;
    }

    match /clinics/{clinicId}/surgeries/{surgeryId} {
      allow read: if sameClinic(clinicId);
      allow create, update: if sameClinic(clinicId) && canManage();
      allow delete: if sameClinic(clinicId) && canManage();
    }

    match /clinics/{clinicId}/settings/{docId} {
      allow read: if sameClinic(clinicId);
      allow write: if sameClinic(clinicId) && canManage();
    }

    match /clinics/{clinicId}/vendorCredentials/{vendorId} {
      allow read, write: if false;
    }

    match /clinics/{clinicId}/auditLogs/{auditId} {
      allow read: if sameClinic(clinicId) && canManage();
      allow create, update, delete: if false;
    }
  }
}
```

## 다음 구현 단위

1. `clinicId`를 local repository key namespace에 추가한다.
2. `settings/app`과 `vendorCredentials`를 UI/저장소 레벨에서 분리했다. 다음 단계는 `vendorCredentials`를 서버 전용 API로 이동하는 것이다.
3. 도매 계정 저장 액션은 클라이언트 저장 대신 `saveVendorCredential()` 서버 함수로 대체한다.
4. `orders` 상태 변경과 입출고/수술 변경을 audit log 이벤트로 남겼다. 다음 단계는 서버에서 append-only 규칙을 강제하는 것이다.
