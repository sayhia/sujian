import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';

// 配置 marked：GFM、换行、代码高亮（marked v17 通过 renderer 注入）
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }): string {
      const language = (lang ?? '').split(/\s+/)[0];
      const highlighted =
        language && hljs.getLanguage(language)
          ? hljs.highlight(text, { language }).value
          : hljs.highlightAuto(text).value;
      const cls = language ? ` class="hljs language-${language}"` : ' class="hljs"';
      return `<pre><code${cls}>${highlighted}</code></pre>`;
    },
  },
});

/** 渲染 Markdown 为安全 HTML（highlight.js 输出已转义源码） */
export function renderMarkdown(md: string): string {
  if (!md) return '';
  try {
    return marked.parse(md) as string;
  } catch {
    return md.replace(/</g, '&lt;');
  }
}

/** 提取标题用于目录（h1-h3） */
export interface TocItem {
  level: number;
  text: string;
  id: string;
}

export function extractToc(md: string): TocItem[] {
  const items: TocItem[] = [];
  if (!md) return items;
  const lines = md.split('\n');
  let index = 0;
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      const text = m[2].replace(/[#*_`]/g, '').trim();
      if (text) {
        items.push({ level: m[1].length, text, id: `toc-${index++}` });
      }
    }
  }
  return items;
}

/** 粗略统计中文字数（用于状态栏） */
export function countWords(md: string): number {
  if (!md) return 0;
  const chinese = (md.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = md.replace(/[\u4e00-\u9fff]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return chinese + latin;
}

/** 估算阅读分钟数（中文 400 字/分，西文 200 词/分） */
export function estimateReadMinutes(md: string): number {
  if (!md) return 0;
  const chinese = (md.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = md.replace(/[\u4e00-\u9fff]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(chinese / 400 + latin / 200));
}

/** 生成供目录锚点引用的 HTML（给标题附加 id） */
export function withHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(
    /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (_m, level: string, attrs: string, content: string) =>
      `<h${level}${attrs} id="toc-${counter++}">${content}</h${level}>`,
  );
}
