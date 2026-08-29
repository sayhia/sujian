import type { Directive } from 'vue';

/**
 * v-tip="'提示文本'"  v-tip:bottom="'提示'"  自定义 Tooltip 指令。
 * 毛玻璃 + 箭头 + 延迟出现，替代原生 title；无障碍保留 aria-label。
 */

type TipPos = 'top' | 'bottom' | 'left' | 'right';

let tipEl: HTMLDivElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let boundEl: HTMLElement | null = null;

function ensureTip() {
  if (tipEl) return tipEl;
  tipEl = document.createElement('div');
  tipEl.className = 'sujian-tip';
  tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(tipEl);
  return tipEl;
}

function hideTip() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (tipEl) tipEl.style.opacity = '0';
  }, 80);
}

function positionTip(el: HTMLElement, pos: TipPos, text: string) {
  const tip = ensureTip();
  tip.textContent = text;
  tip.className = `sujian-tip pos-${pos}`;
  tip.style.opacity = '1';
  tip.style.visibility = 'visible';

  const elRect = el.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const gap = 8;
  let left = 0;
  let top = 0;

  switch (pos) {
    case 'top':
      left = elRect.left + elRect.width / 2 - tipRect.width / 2;
      top = elRect.top - tipRect.height - gap;
      break;
    case 'bottom':
      left = elRect.left + elRect.width / 2 - tipRect.width / 2;
      top = elRect.bottom + gap;
      break;
    case 'left':
      left = elRect.left - tipRect.width - gap;
      top = elRect.top + elRect.height / 2 - tipRect.height / 2;
      break;
    case 'right':
      left = elRect.right + gap;
      top = elRect.top + elRect.height / 2 - tipRect.height / 2;
      break;
  }

  // 视口边界翻转/夹紧
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left < 8) left = 8;
  if (left + tipRect.width > vw - 8) left = vw - tipRect.width - 8;
  if (top < 8) top = 8;
  if (top + tipRect.height > vh - 8) top = vh - tipRect.height - 8;

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

function showTip(el: HTMLElement) {
  const text = el.dataset.tip;
  if (!text) return;
  if (showTimer) clearTimeout(showTimer);
  showTimer = setTimeout(() => {
    positionTip(el, (el.dataset.tipPos as TipPos) || 'top', text);
  }, 380);
}

function onEnter(this: HTMLElement) {
  boundEl = this;
  hideTip();
  showTip(this);
}
function onLeave() {
  if (showTimer) clearTimeout(showTimer);
  hideTip();
}

export const tip: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    el.dataset.tip = binding.value;
    el.dataset.tipPos = binding.arg || 'top';
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('focus', onEnter);
    el.addEventListener('blur', onLeave);
  },
  updated(el, binding) {
    el.dataset.tip = binding.value;
  },
  unmounted(el) {
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
    el.removeEventListener('focus', onEnter);
    el.removeEventListener('blur', onLeave);
    if (boundEl === el) {
      boundEl = null;
      hideTip();
    }
  },
};
