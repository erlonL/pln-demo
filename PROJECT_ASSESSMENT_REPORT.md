# Project Assessment Report

## Executive Summary
This project is a prototype for persuasive-technique detection in political discourse, combining a local NLP inference backend with a Vue frontend for interactive analysis. Its strongest implemented path is text submission to `/api/analyse`, sentence segmentation, per-sentence labeling, and aggregate label statistics display.

Current state is mixed-stage: the core classifier demo is functional, while parts of the repository (notably transcript/video browsing routes documented in the README and used by some frontend stores/pages) are not currently implemented in the active backend. As an academic/portfolio prototype, this does not invalidate the project, but it materially affects readiness and recoverability.

Major strengths are clear thematic focus, bundled runnable assets (models + sample data), and a demonstrable end-to-end analysis interaction. Main limitations are documentation/runtime drift, missing training/evaluation methodology, and absence of experiment metrics. Continuation potential is good if scope is consolidated around the canonical text-analysis flow and documentation is synchronized.

---

## Project Mission
Develop an interactive system to identify and communicate persuasive/rhetorical techniques in discourse, with emphasis on explainable segmented outputs rather than opaque overall scoring.

**Confidence:** High (confirmed by frontend copy, labels, API behavior, and sample artifacts).

## Research / Problem Domain
Natural Language Processing applied to rhetoric/propaganda-style classification in political communication contexts.

**Confidence:** High (confirmed by model labels and dataset examples).

## Intended Audience or Stakeholders
- Primary: recruiters/interviewers evaluating applied NLP and prototype delivery.
- Secondary: course evaluators (academic deliverable context).

**Confidence:** Medium (audience provided by user; repo signals align with academic context).

## Functional or Experimental Overview
- Backend (`FastAPI`) loads a local Transformer classifier (`modelo2/`) and tokenizes Portuguese sentences via NLTK.
- `/api/analyse` accepts text (form-data), classifies each sentence, translates internal labels to Portuguese display labels, and returns sentence-level plus aggregated counts/percentages.
- Frontend `AnalysePage` posts text to `/api/analyse` and visualizes distribution and sentence tags with color-coded summaries.
- Video-upload mode exists in UI but is explicitly disabled (`enableVideoMode = false`).

## Repository / Study Structure Analysis
- `backend/`: inference service, local model artifacts, transcript/label sample data.
- `frontend/`: Vue + Pinia + Router application with analysis flow and additional transcript/video pages.
- `README.md`: describes a broader transcript/video API surface (`/api/videos`, `/api/labels`, `/api/transcripts/{video_id}`) not present in current `backend/main.py`.
- `exemplo-resposta.json`: example response shape for model output.

## Technologies, Frameworks, or Methodologies
- Backend: FastAPI, Transformers, PyTorch, NLTK, Python multipart form handling.
- Frontend: Vue 3, Pinia, Vue Router, Vite.
- Method pattern: sentence-level single-label classification followed by translated label presentation and frequency summarization.
- Data strategy: curated sample transcripts with labeled segments and bundled model checkpoints.

## Current Maturity Assessment
**Stage:** Prototype  
The project demonstrates a working core analytical pipeline and UI narrative, but has unresolved scope divergence and missing methodology documentation that prevent it from being a complete experimental validation package.

---

# Scoring

## Complexity Score: 7.6/10
### Rationale
Complexity is driven by integrating NLP inference, sentence segmentation, label translation, and interactive client-side visualization. This is more than a static UI demo and includes meaningful model-serving concerns (tokenization, batching per sentence, label mapping, aggregate stats).

### Key Drivers
- End-to-end integration across model runtime, API, and frontend interpretation.
- Domain-specific taxonomy handling (internal label schema to localized presentation labels).
- Mixed artifact set: model weights, transcripts, UI workflows, and API contracts.

### Notable Challenges
- Maintaining consistency between model label space and UI label semantics.
- Balancing interpretability (sentence-level output) with performance and response latency.
- Handling multilingual/domain alignment (English-style model labels translated to Portuguese UX).

---

## Readiness Score: 6.4/10
### Rationale
As a prototype, readiness is moderate-to-good for demonstration of the canonical text-analysis flow. It is not low because production concerns are missing; rather, it is constrained by reproducibility gaps (training provenance, metrics) and implementation/documentation mismatch for non-canonical routes.

### Missing Elements
- No training/evaluation documentation (dataset provenance, split strategy, baseline comparisons, metrics).
- No experiment logs or reproducible notebooks for model development decisions.
- README/API mismatch with backend implementation (documented routes missing in current runtime).
- Minimal automated validation (no visible tests for API behavior or model output contracts).

### Continuation Feasibility
Feasible with focused consolidation:
1. Declare `/api/analyse` as v1 canonical path and align docs.
2. Add lightweight evaluation evidence (even small holdout metrics and confusion trends).
3. Reintroduce or remove transcript/video APIs consistently across backend/frontend/docs.

---

