# UI Evidence Portal

GitHub Actionsで実行したWeb・Android・iOSのUIテスト証跡を、過去分を含めて閲覧・比較する常設Portalです。

## Stack

- Next.js App Router / TypeScript
- Auth.js GitHub OAuth
- Vercel Private Blob
- Vercel Cron

## Local setup

Node.js 24を使用します。

```bash
npm install
cp .env.example .env.local
npm run dev
```

環境変数の詳細、Actionsからの登録方法、運用設計は [`docs/operations.md`](docs/operations.md) を参照してください。
