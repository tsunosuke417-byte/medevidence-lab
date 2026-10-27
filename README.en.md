# MedEvidence Lab

MedEvidence Lab is a source-first medical literature learning prototype. It turns a Japanese or English medical question into a PubMed query, retrieves public abstracts through NCBI E-utilities, and presents traceable evidence with PMID links.

## Why this project

Fluent text is not enough in medicine. The application makes provenance visible before interpretation and refuses to answer when it cannot retrieve adequate evidence.

## Features

- Converts common Japanese medical terms into an explicit PubMed query
- Retrieves up to five abstracts through NCBI ESearch and EFetch
- Extracts a conclusion candidate while preserving citation metadata
- Refuses personal diagnosis, urgent advice, unsupported terms, and empty searches
- Stores neither questions nor patient data
- Includes responsive UI, automated tests, a 20-question evaluation set, and documentation

## Architecture

```text
Browser → POST /api/search → safety gate → query builder
        → NCBI ESearch → NCBI EFetch → evidence extractor → cited response
```

## Run locally

```powershell
pnpm install
pnpm test
pnpm dev
```

No API key is required. Network access is required for live PubMed searches.

## Safety and limitations

This project is for learning only and does not provide diagnosis, treatment, or triage. It uses abstracts rather than full papers and does not automatically grade study quality or bias. Users must verify every extracted statement in the linked source. Do not enter identifiable patient information.

[NCBI API](https://www.ncbi.nlm.nih.gov/home/develop/api/) · [NCBI Disclaimer](https://pubmed.ncbi.nlm.nih.gov/disclaimer/) · [NCBI Policies](https://www.ncbi.nlm.nih.gov/home/about/policies/)