## Documentation / Documentability Score: 6.1/10
### Rationale
The project is partially recoverable: structure is understandable, and core run instructions exist. However, recoverability is reduced by stale architectural narrative and absent methodological traceability for the model.

### Recoverability Assessment
- Positive: clear top-level structure, runnable startup script, visible sample data, explicit UI intent.
- Limiting: insufficient explanation of model origin and performance; ambiguous system boundary due to legacy/unfinished routes.

### Suggested Improvements
1. Add `ARCHITECTURE.md` defining canonical scope and deprecated/experimental components.
2. Add `MODEL_CARD.md` with label schema, data source summary, and known limitations.
3. Update README endpoint table to match actual backend, or restore missing endpoints.
4. Add one reproducibility section with exact environment, dependency pinning strategy, and deterministic run notes.

---

# Strengths
- Clear and focused problem framing around persuasion-technique detection.
- Working end-to-end prototype path from text input to interpretable labeled output.
- Bundled local model artifacts reduce setup friction for demonstration.
- Frontend presents results in a stakeholder-friendly visual format.
- Evidence of iterative development and UX refinement in commit history.

# Weaknesses
- Core documentation does not accurately reflect current backend functionality.
- Experimental methodology is not documented (training process and evaluation evidence missing).
- Label taxonomies differ across components (sample transcript labels vs model label set), increasing conceptual drift risk.
- No visible tests or benchmark scripts to validate stability across changes.

# Risks or Gaps
- **Interpretation risk:** users may over-trust classifications without confidence/uncertainty signaling.
- **Reproducibility risk:** future collaborators cannot reconstruct model training or validate claims.
- **Scope risk:** dual identity (text-analysis prototype vs transcript-video explorer) can fragment continuation effort.
- **Maintenance risk:** dependency versions are mostly unpinned, which may cause environment drift.

# Suggested Next Steps
1. Freeze and document a canonical v1 scope centered on `/api/analyse`.
2. Publish minimal model evaluation artifact (metrics table + sample failure cases).
3. Resolve frontend/backend/README contract mismatch in a single synchronization pass.
4. Add smoke tests for `/api/analyse` response schema and empty-input handling.
5. Document label ontology alignment across model outputs and UI terminology.

# Potential Future Directions
- Add uncertainty outputs (top-k logits/probabilities) and confidence-aware UI messaging.
- Expand from sentence-level to segment/contextual analysis with temporal linking.
- Introduce comparative experiments across alternative lightweight transformers.
- Support multilingual evaluation benchmarks if cross-lingual use is a goal.
- Re-enable video workflow by integrating transcription pipeline and mapping timestamps to classified segments.

---

# Appendix

## Notable Files
- `README.md`
- `backend/main.py`
- `backend/modelo/config.json`
- `backend/modelo2/config.json`
- `backend/data/transcripts/debate_001.json`
- `backend/data/transcripts/interview_002.json`
- `backend/data/labels.json`
- `frontend/src/pages/AnalysePage.vue`
- `frontend/src/stores/videoStore.js`
- `frontend/src/stores/labelStore.js`
- `start.sh`
- `exemplo-resposta.json`

## Datasets and Artifacts
- Sample labeled transcript JSON files under `backend/data/transcripts/`.
- Label registry under `backend/data/labels.json`.
- Two bundled model checkpoints under `backend/modelo/` and `backend/modelo2/`.

## Important Modules
- `backend/main.py`: inference entrypoint, sentence tokenization, label mapping, API response assembly.
- `frontend/src/pages/AnalysePage.vue`: main demonstrable UX for text analysis.
- `frontend/src/stores/videoStore.js` and `labelStore.js`: legacy/extended flows requiring backend routes not currently implemented.

## Inferred Architecture (Current Reality)
1. User submits text in frontend.
2. Frontend sends multipart request to `/api/analyse`.
3. Backend segments text into sentences, classifies each sentence, translates labels, aggregates counts.
4. Frontend renders per-sentence tags and percentage distribution.

## Experiment Observations
- Prototype emphasizes interpretability (sentence-level outputs) over benchmark reporting.
- Model appears to be a compact BERT-style classifier (`4` layers, reduced hidden size variants).
- UI includes disabled video upload and non-canonical transcript pages, indicating unfinished or deferred expansion paths.

## Assumptions vs Confirmed Findings
### Confirmed
- `/api/analyse` exists and performs sentence-level labeling.
- README documents endpoints not currently present in backend code.
- Frontend has active `/analyse` route and disabled video analysis mode.
- Local model files and sample transcript data are present in-repo.

### Inferred
- Project evolved from broader transcript/video explorer concept to narrower text-analysis demo focus.
- `modelo2/` is preferred/current model variant for runtime.
- Repository is intended for demonstration/academic presentation rather than deployment.

### Unknown
- Training dataset provenance and licensing.
- Training procedure, hyperparameter search, and validation methodology.
- Quantitative performance metrics and error analysis.
- Formal study hypotheses and acceptance criteria used during development.
