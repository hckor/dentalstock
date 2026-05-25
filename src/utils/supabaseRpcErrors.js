export function getSupabaseRpcErrorCode(error) {
  return error?.code || error?.cause?.code || null;
}

export function mapSupabaseRpcErrorMessage(error, messagesByCode, fallbackMessage) {
  const code = getSupabaseRpcErrorCode(error);
  return messagesByCode[code] || fallbackMessage;
}

export function getDeleteStaffErrorMessage(error) {
  return mapSupabaseRpcErrorMessage(
    error,
    {
      23514: "마지막 원장은 목록에서 제거할 수 없습니다",
      42501: "권한이 없거나 본인 계정은 삭제할 수 없습니다",
      P0002: "삭제할 직원을 찾을 수 없습니다",
    },
    "직원을 목록에서 제거하지 못했습니다",
  );
}
