"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FlaskConical,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Article = {
  pmid: string;
  title: string;
  journal: string;
  year: string;
  authors: string[];
  abstract: string;
  evidence: string;
  url: string;
};

type SearchResponse = {
  status: "ok" | "refused";
  question: string;
  searchQuery: string;
  summary: string;
  cautions: string[];
  articles: Article[];
  searchedAt: string;
};

const examples = [
  "高血圧に対する減塩の効果は？",
  "SGLT2阻害薬は心不全入院を減らす？",
  "片頭痛の予防に運動は有効？",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const yearRange = useMemo(() => {
    const years = result?.articles.map((article) => Number(article.year)).filter(Boolean) ?? [];
    return years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—";
  }, [result]);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    const clean = question.trim();
    if (clean.length < 4) {
      setError("4文字以上の質問を入力してください。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: clean }),
      });
      const body = (await response.json()) as SearchResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "検索に失敗しました。");
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "検索に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <nav className="nav-shell" aria-label="メインナビゲーション">
        <a className="brand" href="#top" aria-label="MedEvidence Lab ホーム">
          <span className="brand-mark"><FlaskConical size={19} /></span>
          <span>MedEvidence <b>Lab</b></span>
        </a>
        <div className="nav-links">
          <a href="#how">仕組み</a>
          <a href="#safety">安全設計</a>
          <a className="nav-cta" href="https://github.com" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="eyebrow"><Sparkles size={14} /> Source-first medical search</div>
        <h1>医学の疑問を、<br /><em>根拠から</em>たどる。</h1>
        <p className="hero-copy">
          PubMedの公開文献を検索し、結論・根拠・注意点を出典付きで整理する、
          医学生向けの学習支援プロトタイプです。
        </p>

        <form className="search-panel" onSubmit={runSearch}>
          <label htmlFor="question">調べたい医学的な問い</label>
          <div className="search-row">
            <Search className="search-icon" size={22} aria-hidden="true" />
            <input
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="例：高血圧に対する減塩の効果は？"
              maxLength={180}
              disabled={loading}
            />
            <button type="submit" disabled={loading || question.trim().length < 4}>
              {loading ? <span className="spinner" /> : "文献を探す"}
            </button>
          </div>
          <div className="example-row" aria-label="質問例">
            <span>試してみる</span>
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => setQuestion(example)}>{example}</button>
            ))}
          </div>
        </form>

        <div className="disclaimer"><ShieldCheck size={16} /> 診断・治療の代替ではありません。個人情報や症例情報は入力しないでください。</div>
      </section>

      {(loading || error || result) && (
        <section className="results-section" aria-live="polite">
          {loading && (
            <div className="loading-card">
              <span className="pulse-dot" /> PubMedを検索し、引用可能な根拠を整理しています…
            </div>
          )}
          {error && <div className="error-card"><CircleAlert size={20} />{error}</div>}

          {result?.status === "refused" && (
            <div className="refusal-card">
              <CircleAlert size={24} />
              <div><h2>回答を保留しました</h2><p>{result.summary}</p></div>
            </div>
          )}

          {result?.status === "ok" && (
            <>
              <div className="result-head">
                <div>
                  <p className="section-kicker">Evidence brief</p>
                  <h2>検索結果の整理</h2>
                </div>
                <div className="result-stats">
                  <span><b>{result.articles.length}</b> 文献</span>
                  <span><b>{yearRange}</b> 発表年</span>
                </div>
              </div>

              <div className="brief-grid">
                <article className="summary-card">
                  <div className="card-label"><CheckCircle2 size={17} />要約</div>
                  <p>{result.summary}</p>
                  <div className="query-note">実行した検索式：<code>{result.searchQuery}</code></div>
                </article>
                <aside className="caution-card">
                  <div className="card-label"><CircleAlert size={17} />読むときの注意</div>
                  <ul>{result.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul>
                </aside>
              </div>

              <div className="articles-head">
                <h3>根拠となる文献</h3>
                <span><Clock3 size={14} /> {new Date(result.searchedAt).toLocaleString("ja-JP")}</span>
              </div>
              <div className="article-list">
                {result.articles.map((article, index) => (
                  <article className="article-card" key={article.pmid}>
                    <div className="article-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="article-body">
                      <div className="article-meta"><span>{article.year}</span><span>{article.journal}</span><span>PMID {article.pmid}</span></div>
                      <h4>{article.title}</h4>
                      <p className="authors">{article.authors.join(", ") || "著者情報なし"}</p>
                      <p className="evidence"><b>本文からの抽出：</b>{article.evidence}</p>
                      <a href={article.url} target="_blank" rel="noreferrer">PubMedで確認 <ExternalLink size={14} /></a>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section id="how" className="process-section">
        <p className="section-kicker">How it works</p>
        <h2>答えより先に、根拠を置く。</h2>
        <div className="process-grid">
          <article><span>01</span><Search /><h3>問いを検索式へ</h3><p>日本語の医学的な問いから、主要概念をPubMed向けの英語検索語へ変換します。</p></article>
          <article><span>02</span><BookOpen /><h3>一次情報を取得</h3><p>NCBI E-utilitiesからタイトル、抄録、発表年、PMIDを取得します。</p></article>
          <article><span>03</span><ShieldCheck /><h3>出典付きで整理</h3><p>抄録中の結論候補を抽出し、根拠が弱い場合は回答を拒否します。</p></article>
        </div>
      </section>

      <section id="safety" className="safety-section">
        <div>
          <p className="section-kicker">Safety by design</p>
          <h2>医療AIだから、<br />「答えない」を実装する。</h2>
        </div>
        <div className="safety-list">
          <p><CheckCircle2 />文献が取得できない場合は推測しない</p>
          <p><CheckCircle2 />すべての根拠にPMIDと外部リンクを表示</p>
          <p><CheckCircle2 />個別診断・緊急相談・患者情報を扱わない</p>
          <p><CheckCircle2 />要約と原文抽出を明確に区別</p>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark"><FlaskConical size={18} /></span><span>MedEvidence <b>Lab</b></span></div>
        <p>Medical literature learning prototype · Data from NCBI PubMed</p>
        <div><a href="https://pubmed.ncbi.nlm.nih.gov/disclaimer/" target="_blank" rel="noreferrer">NCBI Disclaimer</a><span>© 2026</span></div>
      </footer>
    </main>
  );
}
