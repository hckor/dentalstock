import { appRepository } from "../repositories/appRepository";

// 첫 실행 또는 버전 변경 시 초기 데이터를 채워 넣음
export function seedIfEmpty() {
  appRepository.seedIfEmpty();
}

// 데모/개발용: 모든 데이터를 초기화 후 초기 데이터로 되돌림
export function resetToInitial() {
  appRepository.resetToInitial();
}
