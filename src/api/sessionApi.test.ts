import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('../lib/apiClient', () => ({
  default: {
    get: getMock,
    post: postMock,
  },
}));

import { sessionApi } from './sessionApi';

const session = {
  sessionId: 'session-1',
  contestId: 'contest-1',
  status: 'IN_PROGRESS',
  startedAt: '2026-09-28T10:00:00Z',
  endsAt: '2026-09-28T11:00:00Z',
  submittedAt: null,
  serverTime: '2026-09-28T10:00:00Z',
  remainingSeconds: 3600,
};

describe('sessionApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it('uses GET for the existing-session lookup and preserves a 404 for the caller', async () => {
    const notFound = { response: { status: 404 } };
    getMock.mockRejectedValue(notFound);

    await expect(sessionApi.getStatus('contest-1')).rejects.toBe(notFound);
    expect(getMock).toHaveBeenCalledWith('/contests/contest-1/session');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('uses the start POST endpoint without a request body', async () => {
    const startResponse = { ...session, submittedAt: undefined, resumed: false };
    postMock.mockResolvedValue({ data: { data: startResponse } });

    await expect(sessionApi.start('contest-1')).resolves.toEqual(startResponse);
    expect(postMock).toHaveBeenCalledWith('/contests/contest-1/session/start');
  });

  it('uses the submit POST endpoint and never starts a new session', async () => {
    postMock.mockResolvedValue({ data: { data: { ...session, status: 'SUBMITTED' } } });

    await expect(sessionApi.submit('contest-1')).resolves.toMatchObject({ status: 'SUBMITTED' });
    expect(postMock).toHaveBeenCalledWith('/contests/contest-1/session/submit');
    expect(postMock).not.toHaveBeenCalledWith('/contests/contest-1/session/start');
  });
});
