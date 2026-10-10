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
npm run check:i18n       # locale đủ/đúng key và placeholder so với vi; key dùng trong code phải tồn tại
npm run check:literals   # chuỗi tiếng Việt viết cứng trong src/ (allowlist + bộ đếm todo); thêm -- --report để xem tiến độ
node scripts/rng-diff.mjs  # so chuỗi lời gọi RNG theo khai báo giữa HEAD và cây làm việc
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
src/i18n/      t(), setLang, registry locale (src/i18n/locales/*.js)
src/data/      hằng số & dữ liệu (rules, names, looks, offers)
src/state.js   state toàn cục S (live binding) + setState
src/systems/   logic game theo từng mảng (artists, managers, week, market, events, releases, awards, ext2, ext3 …)
src/save/      storage (localStorage + migration), transfer (xuất/nhập mã SL1 & file .json)
src/ui/        render & view (building, views, rooms, planning, tutorial, saveView, globals)
src/styles/    CSS tách theo khu vực
```

Handler inline trong HTML sinh động được nối vào `window` ở một nơi duy nhất: `src/ui/globals.js`.
Biến `let` dùng chung giữa module có setter (`setState`, `setCurView`, …).

## Đa ngôn ngữ

Mặc định tiếng Việt (`vi`, nguồn chuẩn); có thêm tiếng Anh (`en`, beta). Người chơi đổi bằng nút 🌐 trên thanh trên
cùng, game render lại tại chỗ. Lựa chọn lưu ở `localStorage['starlight_lang']`, tách khỏi save và mã `SL1.`.
Giai đoạn 1 mới dịch giao diện cố định (thanh trên cùng, tên phòng, dock, nút chung, tutorial).

**Thêm ngôn ngữ:** chép `src/i18n/locales/en.js` thành `xx.js`, sửa `meta` (`code`, `name`, `htmlLang`), dịch `dict`, rồi
chạy `npm run check:i18n`. Registry tự nhận file mới.

**Key:** phẳng, có dấu chấm, `vi.js` là chuẩn: `top.*`, `room.<id>.{name,dock,desc}`, `npc.<id>`, `btn.*`,
`tut.<id>.{t,d}`, `lang.*`, `saved.*`, `fmt.units`. Giá trị là chuỗi có `{x}` hoặc hàm `(p) => string` (số nhiều).

**Quy tắc:**
- Không gọi `t()` ở top-level module (ngôn ngữ chưa khởi tạo); tra lúc render.
- Từ điển là HTML tin cậy: tham số truyền vào `t()` phải `esc()` nếu là dữ liệu người dùng.
- Không đưa chuỗi đã dịch vào `S` (`addLog`, `title`…); `fmt()` giữ đơn vị tiếng Việt cho log, chỉ dùng `money()` để hiển thị.
- `src/i18n/` là module lá: không import system/UI, không chạm DOM, không gọi RNG.
- Khung tĩnh trong `index.html` dùng `data-i18n` / `data-i18n-aria`.

## Lưu game

Tự lưu vào `localStorage` (khoá `starlight_idol_save_v1`). Nút 🔑 trên thanh trên cùng: xuất mã `SL1.…`
hoặc file `.json`, và nhập lại ở trình duyệt khác.

## Deploy

Không dùng GitHub Actions. Chạy `npm run deploy`: build với base `/vibe_code_game/` rồi đẩy `dist/` lên nhánh `gh-pages`.
Việc thủ công một lần: Settings → Pages → Source = **Deploy from a branch** → nhánh `gh-pages`, thư mục `/ (root)`.
Test chạy tay trước khi deploy: `npm test && npm run check:handlers && npm run check:i18n && npm run test:e2e`.

## Subagent cho Claude Code

Định nghĩa trong `.claude/agents/`. Luồng làm việc khuyên dùng:

1. `planner`: khảo sát và ghi kế hoạch vào `docs/plans/` (không viết code)
2. `gameplay-dev`: làm theo plan, mỗi task có test và một commit
3. `golden-guardian`: chạy unit, check:handlers và e2e, chẩn đoán khi golden lệch (chỉ báo cáo)
4. `code-reviewer`: review diff so với `main` trước khi merge hoặc deploy (chỉ đọc)
5. `balance-analyst`: mô phỏng nhiều seed để phân tích cân bằng game (chỉ đọc)
