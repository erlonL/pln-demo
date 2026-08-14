#!/usr/bin/env python3
"""Export the canonical fine-tuned BERT-Tiny checkpoint to portable ONNX."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import onnx
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
    parser.add_argument("--output", type=Path, default=Path("frontend/public/models/persuasion-bert-tiny-v1/onnx/model.onnx"))
    args = parser.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.checkpoint)
    model = AutoModelForSequenceClassification.from_pretrained(args.checkpoint).eval()
    inputs = tokenizer(["Texto de referência para exportação."], return_tensors="pt")
    args.output.parent.mkdir(parents=True, exist_ok=True)

    torch.onnx.export(
        model,
        (inputs["input_ids"], inputs["attention_mask"], inputs["token_type_ids"]),
        args.output,
        input_names=["input_ids", "attention_mask", "token_type_ids"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "attention_mask": {0: "batch", 1: "sequence"},
            "token_type_ids": {0: "batch", 1: "sequence"},
            "logits": {0: "batch"},
        },
        opset_version=17,
        dynamo=False,
    )
    onnx.checker.check_model(onnx.load(args.output))
    print(json.dumps({"path": str(args.output), "bytes": args.output.stat().st_size, "sha256": sha256(args.output)}, indent=2))


if __name__ == "__main__":
    main()
