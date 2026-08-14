# BERT-Tiny — Técnicas de persuasão em português

## Modelo demonstrado

O site usa o checkpoint em `backend/modelo3`, selecionado pelo commit `4f0ae3a` como modelo ativo da API original. O arquivo `model.safetensors` tem 17.552.400 bytes e SHA-256 `a5ce082ed1aa2c61def5c5d8f36b907e6c72e2b8cb217493b9c11487add7607b`.

Arquitetura: BERT para classificação de sequência, 2 camadas, dimensão escondida 128, 2 cabeças de atenção, vocabulário 30.522 e limite de 512 tokens. A tarefa é multiclasse e sempre retorna exatamente uma das oito classes.

## Classes

`No_Label`, `Loaded_Language`, `Name_Calling-Labeling`, `Doubt`, `Repetition`, `Appeal_to_Fear-Prejudice`, `Flag_Waving` e `Exaggeration-Minimisation`.

A interface apresenta, respectivamente: Neutro, Palavras fortes, Imposição, Descredibilidade, Repetição, Apelo ao medo, Apelo patriótico e Exagero ou minimização.

## Conversão para o navegador

O checkpoint é exportado como ONNX FP32, opset 17. O artefato implantado tem 17.591.749 bytes e SHA-256 `7118dbdb237580e5ac32f1553c142c90467a9af6e4723a09657f12c727f2e2da`. Tokenizer e configuração levam o download total a 18.305.019 bytes.

Um ensaio de quantização dinâmica INT8 reduziu o modelo a aproximadamente 4,49 MB, mas mudou 14 de 1.024 previsões na melhor configuração (98,63% de paridade). Por isso a versão quantizada não é distribuída: fidelidade ao modelo de pesquisa tem prioridade.

O FP32 ONNX apresentou 100% de paridade top-1 em uma amostra determinística de 1.024 sentenças do conjunto combinado. Nessa verificação, o maior erro absoluto de logits foi `1,4782e-5`, o erro médio foi `7,9372e-7` e a maior diferença de probabilidade foi `3,3975e-6`. `scripts/verify_model.py` aplica o gate formal de 100% de paridade e erro máximo de `1e-4`.

## Dados e resultados reportados

O artigo descreve 19.581 sentenças, rotuladas automaticamente com GPT-4.1-nano a partir de Conexão Política, FakeTrueBr e G1 Fato ou Fake. SemEval23-T3 foi usada como referência para o esquema de persuasão. O artigo reporta 86% de acurácia no conjunto de teste.

O explorador web publica uma seleção de 100 exemplos do snapshot `combined_dataset.csv`, escolhidos entre 17.499 anotações válidas. A curadoria equilibra as oito classes, preserva as três fontes e ranqueia legibilidade, qualidade da justificativa e diversidade lexical por um procedimento determinístico. O corpus completo não é distribuído pelo site. Outras 203 linhas contêm respostas técnicas `ERROR` por limite de requisições e não são tratadas como rótulos válidos. `scripts/export_annotations.py` valida e regenera o artefato público.

## Limitações

- As anotações automáticas ainda não receberam validação humana sistemática.
- A classe neutra obteve F1 0,57 e palavras fortes F1 0,60 no artigo.
- Classes semanticamente próximas se confundem.
- A classificação por sentença perde contexto entre trechos, especialmente para repetição.
- Uma probabilidade softmax não é uma confiança calibrada.
- O modelo não determina veracidade, intenção, viés global ou impacto psicológico.
- Sentenças acima de 512 tokens são truncadas e sinalizadas na interface.

## Licenciamento

O modelo-base `prajjwal1/bert-tiny` é publicado sob MIT. Este repositório não declara uma nova licença para o checkpoint ajustado ou para o software. Consulte `THIRD_PARTY_NOTICES.md`.
