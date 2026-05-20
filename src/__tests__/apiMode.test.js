import { describe, it, expect } from 'vitest';
import { getApiConfig } from '../config/apiMode';
import { getRepositoryAdapter } from '../repositories/repositoryAdapter';

describe('api mode adapter', () => {
  it('기본값은 로컬 저장소 모드다', () => {
    const config = getApiConfig({});
    const adapter = getRepositoryAdapter(config);

    expect(config.mode).toBe('local');
    expect(config.isServerMode).toBe(false);
    expect(adapter.activeStorage).toBe('local');
  });

  it('server mode 플래그를 읽되 현재 활성 저장소는 local로 유지한다', () => {
    const config = getApiConfig({
      VITE_DENTALSTOCK_API_MODE: 'server',
      VITE_DENTALSTOCK_API_BASE_URL: 'http://127.0.0.1:8787',
    });
    const adapter = getRepositoryAdapter(config);

    expect(config.mode).toBe('server');
    expect(config.isServerMode).toBe(true);
    expect(adapter.isRemoteEnabled).toBe(true);
    expect(adapter.baseUrl).toBe('http://127.0.0.1:8787');
    expect(adapter.activeStorage).toBe('local');
  });
});
