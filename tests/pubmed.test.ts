import assert from "node:assert/strict";
import test from "node:test";
import { buildSearchQuery, extractEvidence, isUnsafeQuestion, makeSummary, parsePubMedXml } from "../lib/pubmed.ts";

test("Japanese medical terms become an inspectable PubMed query", () => {
  const query = buildSearchQuery("高血圧に対する減塩の効果は？");
  assert.match(query, /hypertension\[Title\/Abstract\]/);
  assert.match(query, /sodium restriction\[Title\/Abstract\]/);
  assert.match(query, /hasabstract/);
  assert.doesNotMatch(query, /sodium\[Title\/Abstract\]/);
});

test("unsupported Japanese text is not guessed", () => assert.equal(buildSearchQuery("今日の天気は？"), ""));

test("personal diagnosis and urgent language are refused", () => {
  assert.equal(isUnsafeQuestion("私は胸が痛い。何の病気？"), true);
  assert.equal(isUnsafeQuestion("高血圧に対する減塩の効果は？"), false);
});

test("evidence extraction prefers conclusion-like sentences", () => {
  const abstract = "We enrolled 100 adults. Blood pressure improved. In conclusion, sodium restriction reduced systolic blood pressure.";
  assert.match(extractEvidence(abstract), /conclusion/i);
});

test("PubMed XML is parsed into traceable records", () => {
  const xml = `<PubmedArticle><MedlineCitation><PMID>12345</PMID><Article><Journal><Title>Test Journal</Title><JournalIssue><PubDate><Year>2025</Year></PubDate></JournalIssue></Journal><ArticleTitle>A &amp; B trial</ArticleTitle><Abstract><AbstractText>In conclusion, treatment improved outcomes.</AbstractText></Abstract><AuthorList><Author><LastName>Sato</LastName><Initials>A</Initials></Author></AuthorList></Article></MedlineCitation></PubmedArticle>`;
  const [article] = parsePubMedXml(xml);
  assert.equal(article.pmid, "12345");
  assert.equal(article.title, "A & B trial");
  assert.equal(article.url, "https://pubmed.ncbi.nlm.nih.gov/12345/");
  assert.match(article.evidence, /improved outcomes/);
});

test("summary refuses to invent evidence", () => assert.match(makeSummary([]), /回答を生成しません/));
test("chronic kidney disease becomes a PubMed query", () => {
    const query = buildSearchQuery("慢性腎臓病に対する運動の効果は？");
    assert.match(query, /chronic kidney disease\[Title\/Abstract\]/);
});
