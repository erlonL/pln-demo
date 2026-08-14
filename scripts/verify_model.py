#!/usr/bin/env python3
"""Compare browser ONNX logits with the canonical PyTorch implementation."""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - values.max(axis=1, keepdims=True)
    exps = np.exp(shifted)
    return exps / exps.sum(axis=1, keepdims=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, default=Path("backend/modelo3"))
    parser.add_argument("--onnx", type=Path, default=Path("frontend/public/models/persuasion-bert-tiny-v1/onnx/model.onnx"))
    parser.add_argument("--dataset", type=Path)
    parser.add_argument("--sample-size", type=int, default=1024)
    parser.add_argument("--fixture", type=Path, default=Path("tests/fixtures/model-parity.json"))
    args = parser.parse_args()

    expected_labels: list[str] | None = None
    if args.dataset:
        with args.dataset.open(encoding="utf-8", newline="") as stream:
            rows = list(csv.DictReader(stream))
        texts = [row["sentence"] for row in random.Random(42).sample(rows, min(args.sample_size, len(rows)))]
    else:
        fixture = json.loads(args.fixture.read_text(encoding="utf-8"))
        texts = [item["sentence"] for item in fixture["cases"]]
        expected_labels = [item["label"] for item in fixture["cases"]]

    tokenizer = AutoTokenizer.from_pretrained(args.checkpoint)
    model = AutoModelForSequenceClassification.from_pretrained(args.checkpoint).eval()
    session = ort.InferenceSession(str(args.onnx), providers=["CPUExecutionProvider"])
    reference_rows: list[np.ndarray] = []
    browser_rows: list[np.ndarray] = []
    for start in range(0, len(texts), 32):
        batch = tokenizer(texts[start : start + 32], padding=True, truncation=True, max_length=512, return_tensors="pt")
        with torch.no_grad():
            reference_rows.append(model(**batch).logits.numpy())
        browser_rows.append(session.run(None, {key: value.numpy().astype(np.int64) for key, value in batch.items()})[0])

    reference = np.concatenate(reference_rows)
    browser = np.concatenate(browser_rows)
    ref_labels = reference.argmax(axis=1)
    browser_labels = browser.argmax(axis=1)
    probability_delta = np.abs(softmax(reference) - softmax(browser))
    report = {
        "sentences": len(texts),
        "top1_parity": float((ref_labels == browser_labels).mean()),
        "max_abs_logit_delta": float(np.abs(reference - browser).max()),
        "mean_abs_logit_delta": float(np.abs(reference - browser).mean()),
        "max_probability_delta": float(probability_delta.max()),
    }
    if expected_labels is not None:
        predicted_labels = [model.config.id2label[int(index)] for index in ref_labels]
        report["fixture_label_match"] = predicted_labels == expected_labels
    print(json.dumps(report, indent=2))
    if (
        report["top1_parity"] != 1.0
        or report["max_abs_logit_delta"] > 1e-4
        or report.get("fixture_label_match") is False
    ):
        raise SystemExit("Model equivalence gate failed")


if __name__ == "__main__":
    main()
