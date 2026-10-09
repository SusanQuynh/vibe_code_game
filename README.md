# Starlight Ent.

Game quản lý công ty giải trí (web game, Vite + vanilla JS).

## Chạy

```bash
npm i
npm run dev
```

## Test

```bash
npm test                 # unit (Vitest)
npm run check:handlers   # mọi handler inline phải có trên window
npm run test:e2e         # Playwright: golden master + smoke
```

Golden master (`tests/golden/week30.json`) khoá hành vi gameplay. Chỉ cập nhật bằng
`UPDATE_GOLDEN=1 npx playwright test golden` khi **cố ý** đổi gameplay.

`legacy/starlight-original.html` là bản artifact gốc, không bao giờ sửa.
