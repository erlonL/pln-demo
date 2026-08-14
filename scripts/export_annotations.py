#!/usr/bin/env python3
"""Export the repository's GPT annotations as a deterministic, compact web artifact."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path


VALID_LABELS = (
    "No_Label",
    "Loaded_Language",
    "Name_Calling-Labeling",
    "Doubt",
    "Repetition",
    "Appeal_to_Fear-Prejudice",
    "Flag_Waving",
    "Exaggeration-Minimisation",
)

SOURCES = (
    "conexao-labels-full-4.1nano-p2",
    "g1-labels-full-4.1nano-p2",
    "g1_faketrue_treated",
)

# The public demo intentionally exposes a small, balanced research showcase rather
# than the complete annotation corpus. The two editorial/news sources contribute
# most examples; FakeTrueBr remains represented with two examples per technique,
# without letting its noisier, social-media-derived text dominate the showcase.
SELECTION_QUOTAS = {
    "No_Label": (6, 5, 2),
    "Loaded_Language": (5, 6, 2),
    "Name_Calling-Labeling": (6, 5, 2),
    "Doubt": (5, 6, 2),
    "Repetition": (5, 5, 2),
    "Appeal_to_Fear-Prejudice": (5, 5, 2),
    "Flag_Waving": (5, 5, 2),
    "Exaggeration-Minimisation": (5, 5, 2),
}

TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalized_tokens(text: str) -> set[str]:
    return {token.casefold() for token in TOKEN_RE.findall(text) if len(token) > 2}


def stable_tiebreak(row: dict[str, str]) -> str:
    identity = "\0".join((row["sentence"], row["label"], row["source"]))
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def quality_score(row: dict[str, str]) -> float:
    """Prefer readable, well-justified examples without encoding editorial taste."""
    sentence = " ".join(row["sentence"].split())
    justification = " ".join(row["justification"].split())
    sentence_tokens = normalized_tokens(sentence)

    score = 0.0
    sentence_length = len(sentence)
    justification_length = len(justification)
    if 55 <= sentence_length <= 360:
        score += 35
    elif 30 <= sentence_length <= 520:
        score += 18
    else:
        score -= min(abs(sentence_length - 180) / 8, 35)

    if 90 <= justification_length <= 650:
        score += 30
    elif 55 <= justification_length <= 900:
        score += 16
    else:
        score -= 12

    if 8 <= len(sentence_tokens) <= 55:
        score += 14
    score += min(len(sentence_tokens) / max(len(TOKEN_RE.findall(sentence)), 1), 1) * 8
    if any(mark in justification for mark in ('"', "“", "‘", "'")):
        score += 4
    if row["source"] == "g1_faketrue_treated":
        score += 3  # Its original justifications are already in Portuguese.
    if "http://" in sentence or "https://" in sentence or "www." in sentence:
        score -= 18
    if re.search(r"(?:<[^>]*>|&(?:amp|nbsp|quot);|\bspan\b|\bclass=|\bstyle=)", sentence, re.I):
        score -= 80
    if "#" in sentence or "*" in sentence:
        score -= 18
    if "\n" in row["sentence"] or "\r" in row["sentence"]:
        score -= 8
    if sentence.count("!") + sentence.count("?") > 4:
        score -= 7
    return score


def jaccard(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def select_examples(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Select 100 high-quality, lexically varied examples with fixed quotas."""
    selected: list[dict[str, str]] = []
    selected_token_sets: list[set[str]] = []
    selected_sentences: set[str] = set()

    for label in VALID_LABELS:
        for source, quota in zip(SOURCES, SELECTION_QUOTAS[label], strict=True):
            candidates = [
                row
                for row in rows
                if row["label"] == label
                and row["source"] == source
                and " ".join(row["sentence"].split()).casefold() not in selected_sentences
            ]
            chosen_here = 0
            while candidates and chosen_here < quota:
                def rank(row: dict[str, str]) -> tuple[float, float, str]:
                    row_tokens = normalized_tokens(row["sentence"])
                    maximum_similarity = max(
                        (jaccard(row_tokens, previous) for previous in selected_token_sets),
                        default=0.0,
                    )
                    base = quality_score(row)
                    return (base - maximum_similarity * 42, base, stable_tiebreak(row))

                best = max(candidates, key=rank)
                normalized_sentence = " ".join(best["sentence"].split()).casefold()
                selected.append(best)
                selected_token_sets.append(normalized_tokens(best["sentence"]))
                selected_sentences.add(normalized_sentence)
                candidates = [
                    row
                    for row in candidates
                    if " ".join(row["sentence"].split()).casefold() != normalized_sentence
                ]
                chosen_here += 1

            if chosen_here != quota:
                raise SystemExit(
                    f"Could only select {chosen_here}/{quota} examples for {label} · {source}"
                )

    if len(selected) != 100:
        raise SystemExit(f"Selection contract expected 100 examples, got {len(selected)}")
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("../pln/datasets/combined_dataset.csv"))
    parser.add_argument("--output", type=Path, default=Path("frontend/public/data/gpt-annotations-v2.json"))
    args = parser.parse_args()

    with args.input.open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    required = {"sentence", "label", "justification", "source"}
    if not rows or not required.issubset(rows[0]):
        raise SystemExit(f"Expected CSV columns: {sorted(required)}")

    valid = [row for row in rows if row["label"] in VALID_LABELS]
    errors = [row for row in rows if row["label"] == "ERROR"]
    unknown = sorted({row["label"] for row in rows} - set(VALID_LABELS) - {"ERROR"})
    if unknown:
        raise SystemExit(f"Unexpected labels: {unknown}")
    if any(not row["sentence"].strip() or not row["justification"].strip() for row in valid):
        raise SystemExit("Every exported annotation must contain a sentence and justification")

    selected = select_examples(valid)
    label_counts = Counter(row["label"] for row in selected)
    source_counts = Counter(row["source"] for row in selected)
    payload = {
        "version": "2.0.0",
        "sourceFile": args.input.name,
        "sourceSha256": sha256(args.input),
        "count": len(selected),
        "totalCandidates": len(valid),
        "excludedErrors": len(errors),
        "selection": {
            "method": "balanced-quality-diversity-v1",
            "description": "Deterministic balanced selection by label and source, ranked for readability, justification quality, and lexical diversity.",
        },
        "labelCounts": {label: label_counts[label] for label in VALID_LABELS},
        "sourceCounts": dict(sorted(source_counts.items())),
        "records": [
            [row["sentence"].strip(), row["label"], row["justification"].strip(), row["source"]]
            for row in selected
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(json.dumps({
        "path": str(args.output),
        "records": len(selected),
        "total_candidates": len(valid),
        "excluded_errors": len(errors),
        "bytes": args.output.stat().st_size,
        "sha256": sha256(args.output),
    }, indent=2))


if __name__ == "__main__":
    main()
