# MedEvidence Lab

PubMedの公開文献を検索し、出典付きの evidence brief を作る医学生向け学習支援プロトタイプです。個別診断ではなく、「問い → 検索式 → 原文抽出 → 出典確認」という検証可能な流れを見せるために作りました。

## なぜ作ったか

生成AIは自然な文章を作れますが、医療では文章の流暢さより根拠の追跡可能性が重要です。この作品では、回答より先にPMIDと原文リンクを提示し、根拠が取得できなければ回答しない設計を採用しています。

## 主な機能

- 日本語または英語の医学的な問いからPubMed検索式を生成
- NCBI ESearch → EFetchで最大5件の抄録を取得
- 抄録中の結論候補を抽出し、タイトル・発表年・著者・PMIDと表示
- 文献なし、変換不能、個別診断・緊急相談を明示的に拒否
- モバイル対応、キーボード操作、`aria-live`による結果通知
- 質問・患者情報を保存しない

## 構成

```text
Browser
  └─ POST /api/search
       ├─ safety gate
       ├─ Japanese term mapper
       ├─ NCBI ESearch (PMID list)
       ├─ NCBI EFetch (article XML)
       └─ evidence extractor → cited JSON response
```

| レイヤー | 技術 |
|---|---|
| UI | Next.js / React / TypeScript / CSS |
| API | Next Route Handler on Cloudflare Workers |
| 文献 | NCBI Entrez E-utilities / PubMed |
| 検証 | Node test runner / TypeScript build |
| 公開 | OpenAI Sites |

## ローカル実行

```powershell
pnpm install
pnpm dev
```

`http://localhost:3000` を開きます。外部検索にはネットワーク接続が必要です。APIキーや患者データは不要です。

```powershell
pnpm test
pnpm build
```

## AIコーディングと自分の判断

AIコーディングはUIの初稿、型定義、テストケースの展開に利用しました。採否を自分で判断した点は、個別相談の拒否条件、出典の必須化、抄録がない文献の除外、外部API失敗時のエラー表示、回答文と原文抽出の分離です。生成コードはTypeScriptビルド、単体テスト、実ブラウザ操作で検証します。

## 安全性と限界

- 本アプリは学習支援用で、診断・治療・トリアージを行いません。
- 抄録だけを対象とし、研究デザインやバイアスを自動評価しません。
- 抽出文は原文の一部であり、総合的な医学的結論ではありません。
- PubMed収載はNLM/NIHによる内容の承認を意味しません。
- 実患者情報、大学・病院から持ち出した資料を入力してはいけません。

[NCBI API](https://www.ncbi.nlm.nih.gov/home/develop/api/) · [NCBI Disclaimer](https://pubmed.ncbi.nlm.nih.gov/disclaimer/) · [NCBI Policies](https://www.ncbi.nlm.nih.gov/home/about/policies/)

## 評価と改善記録

- `data/evaluation.json`: 20問の受け入れ評価セット
- `CHANGELOG.md`: 失敗例と設計改善
- `docs/demo-script.md`: 2分デモ台本
- `docs/portfolio-one-pager.md`: 応募用1ページ資料
- `docs/interview-prep.md`: 面接想定問答
- `docs/12-week-roadmap.md`: 継続学習・応募計画

英語版は [README.en.md](README.en.md) を参照してください。
