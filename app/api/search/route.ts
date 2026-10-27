import { NextResponse } from "next/server";
import { buildSearchQuery, isUnsafeQuestion, makeSummary, parseEuropePmcResponse, parsePubMedXml, toEuropePmcQuery } from "../../../lib/pubmed";

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const EUROPE_PMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

async function searchNcbi(searchQuery: string) {
  const searchUrl = `${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=6&sort=relevance&tool=medevidence-lab&term=${encodeURIComponent(searchQuery)}`;
  const searchResponse = await fetch(searchUrl, { headers: { accept: "application/json" } });
  if (!searchResponse.ok) throw new Error(`PubMed search failed: ${searchResponse.status}`);
  const searchData = (await searchResponse.json()) as { esearchresult?: { idlist?: string[] } };
  const ids = searchData.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const fetchUrl = `${BASE}/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}&tool=medevidence-lab`;
  const fetchResponse = await fetch(fetchUrl, { headers: { accept: "application/xml" } });
  if (!fetchResponse.ok) throw new Error(`PubMed fetch failed: ${fetchResponse.status}`);
  return parsePubMedXml(await fetchResponse.text()).filter((article) => article.abstract).slice(0, 5);
}

async function searchEuropePmc(searchQuery: string) {
  const fallbackQuery = toEuropePmcQuery(searchQuery);
  if (!fallbackQuery) return [];
  const url = `${EUROPE_PMC_BASE}?query=${encodeURIComponent(fallbackQuery)}&format=json&resultType=core&pageSize=5`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Europe PMC search failed: ${response.status}`);
  return parseEuropePmcResponse(await response.json());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: unknown };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (question.length < 4 || question.length > 180) return NextResponse.json({ error: "質問は4〜180文字で入力してください。" }, { status: 400 });

    if (isUnsafeQuestion(question)) {
      return NextResponse.json({ status: "refused", question, searchQuery: "", summary: "このアプリは個別の診断・治療判断・緊急相談には回答しません。緊急性がある場合は地域の救急窓口へ、個別の症状や薬については医療専門職へ相談してください。", cautions: [], articles: [], searchedAt: new Date().toISOString() });
    }

    const searchQuery = buildSearchQuery(question);
    if (!searchQuery) {
      return NextResponse.json({ status: "refused", question, searchQuery: "", summary: "安全にPubMed検索式へ変換できる医学用語を特定できませんでした。疾患名・治療名を含めるか、英語のキーワードを添えてください。", cautions: [], articles: [], searchedAt: new Date().toISOString() });
    }

    let source = "PubMed";
    let articles;
    try {
      articles = await searchNcbi(searchQuery);
    } catch {
      articles = await searchEuropePmc(searchQuery);
      source = "Europe PMC経由のPubMed収載文献";
    }
    if (!articles.length) return NextResponse.json({ status: "refused", question, searchQuery, summary: makeSummary([]), cautions: [], articles: [], searchedAt: new Date().toISOString() });

    return NextResponse.json({
      status: "ok", question, searchQuery, summary: makeSummary(articles, source), articles,
      cautions: ["抄録のみを対象とし、本文・補足資料は評価していません。", "研究の質やバイアスを自動判定していません。", "学習支援用であり、診断・治療方針には使用できません。"],
      searchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "外部文献サービスに接続できませんでした。時間を置いて再試行してください。" }, { status: 502 });
  }
}
