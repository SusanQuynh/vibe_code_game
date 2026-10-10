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
npm run check:literals   # chuỗi tiếng Việt viết cứng trong src/ (chế độ chặt: allowlist, sink, bánh cóc); thêm -- --report để xem phân loại
node scripts/rng-diff.mjs  # so chuỗi lời gọi RNG theo khai báo giữa HEAD và cây làm việc (REV mặc định HEAD)
npm run test:e2e         # Playwright: golden master + smoke
```

#### check:literals

Quét AST `src/**/*.js` (literal, template, regex) và `content:` trong `src/styles/*.css`; mỗi literal tiếng Việt (kể cả không dấu: `TTS`, `QL`, `80 tr`, nhãn tuần `N<năm>·T<tuần>`) phải
được phân loại, nếu không thì lỗi (**chế độ chặt**: `scripts/i18n-literals.json` không còn khoá `todo`). Chữ hiển thị cho người chơi phải đi qua từ điển; chữ nào thật sự đi vào `S`/log thì
được phân loại, không dịch (giai đoạn 3 mới chuyển sang key).
- Tự nhận: `log` (trong `addLog`/`pushEv` hoặc biến cục bộ chảy vào chúng), `name` (`data/names.js`). `toast` và `css` luôn phải dịch.
- `allow` (theo khai báo) là `{kind: state|name|event|log, why}`; **không** miễn toast, CSS hay literal so sánh. Wildcard `#*` chỉ cho `src/data/names.js`.
- `allowText` (theo khai báo + chữ): `kind: cmp` chỉ miễn literal đang dùng để so sánh logic; `state|name|event|log` phải có `n` (số lần được miễn).
- `sinks` (literal đi vào `S`/log qua tham số hàm, thuộc tính object hoặc bảng dữ liệu mà log đọc; ctx `sink` trong `--report`): `call` (`fn` + `arg`, ví dụ `removeArtist#1`, `hist.unshift#0`),
  `prop` (`key` trong các khai báo `in`, ví dụ `busy.title`) và `data` (cả bảng/hàm trong `in`). Mỗi sink có `why`, phải bắt được literal thật (nếu không bị báo xoá) và hàm đích phải tồn tại.
  Sink không tính vào `allowCount` nhưng tổng theo từng sink khoá bằng `sinkCount`.
- **Khi nào được thêm allow/sink:** chỉ khi chuỗi thật sự được ghi vào `S`/log (hoặc là nội dung sự kiện, tên riêng) và có lý do rõ trong `why`. Chuỗi chỉ để hiển thị thì dịch, không bao giờ phân loại để lách.
- Bánh cóc: `allowCount` (theo kind) và `sinkCount` (theo sink) tăng là lỗi, giảm mà chưa `--update` cũng là lỗi. Muốn tăng phải `I18N_LITERALS_FORCE=1 npm run check:literals -- --update --force` và nêu lý do trong commit.
- Khi review: `node scripts/rng-diff.mjs <base>` (ví dụ `origin/main`) để thấy lời gọi RNG đổi so với nhánh gốc; không đối số thì so với HEAD nên ngay sau commit luôn xanh.

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
Giai đoạn 1 dịch giao diện cố định; giai đoạn 2 dịch toàn bộ chữ hiển thị của các phòng, hồ sơ, báo cáo, bài hát, chiến dịch…
Chưa dịch (giai đoạn 3): nội dung sự kiện (tiêu đề/mô tả/lựa chọn/kết quả), dòng log, lịch sử nghệ sĩ và mọi chuỗi đã nằm trong `S`.

**Thêm ngôn ngữ:** chép `src/i18n/locales/en.js` thành `xx.js`, sửa `meta` (`code`, `name`, `htmlLang`), dịch `dict`, rồi
chạy `npm run check:i18n`. Registry tự nhận file mới.

**Key:** phẳng, có dấu chấm, tối đa 4 cấp, camelCase, `vi.js` là chuẩn. Namespace theo phòng/màn hình: `<roomId>.*` (`mgr`, `invest`, `market`, `ceo`, `meet`, `studio`, `acting`, `pr`, `lobby`, `dorm`, `roof`, `sales`, `hr`…),
`artist.*`, `report.*`, `evframe.*`, `award.*`, `plan.*`, `save.*`, `song.*`, `camp.*`, `props.*`, `debut.*`, `batch.*`, `comp.*`, `dq.*`, `pa.*`, `hs.*`, `renew.*`; toast nằm trong namespace chủ (`studio.toast.noMoney`);
từ vựng chung `common.*`, `unit.*`, `list.*`. Một câu = một key; HTML cấu trúc (div, button, `on*=`) ở lại template, HTML bao cụm từ nằm trong giá trị. Giá trị là chuỗi có `{x}` hoặc hàm `(p) => string` (số nhiều, cùng kiểu ở mọi ngôn ngữ).
- **Nhãn dữ liệu:** bảng trong `src/data/*` giữ field `n` chỉ cho log/`S`; UI tra `lbl(ns, id)` (`stat`, `genre`, `concept`, `offer`, `msk`, `biz`, `fin.i`, `fin.x`, `prp`, `pre`, `post`…). `check:i18n` không thấy được key động nên mỗi tiền tố có test duyệt bảng nguồn.
- **Cặp hàm tách đôi:** hàm vừa phục vụ UI vừa ghi log/`S` giữ bản cũ (literal tiếng Việt, caller ghi vào `S`) và có bản hậu tố `T` cho UI (`targetNameT`, `batchNameT`, `wkLabelT`, `debutRecT`…); ở `vi` hai bản cho cùng kết quả.
- **Giá trị lưu trong `S` mà UI hiển thị:** tra qua `sv(giá trị)` (key `sv.<giá trị>`); so sánh logic luôn dùng giá trị thô, không dùng giá trị đã dịch. `sv` chỉ dùng trong `innerHTML`.
- **Tiền:** `money()` để hiển thị (đơn vị theo ngôn ngữ), `fmt()` chỉ cho `addLog`.

**Quy tắc:**
- Không gọi `t()` ở top-level module (ngôn ngữ chưa khởi tạo); tra lúc render.
- Từ điển là HTML tin cậy: tham số truyền vào `t()` phải `esc()` nếu là dữ liệu người dùng.
- Không đưa chuỗi đã dịch vào `S` (`addLog`, `title`…). `lang-invariant` chạy cùng kịch bản ở `vi` và `en` và đòi `S`, số lần gọi RNG và dấu vết log y hệt; `ui-en-leak` render từng bề mặt ở `en` và bắt chữ Việt còn sót.
- `src/i18n/` là module lá: không import system/UI, không chạm DOM, không gọi RNG; `core/*` và `data/*` không gọi `t()`.
- Khung tĩnh trong `index.html` dùng `data-i18n` / `data-i18n-aria`.
- `check:i18n` cảnh báo (không đỏ) key `vi` không được tham chiếu tĩnh và không thuộc tiền tố động.

**Bảng thuật ngữ (vi → en):** Thực tập sinh (TTS) = Trainee · Quản lý (QL) = Manager · Giám đốc = CEO · Thư ký = Secretary · GĐ Âm nhạc = Music Director · Trợ lý cá nhân = Personal assistant ·
Chuyên gia sức khỏe = Health specialist · Tiền bối / đàn em = Senior / junior · Lứa = Batch · Lời mời = Offer · Thù lao = Fee · Lương = Salary · Quỹ công ty = Company funds · Tạp kỹ = Variety ·
Thể lực = Stamina · Hòa hợp = Harmony · Nhạc số = Digital · `T5 N2` = `W5 Y2`. `debut`, `comeback`, `hype`, `scandal` giữ nguyên.

## Lưu game

Tự lưu vào `localStorage` (khoá `starlight_idol_save_v1`). Nút 🔑 trên thanh trên cùng: xuất mã `SL1.…`
hoặc file `.json`, và nhập lại ở trình duyệt khác.

## Deploy

Không dùng GitHub Actions. Chạy `npm run deploy`: build với base `/vibe_code_game/` rồi đẩy `dist/` lên nhánh `gh-pages`.
Việc thủ công một lần: Settings → Pages → Source = **Deploy from a branch** → nhánh `gh-pages`, thư mục `/ (root)`.
Test chạy tay trước khi deploy: `npm test && npm run check:handlers && npm run check:i18n && npm run check:literals && npm run test:e2e`.

## Subagent cho Claude Code

Định nghĩa trong `.claude/agents/`. Luồng làm việc khuyên dùng:

1. `planner`: khảo sát và ghi kế hoạch vào `docs/plans/` (không viết code)
2. `gameplay-dev`: làm theo plan, mỗi task có test và một commit
3. `golden-guardian`: chạy unit, check:handlers và e2e, chẩn đoán khi golden lệch (chỉ báo cáo)
4. `code-reviewer`: review diff so với `main` trước khi merge hoặc deploy (chỉ đọc)
5. `balance-analyst`: mô phỏng nhiều seed để phân tích cân bằng game (chỉ đọc)
