# Architecture

## Data flow

```text
GitHub Actions
  │  EVIDENCE_INGEST_TOKEN (registration only)
  ▼
POST /api/v1/runs ──► run metadata JSON (Private Blob)
  │
  └── 15-minute, run-bound upload JWT
          │
          ▼
POST /api/v1/uploads ── validates path / type / max size
          │
          └── scoped Vercel Blob client token ──► evidence object

Browser ── GitHub OAuth + org check ──► Next.js
                                          │
                                          └── /api/evidence/* ──► Private Blob
```

PortalのVercelデプロイはリポジトリのコード変更でのみ発生します。UIテスト実行は常設APIへデータを登録するだけで、Portalを再ビルド・再デプロイしません。

## Storage layout

```text
metadata/runs/<run-id>.json
runs/<run-id>/evidence/<web|android|ios>/<kind>/<filename>
```

メタデータは実行ごとに独立したJSONなので、中央インデックスの競合を避けます。履歴画面はメタデータprefixを列挙し、開始時刻で降順に整列します。

## Trust boundaries

- `BLOB_READ_WRITE_TOKEN` はVercel Functionだけが保持する。
- Actionsは登録用シークレットを使い、Blobの万能トークンは保持しない。
- アップロードJWTは実行IDに束縛され、15分で期限切れになる。
- Blob client token発行時に、実行ID、canonical path、拡張子、content type、最大サイズを再検証する。
- Private BlobのURLをブラウザへ返さず、認証済み配信ルートからstreamする。
- PNG/JPEG/WebPとMP4/WebMだけをinline表示する。HTML、Trace、ログは`attachment`かつ`application/octet-stream`で配信し、`nosniff`とsandbox CSPを付ける。
- SVG、JavaScript、実行可能ファイル、パストラバーサルを拒否する。

## Retention

- `normal`: 開始日時から90日後に証跡オブジェクトだけ削除する。
- `release`: 無期限。
- `manual`: 無期限。
- Cronは毎日02:17 UTCに実行し、`CRON_SECRET`で認証する。
- 削除後は実行メタデータに`evidenceDeletedAt`を記録し、履歴・比較対象として残す。
