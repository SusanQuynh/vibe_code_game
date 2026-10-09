# Starlight Ent.

Game quản lý công ty giải trí (web game, Vite + JS thuần, không framework).
Chơi tại: https://susanquynh.github.io/vibe_code_game/

Nguồn gốc: artifact Claude “Starlight Ent.” (1 file HTML) được chuyển thành dự án module hoá,
**gameplay và giao diện giữ nguyên**. Kế hoạch: `docs/plans/2026-10-09-starlight-web-game.md`.

## Chạy

```bash
npm i
npm run dev      # http://localhost:5173
npm run build    # ra thư mục dist/
```

## Test

```bash
npm test                 # unit (Vitest + jsdom)
npm run check:handlers   # mọi handler inline (onclick="…") phải có trên window
npm run test:e2e         # Playwright: golden master + smoke
```

Trong môi trường đã có sẵn Chromium: `PW_CHROMIUM=/đường/dẫn/chrome npm run test:e2e`
(đừng chạy `playwright install`). Chạy e2e với bản build: `BASE_URL=http://localhost:4173/vibe_code_game/ npx playwright test`.

### Golden master

`tests/golden/*.json` là snapshot state sau khi mô phỏng 30 / 110 tuần với RNG có seed, **được ghi từ bản
artifact gốc** (`legacy/starlight-original.html`, không bao giờ sửa file này). Test chứng minh refactor không đổi
hành vi. Chỉ cập nhật khi **cố ý** đổi gameplay:

```bash
UPDATE_GOLDEN=1 npx playwright test golden
```

## Cấu trúc

```
src/core/      rng, util (hàm thuần)
src/data/      hằng số & dữ liệu (rules, names, looks, offers)
src/state.js   state toàn cục S (live binding) + setState
src/systems/   logic game theo từng mảng (artists, managers, week, market, events, releases, awards, ext2, ext3 …)
src/save/      storage (localStorage + migration), transfer (xuất/nhập mã SL1 & file .json)
src/ui/        render & view (building, views, rooms, planning, tutorial, saveView, globals)
src/styles/    CSS tách theo khu vực
```

Handler inline trong HTML sinh động được nối vào `window` ở một nơi duy nhất: `src/ui/globals.js`.
Biến `let` dùng chung giữa module có setter (`setState`, `setCurView`, …).

## Lưu game

Tự lưu vào `localStorage` (khoá `starlight_idol_save_v1`). Nút 🔑 trên thanh trên cùng: xuất mã `SL1.…`
hoặc file `.json`, và nhập lại ở trình duyệt khác.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) chạy test rồi deploy lên GitHub Pages khi push vào `main`.
Việc thủ công một lần: Settings → Pages → Source = **GitHub Actions**.
