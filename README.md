# UI Evidence Portal

GitHub Actionsで実行したWeb・Android・iOSのUIテスト証跡を、過去分を含めて閲覧・比較する常設Portalです。

## Upload UI Evidence Action

公開GitHub Action [`mtzack-org/upload-ui-evidence`](https://github.com/mtzack-org/upload-ui-evidence)は、UIテストのスクリーンショット、動画、HTMLレポート、Trace、ログをPortalへ登録します。実行後はGitHub ActionsのJob Summaryに証跡へのリンクが表示されます。

```yaml
name: UI Tests

on:
  pull_request:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run UI tests
        run: npm test

      - name: Upload UI evidence
        if: always()
        uses: mtzack-org/upload-ui-evidence@v1
        with:
          portal-url: ${{ secrets.UI_EVIDENCE_PORTAL_URL }}
          token: ${{ secrets.UI_EVIDENCE_INGEST_TOKEN }}
          platform: web
          status: ${{ job.status }}
          screenshots: test-results/**/*.png
          videos: test-results/**/*.webm
          reports: playwright-report/**/*.{html,zip}
          traces: test-results/**/*.zip
          logs: test-results/**/*.{log,txt,json}
          if-no-files-found: error
```

`portal-url`にはデプロイ済みPortalのURLを、`token`にはPortalの`EVIDENCE_INGEST_TOKEN`と同じ値をRepositoryまたはOrganization Secretとして設定します。各ファイル入力は複数行のglobにも対応します。

```yaml
screenshots: |
  test-results/**/*.png
  screenshots/**/*.jpg
```

Actionの出力は`run-id`、`run-url`、`uploaded-count`です。テスト件数をPortalに表示する場合は`total`、`passed`、`failed`、`skipped`、`duration-ms`も指定できます。

VercelのDeployment Protectionが有効なPreviewを検証する場合だけ、Automation Bypass secretを`vercel-protection-bypass`へ渡せます。この値もActionのログではマスクされます。本番Portalでは指定しません。

証跡が1件も見つからない場合は既定で警告し、Portalへ空の実行は作成しません。CIを失敗させたい場合は`if-no-files-found: error`、何も表示しない場合は`ignore`を指定します。アップロード途中で失敗した場合、作成済みのPortal実行は可能な限り`failed`へ更新されます。

完全なPlaywright workflow例は[`examples/playwright.yml`](examples/playwright.yml)にあります。

## Deploy your Portal

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmtzack-org%2Fui-evidence-portal)

デプロイ後、VercelでPrivate Blob storeを接続し、下記の環境変数を設定します。GitHub OAuth Appのcallback URLは`https://<production-domain>/api/auth/callback/github`です。

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

現在の公開可否は[`docs/release-readiness.md`](docs/release-readiness.md)、公開手順は[`docs/marketplace.md`](docs/marketplace.md)、問い合わせ方法は[`SUPPORT.md`](SUPPORT.md)、脆弱性報告は[`SECURITY.md`](SECURITY.md)を参照してください。

## License

GNU Affero General Public License v3.0 only (`AGPL-3.0-only`)。詳細は[`LICENSE`](LICENSE)を参照してください。

Actionのソース、リリース、問い合わせは公開リポジトリ
[`mtzack-org/upload-ui-evidence`](https://github.com/mtzack-org/upload-ui-evidence)で管理します。
