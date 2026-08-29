import { describe, it, expect } from 'vitest';
import { renderMarkdown, extractToc, countWords, estimateReadMinutes, withHeadingIds } from '../useMarkdown';

describe('renderMarkdown', () => {
  it('renders headings and paragraphs', () => {
    const html = renderMarkdown('# 标题\n\n正文段落');
    expect(html).toContain('<h1');
    expect(html).toContain('标题');
    expect(html).toContain('<p>正文段落</p>');
  });

  it('renders code blocks with highlight', () => {
    const html = renderMarkdown('```js\nconst a = 1;\n```');
    expect(html).toContain('hljs');
    expect(html).toContain('language-js');
    expect(html).toContain('const');
  });

  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });
});

describe('extractToc', () => {
  it('extracts h1-h3 headings with text', () => {
    const toc = extractToc('# A\n\n## B\n\n### C\n\n#### D');
    expect(toc.map((x) => x.level)).toEqual([1, 2, 3]);
    expect(toc.map((x) => x.text)).toEqual(['A', 'B', 'C']);
    expect(toc[0].id).toMatch(/^toc-/);
  });

  it('ignores markdown syntax in heading text', () => {
    const toc = extractToc('## **加粗** 标题');
    expect(toc[0].text).toBe('加粗 标题');
  });
});

describe('countWords / estimateReadMinutes', () => {
  it('counts chinese and latin words', () => {
    expect(countWords('你好世界 hello world')).toBe(6);
    expect(countWords('')).toBe(0);
  });

  it('estimates reading minutes with a floor of 1', () => {
    expect(estimateReadMinutes('')).toBe(0);
    expect(estimateReadMinutes('短')).toBe(1);
    expect(estimateReadMinutes('一'.repeat(1000))).toBeGreaterThan(1);
  });
});

describe('withHeadingIds', () => {
  it('adds sequential ids to headings', () => {
    const html = withHeadingIds('<h1>One</h1><h2>Two</h2>');
    expect(html).toContain('id="toc-0"');
    expect(html).toContain('id="toc-1"');
  });
});
