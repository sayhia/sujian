/**
 * XSS 防护 composable
 * 提供安全的 HTML 渲染功能
 */

const allowedTags = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'hr',
  'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
];

const allowedAttributes = {
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan']
};

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  function sanitizeNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    if (!allowedTags.includes(tagName)) {
      let result = '';
      element.childNodes.forEach(child => {
        const sanitized = sanitizeNode(child);
        if (sanitized) {
          result += sanitized.textContent || '';
        }
      });
      return document.createTextNode(result);
    }
    
    const allowedAttrs = allowedAttributes[tagName] || [];
    const newElement = document.createElement(tagName);
    
    Array.from(element.attributes).forEach(attr => {
      if (allowedAttrs.includes(attr.name)) {
        newElement.setAttribute(attr.name, attr.value);
      }
    });
    
    element.childNodes.forEach(child => {
      const sanitized = sanitizeNode(child);
      if (sanitized) {
        newElement.appendChild(sanitized);
      }
    });
    
    return newElement;
  }
  
  const sanitizedBody = sanitizeNode(doc.body);
  if (sanitizedBody && sanitizedBody instanceof HTMLElement) {
    return sanitizedBody.innerHTML;
  }
  
  return escapeHtml(html);
}

export function useSafeHTML() {
  return {
    sanitizeHtml,
    escapeHtml,
    renderSafeHtml: (html: string) => sanitizeHtml(html)
  };
}
