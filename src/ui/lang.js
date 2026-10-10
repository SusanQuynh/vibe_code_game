import { esc } from '../core/util.js';
import { getLang, getMeta, langs, setLang, t } from '../i18n/index.js';
import { $ } from '../core/util.js';
import { render } from './building.js';
import { curView, modal } from './modal.js';
import { tutI, tutShow } from './tutorial.js';

// Chữ cho khung tĩnh trong index.html: data-i18n (textContent) và data-i18n-aria (aria-label)
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', t(e.dataset.i18nAria)));
}
export const applyHtmlLang = () => { document.documentElement.lang = getMeta().htmlLang; };

export function viewLang() {
  modal(`<h2>🌐 ${t('lang.title')}</h2>` + langs().map(m => `<button class="btn ${m.code === getLang() ? 'pri' : ''}" onclick="chooseLang('${esc(m.code)}')">${esc(m.name)}</button>`).join(' '));
}
// Đổi ngôn ngữ tại chỗ: không chạm S, không act()/save(). Lưu ý: render() có thể gọi R() cho chibi chưa có pos,
// vô hại ngoài golden vì gameplay thật không seed.
export function chooseLang(c) {
  if (!setLang(c)) return;
  applyHtmlLang(); applyStatic(); render();
  if (curView && $('#sheet').classList.contains('on')) curView();
  if (tutI >= 0) tutShow();
}
