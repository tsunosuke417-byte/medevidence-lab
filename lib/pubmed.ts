export type PubMedArticle = {
  pmid: string;
  title: string;
  journal: string;
  year: string;
  authors: string[];
  abstract: string;
  evidence: string;
  url: string;
};

const MEDICAL_TERMS: Array<[RegExp, string]> = [
  [/高血圧/g, "hypertension"], [/減塩|塩分制限/g, "sodium restriction"],
  [/糖尿病/g, "diabetes mellitus"], [/心不全/g, "heart failure"],
  [/SGLT2阻害薬/gi, "SGLT2 inhibitor"], [/片頭痛/g, "migraine"],
  [/運動|運動療法/g, "exercise"], [/予防/g, "prevention"],
  [/治療/g, "treatment"], [/効果|有効/g, "effectiveness"],
  [/入院/g, "hospitalization"], [/死亡/g, "mortality"],
  [/喘息/g, "asthma"], [/うつ病/g, "depression"],
  [/認知症/g, "dementia"], [/ワクチン/g, "vaccine"],
];

const PERSONAL_OR_URGENT = /(私は|わたしは|患者|この症状|何の病気|診断して|薬を飲むべき|救急|胸が痛|息ができ|意識が|自殺|死にたい)/;

export function isUnsafeQuestion(question: string) {
  return PERSONAL_OR_URGENT.test(question);
}

export function buildSearchQuery(question: string) {
  const concepts: string[] = [];
  for (const [pattern, english] of MEDICAL_TERMS) {
    if (pattern.test(question)) concepts.push(english);
    pattern.lastIndex = 0;
  }
  const asciiTerms = question.match(/[A-Za-z][A-Za-z0-9+.-]{2,}/g) ?? [];
  const unique = [...new Set([...concepts, ...asciiTerms.map((term) => term.toLowerCase())])].slice(0, 6);
  if (unique.length < 1) return "";
  return `${unique.map((term) => `(${term}[Title/Abstract])`).join(" AND ")} AND hasabstract[text]`;
}

function decodeXml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}

function first(xml: string, tag: string) {
  return decodeXml(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
}

function all(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi"))].map((match) => decodeXml(match[1])).filter(Boolean);
}

export function extractEvidence(abstract: string) {
  if (!abstract) return "抄録が取得できませんでした。PubMedで原文をご確認ください。";
  const sentences = abstract.match(/[^.!?]+[.!?]+/g) ?? [abstract];
  const signal = sentences.find((sentence) => /conclu/i.test(sentence))
    ?? sentences.find((sentence) => /suggest|associated|effective|reduced|improved|increased|risk/i.test(sentence));
  const selected = (signal ?? sentences[sentences.length - 1]).trim();
  return selected.length > 420 ? `${selected.slice(0, 417)}…` : selected;
}

export function parsePubMedXml(xml: string): PubMedArticle[] {
  const records = [...xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/gi)];
  return records.map((record) => {
    const item = record[1];
    const pmid = first(item, "PMID");
    const year = first(item, "Year") || first(item, "MedlineDate").slice(0, 4) || "年不明";
    const lastNames = all(item, "LastName");
    const initials = all(item, "Initials");
    const authors = lastNames.slice(0, 6).map((name, index) => `${name} ${initials[index] ?? ""}`.trim());
    const abstract = all(item, "AbstractText").join(" ");
    return {
      pmid,
      title: first(item, "ArticleTitle") || "タイトル情報なし",
      journal: first(item, "Title") || first(item, "ISOAbbreviation") || "掲載誌不明",
      year,
      authors,
      abstract,
      evidence: extractEvidence(abstract),
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  }).filter((article) => article.pmid && article.title);
}

export function makeSummary(articles: PubMedArticle[]) {
  if (!articles.length) return "質問に対応する抄録付き文献を確認できなかったため、回答を生成しませんでした。";
  const newest = articles.map((article) => Number(article.year)).filter(Number.isFinite).sort((a, b) => b - a)[0];
  return `PubMedから抄録付き文献を${articles.length}件取得しました${newest ? `（最新${newest}年）` : ""}。下記は抄録中の結論候補を機械的に抽出したものであり、研究デザイン・対象集団・効果量を原文で確認してから解釈してください。`;
}
