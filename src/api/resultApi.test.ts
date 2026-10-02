import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({ getMock: vi.fn(), postMock: vi.fn() }));
vi.mock('../lib/apiClient', () => ({ default: { get: getMock, post: postMock } }));

import { resultApi } from './resultApi';

const wrap = <T,>(data: T) => ({ data: { success: true, data, message: 'ok', timestamp: '', traceId: null } });

describe('resultApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it('unwraps the leaderboard and the candidate view', async () => {
    getMock.mockResolvedValueOnce(wrap({ contestId: 'c1', entries: [] }));
    await expect(resultApi.leaderboard('c1')).resolves.toEqual({ contestId: 'c1', entries: [] });
    expect(getMock).toHaveBeenCalledWith('/contests/c1/results');

    getMock.mockResolvedValueOnce(wrap({ contestId: 'c1', contestTitle: 'T', published: false }));
    await expect(resultApi.mine('c1')).resolves.toMatchObject({ published: false });
    expect(getMock).toHaveBeenLastCalledWith('/contests/c1/results/me');
  });

  it('evaluate is wrapped, unlike the other /submissions calls', async () => {
    postMock.mockResolvedValueOnce(wrap({ resultId: 'r1', totalScore: 70 }));

    const result = await resultApi.evaluate('s1', { adjustedScore: 20, comments: 'why' });

    expect(result).toEqual({ resultId: 'r1', totalScore: 70 });
    expect(postMock).toHaveBeenCalledWith('/submissions/s1/evaluate', { adjustedScore: 20, comments: 'why' });
  });

  it('sends the acknowledgement and the unpublish reason', async () => {
    postMock.mockResolvedValue(wrap({ contestId: 'c1' }));

    await resultApi.publish('c1', true);
    expect(postMock).toHaveBeenCalledWith('/contests/c1/results/publish', { acknowledgeFlagged: true });

    await resultApi.unpublish('c1', 'wrong test case');
    expect(postMock).toHaveBeenLastCalledWith('/contests/c1/results/unpublish', { reason: 'wrong test case' });
  });
});
