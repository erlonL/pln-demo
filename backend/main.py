from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import nltk

nltk.download("punkt_tab", quiet=True)
from nltk.tokenize import sent_tokenize

CAMINHO_MODELO = "modelo3/"

tokenizer = AutoTokenizer.from_pretrained(CAMINHO_MODELO)
modelo = AutoModelForSequenceClassification.from_pretrained(CAMINHO_MODELO)
modelo.eval()

TRADUCOES = {
    "No_Label":                    "Neutro",
    "Doubt":                       "Descredibilidade",
    "Name_Calling-Labeling":       "Imposição",
    "Appeal_to_Fear-Prejudice":    "Apelo ao Medo",
    "Repetition":                  "Repetição",
    "Exaggeration-Minimisation":   "Exagero ou Minimização",
    "Flag_Waving":                 "Apelo Patriótico",
    "Loaded_Language":             "Palavras Fortes",
}

def traduzir(label: str) -> str:
    return TRADUCOES.get(label, label)

def tokenizar_sentencas(texto: str) -> list[str]:
    return sent_tokenize(texto, language="portuguese")

def labelar_sentencas(sentencas: list[str]) -> list[str]:
    rotulos = []
    for sentenca in sentencas:
        inputs = tokenizer(sentenca, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = modelo(**inputs)
        idx = outputs.logits.argmax(dim=-1).item()
        rotulo = modelo.config.id2label[idx]
        # rotulos.append(rotulo)
        rotulos.append(traduzir(rotulo))
    return rotulos

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyse")
def analyse(text: str = Form(...)):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Texto vazio.")

    sentencas = tokenizar_sentencas(text)
    rotulos = labelar_sentencas(sentencas)

    results = [
        {"sentence": s, "label": r}
        for s, r in zip(sentencas, rotulos)
    ]

    contagem = Counter(rotulos)
    total = len(rotulos)

    label_counts = [
        {
            "label": label,
            "count": qtd,
            "percentage": round((qtd / total) * 100, 1),
        }
        for label, qtd in contagem.items()
    ]

    return {
        "original_text": text,
        "label_counts": label_counts,
        "results": results,
    }