# mb-commitment-map

> メビウス社内の「大目標 → 部署 → 作戦 → 詳細」を 1 枚で見える化するダッシュボード。
> Google Sheets を master、HTML を読取専用ビューとする配信。

## プロジェクト概要

- **目的**: 「2027年3月期 利益1億円（定量）」と「大切な人に紹介したくなるブランド（定性）」の 2 大目標を、部署別（マーケ本店/マーケモール/CS/商品）にどう [成果 → 作戦 → 詳細] へブレイクダウンするかを社内共通認識化
- **対象ユーザー**: メビウス社内メンバー（マーケ / CS / 商品 / 経営）
- **制作物タイプ**: Web ダッシュボード（単一 HTML）
- **デザイン系統**: **Liquid Glass — Mebius** (cool neutral base + teal accent `#00ABBF`)

## 配信・運用

- 公開 URL: `https://mb.instyle.group/html/mb-commitment-map.html`
- ローカル正本: `~/Workspace/mb-commitment-map/mb-commitment-map.html`
- データ元: Google Sheets（新規作成、Sheet ID は `.sheet-id` に保存）
- 読込方式: xlsx export + fflate 解凍（`mb-progress-dashboard` と同パターン）
- 更新反映: スプシを触る → HTML 側でリロード（キャッシュなし fetch）

## デザインルール

`~/Workspace/design-system_mebius/design.md` + `CLAUDE_template.md` に完全準拠。

- scene-bg（楕円グラデ）を最下層に敷く
- Glass material 4 種（`--glass-light` / `--glass-warm` / `--glass-tinted` / `--glass-dark`）のみ使う
- 差し色 `--color-accent: #00ABBF` は CTA / 選択タブ / アクセントラインだけ
- 部署色（凡例タブ由来）はネットワーク図のノード塗りとリンク色でのみ使用
- Superellipse `corner-shape` を全要素に適用
- BudouX を全 日本語テキストに適用（`h1, h2, h3, h4, p, li, td, th, .node-label` など）
- フォント: `Gen Interface JP` + `Gen Interface JP Display`

## ファイル構成

```
mb-commitment-map/
├── CLAUDE.md                   ← このファイル
├── mb-commitment-map.html      ← 単一 HTML（本番配信物）
├── .sheet-id                   ← Google Sheets の ID（gitignore 対象外・共有スプシ ID なので公開可）
└── docs/
    └── sheets-schema.md        ← スプシ列定義の正本
```

## デプロイ手順

```bash
scp mb-commitment-map.html conoha-root:/var/www/mb/html/
curl -sSLo /dev/null -w "%{http_code}\n" https://mb.instyle.group/html/mb-commitment-map.html
# 索引更新
# ~/Workspace/workspace-index/data.json の html_single に追記
bash ~/Workspace/workspace-index/deploy.sh
```
