import { getMeta, t } from '../i18n/index.js';

// Chữ cho khung tĩnh trong index.html: data-i18n (textContent) và data-i18n-aria (aria-label)
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', t(e.dataset.i18nAria)));
}
export const applyHtmlLang = () => { document.documentElement.lang = getMeta().htmlLang; };
