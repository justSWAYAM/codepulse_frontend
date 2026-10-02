import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock('../lib/apiClient', () => ({ default: { get: getMock } }));

import { analyticsApi } from './analyticsApi';

const wrap = <T,>(data: T) => ({ data: { success: true, data, message: 'ok', timestamp: '', traceId: null } });

describe('analyticsApi', () => {
  beforeEach(() => getMock.mockReset());

  it('unwraps all three endpoints', async () => {
    getMock.mockResolvedValueOnce(wrap({ contestId: 'c1' }));
    await expect(analyticsApi.overview('c1')).resolves.toEqual({ contestId: 'c1' });
    expect(getMock).toHaveBeenLastCalledWith('/contests/c1/analytics/overview');

    getMock.mockResolvedValueOnce(wrap({ questions: [] }));
    await expect(analyticsApi.questions('c1')).resolves.toEqual({ questions: [] });
    expect(getMock).toHaveBeenLastCalledWith('/contests/c1/analytics/questions');

    getMock.mockResolvedValueOnce(wrap({ testCases: [] }));
    await expect(analyticsApi.testCases('c1', 'q1')).resolves.toEqual({ testCases: [] });
    expect(getMock).toHaveBeenLastCalledWith('/contests/c1/analytics/questions/q1/test-cases');
  });
});
