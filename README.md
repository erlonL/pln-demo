# Além das Palavras — demo interativa

Companheiro interativo do artigo **“Além das Palavras: Detectando Técnicas Persuasivas em Notícias e Artigos de Opinião da Língua Portuguesa com BERT-Tiny”**.

O site segmenta texto em sentenças e executa o checkpoint real do projeto diretamente no navegador. Não existe API de inferência em produção e o texto analisado não é enviado para servidores.

## Executar

```bash
cd frontend
npm install --ignore-scripts
npm run dev
```

Abra `http://localhost:5173/pln-demo/`.

## Validação

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

O teste completo do modelo baixa/carrega os artefatos locais e é habilitado com `RUN_MODEL_E2E=1 npm run test:e2e`.

## Modelo no navegador

- Fonte canônica: `backend/modelo3`
- Arquitetura: BERT-Tiny, 2 camadas, dimensão 128, 2 cabeças
- Runtime: Transformers.js + ONNX Runtime Web
- Caminho preferencial: WebGPU; fallback: WASM
- Checkpoint original: 17.552.400 bytes
- ONNX implantado: 17.591.749 bytes
- Download com tokenizer/configuração: 18.305.019 bytes
- Limite: 512 tokens por sentença, com truncamento visível

O modelo é baixado somente quando o visitante inicia uma análise. Um cache próprio valida tamanho e SHA-256 de cada artefato e usa o identificador `nome + versão + hash`. O service worker não armazena uma segunda cópia do modelo; ele guarda apenas o shell e, sob demanda, o runtime WASM.

## Acervo de anotações GPT

A seção **Anotações** disponibiliza uma curadoria pública de 100 exemplos do snapshot `combined_dataset.csv`: sentença, rótulo, fonte e justificativa. O artefato tem cerca de 42 KB, é carregado somente quando o visitante abre a seleção e recebe cache próprio versionado. O corpus completo não é distribuído pelo site.

A seleção mantém 13 exemplos para quatro classes e 12 para as demais, com 42 amostras da Conexão Política, 42 do G1 Fato ou Fake e 16 do FakeTrueBr tratado. O exportador aplica cotas fixas e um ranking determinístico de legibilidade, qualidade da justificativa e diversidade lexical. As justificativas originalmente escritas em português são preservadas. Para as fontes cuja justificativa está em inglês, a interface mostra uma síntese portuguesa baseada no rótulo e nos termos destacados, mantendo o texto original recolhido para auditoria. As 203 respostas `ERROR` por falha técnica são contabilizadas, mas não apresentadas como anotações científicas válidas.

Para reproduzir o artefato web:

```bash
python3 scripts/export_annotations.py \
  --input ../pln/datasets/combined_dataset.csv
```

Veja [MODEL_CARD.md](MODEL_CARD.md) para classes, métricas, paridade e limitações.

## Reproduzir o ONNX

```bash
python -m venv .venv-export
.venv-export/bin/pip install -r scripts/requirements-export.txt
.venv-export/bin/python scripts/export_model.py
.venv-export/bin/python scripts/verify_model.py \
  --dataset ../pln/datasets/combined_dataset.csv
```

A quantização INT8 foi rejeitada porque alterou previsões do checkpoint. Ela não é distribuída.

## GitHub Pages

O Vite usa base `/pln-demo/`. O workflow em `.github/workflows/deploy-pages.yml` testa, compila e publica `frontend/dist` com GitHub Actions.

URL esperada: https://erlonl.github.io/pln-demo/

## Pesquisa

- Repositório de pesquisa: https://github.com/kamilyassis/pln
- Repositório da demo: https://github.com/erlonL/pln-demo
- Modelo-base: https://huggingface.co/prajjwal1/bert-tiny

O PDF do artigo não é redistribuído por esta aplicação.
