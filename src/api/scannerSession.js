export const isScanRunning = (status) => ['pending', 'processing'].includes(status);

export function scanErrorMessage(error) {
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : error.message || '요청을 처리하지 못했습니다.';
}

export function createScannerSessionApi(client, deviceId) {
  const path = `/device/link/${encodeURIComponent(deviceId)}`;
  return {
    deviceId,
    async getLink() {
      const { data } = await client.get(path);
      return data;
    },
    async link() {
      const { data } = await client.post('/device/link', { device_id: deviceId });
      return data;
    },
    async unlink() {
      try {
        await client.delete(path);
      } catch (error) {
        if (error.response?.status !== 404) throw error;
      }
    },
    async status(options = {}) {
      try {
        const { data } = await client.get('/scans/status', options);
        return data;
      } catch (error) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    async start(part = 'FOREHEAD', options = {}) {
      try {
        const { data } = await client.post('/scans/trigger', { device_id: deviceId, part }, options);
        if (!data?.session_id) throw new Error('촬영 세션 정보를 받지 못했습니다.');
        return data;
      } catch (error) {
        if (error.response?.status === 409) {
          // 충돌 응답 형식에 의존하지 않고 로그인 사용자의 진행 세션을 조회한다.
          const current = await this.status(options);
          if (current?.device_id === deviceId && isScanRunning(current.status)) return current;
          throw new Error('기기가 이미 사용 중입니다. 기존 촬영이 끝난 뒤 다시 시도해 주세요.');
        }
        if (error.response?.status === 502) throw new Error('기기 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        throw error;
      }
    },
    async wait(sessionId, { signal, timeoutMs = 120000, intervalMs = 2000 } = {}) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        signal?.throwIfAborted();
        const current = await this.status({ signal });
        if (current?.session_id === sessionId) {
          if (current.status === 'failed') throw new Error('촬영 또는 저장에 실패했습니다. 기기 상태를 확인해 주세요.');
          if (current.status === 'done') {
            const { data } = await client.get(`/result/${encodeURIComponent(sessionId)}`, { signal });
            return { ...data, session_id: sessionId };
          }
        } else if (current?.session_id) {
          throw new Error('다른 촬영 세션이 감지됐습니다. 촬영 기록을 확인해 주세요.');
        }
        await new Promise((resolve, reject) => {
          const abort = () => { clearTimeout(timer); reject(signal.reason); };
          const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, intervalMs);
          signal?.addEventListener('abort', abort, { once: true });
        });
      }
      throw new Error('촬영 완료를 아직 확인하지 못했습니다. 기기와 촬영 기록을 확인한 뒤 다시 시도해 주세요.');
    },
  };
}
