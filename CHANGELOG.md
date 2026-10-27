# Improvement log

## v1.0 — Source-first prototype

### Failure: Japanese questions returned few results

- Observation: PubMed indexing is primarily English and raw Japanese questions often produced zero matches.
- Change: added a small, inspectable medical terminology mapper and displays the exact generated search expression.
- Remaining limitation: unfamiliar Japanese terms are refused rather than guessed.

### Failure: a result could look like a clinical recommendation

- Observation: extracted conclusion sentences can sound more certain than the underlying study.
- Change: renamed output to “本文からの抽出,” added fixed limitations, and removed prescriptive language.

### Failure: missing abstracts produced weak cards

- Observation: citation metadata alone cannot support a summary.
- Change: exclude records without abstracts; refuse the answer if no abstract remains.

### Failure: personal questions could enter the literature flow

- Observation: a literature search interface may be mistaken for a symptom checker.
- Change: added a pre-search safety gate for personal diagnosis, treatment decisions, and urgent language.

### Next improvements

- Add MeSH-based synonym expansion with a reviewed terminology table.
- Add study-design labels and an explicit risk-of-bias checklist.
- Compare extracted statements against full text where licensing permits.
- Run the 20-question set automatically against a pinned response fixture.
