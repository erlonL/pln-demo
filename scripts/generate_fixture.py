#!/usr/bin/env python3
"""Print a deterministic reference fixture containing every predicted model class."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, default=Path("backend/modelo3"))
    parser.add_argument("--dataset", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    with args.dataset.open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    random.Random(args.seed).shuffle(rows)

    tokenizer = AutoTokenizer.from_pretrained(args.checkpoint)
    model = AutoModelForSequenceClassification.from_pretrained(args.checkpoint).eval()
    id2label = {int(key): value for key, value in model.config.id2label.items()}
    found: dict[int, str] = {}

    for start in range(0, len(rows), 64):
        texts = [row["sentence"] for row in rows[start : start + 64]]
        inputs = tokenizer(texts, padding=True, truncation=True, max_length=512, return_tensors="pt")
        with torch.no_grad():
            predictions = model(**inputs).logits.argmax(dim=1).tolist()
        for text, prediction in zip(texts, predictions, strict=True):
            found.setdefault(prediction, text)
        if len(found) == len(id2label):
            break

    missing = sorted(set(id2label) - set(found))
    if missing:
        raise SystemExit(f"Dataset did not produce predictions for labels: {missing}")

    checkpoint_file = args.checkpoint / "model.safetensors"
    fixture = {
        "source_checkpoint": str(args.checkpoint),
        "source_sha256": sha256(checkpoint_file),
        "seed": args.seed,
        "cases": [
            {"sentence": found[index], "label": id2label[index]}
            for index in sorted(id2label)
        ],
    }
    print(json.dumps(fixture, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
