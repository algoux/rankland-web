import { describe, expect, it } from 'vitest';
import { formatCurrentUrl } from './current-url';

describe('formatCurrentUrl', () => {
  it('keeps ordinary query params and strips focus-mode query params', () => {
    const result = formatCurrentUrl({
      protocol: 'https:',
      host: 'xn--fiqs8s.example',
      pathname: '/ranklist/abc',
      query: { focus: 'yes', '聚焦': '是', q: 'hello world', tag: ['a', 'b'] },
    });

    expect(result.url).toBe('/ranklist/abc?q=hello%20world&tag=a&tag=b');
    expect(result.fullUrl).toBe('https://中国.example/ranklist/abc?q=hello%20world&tag=a&tag=b');
  });

  it('normalizes non-root trailing slash before appending query params', () => {
    const result = formatCurrentUrl({
      protocol: 'https:',
      host: 'rl.algoux.cn',
      pathname: '/collection/official/',
      query: { rankId: 'test-key' },
    });

    expect(result.url).toBe('/collection/official?rankId=test-key');
    expect(result.fullUrl).toBe('https://rl.algoux.cn/collection/official?rankId=test-key');
  });
});
