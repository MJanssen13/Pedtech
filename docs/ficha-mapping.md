# Mapeamento: Ficha de Sala de Parto → Evolução AC

Fonte: **FOLHA DE SALA DE PARTO DO RECÉM-NASCIDO** (HC-UFTM / EBSERH).
Layout fixo (template). Os PDFs de exemplo recebidos são **imagens** (sem camada de
texto) → exigem OCR/visão. PDFs exportados do sistema podem ter texto selecionável →
parsing direto por âncoras de rótulo.

> Toda informação extraída é **revisável e editável** pelo usuário antes de salvar.
> O arquivo-fonte **não é persistido**.

## Cabeçalho
| Campo na ficha | Campo no app | Observação |
|---|---|---|
| RN de: `<nome>` | `mae.nome` | nome da mãe |
| Nome do bebê: | `rn.nome` | às vezes vazio |
| Prontuário / RG da mãe: | `mae.rg` | |
| Residência atual: | `procedencia` | |

## História Materna
| Ficha | App | Observação |
|---|---|---|
| Idade: `23 anos` | `mae.idade` | |
| G / P / A | `paridade` (parcial) | combinar com tipo de parto p/ G_C_/G_N_ |
| GS: `B` / Rh: `POS` | `tipagem.maeABO`, `tipagem.maeRh` | |
| Coombs indireto: `NEG` | `tipagem.coombsIndireto` (CI) | |
| IG: `__ semanas (DUM __/__/__)` | `ig.dum`, `ig.dumData` | frequentemente em branco |
| IG: `38 semanas e 4 dias (US com 13 semanas e 3 dias realizado em 16/12/2025)` | `ig.usgSemanas`, `ig.usgDias`, `ig.usgRefSemanas`, `ig.usgRefData` | recalcular IG atual a partir da data do US + IG no US |
| Consultas: `4` | `prenatal.consultas` | |

## Sorologias (tabela: Data, VDRL, Anti-HIV, Toxoplasmose, Hep B, Hep C, Rubéola, CMV, HTLV)
- Várias linhas datadas → `sorologiasMaternas` (texto, uma linha por data).
- Linhas livres relevantes: `Tratamento sífilis`, `Sorologias na admissão`,
  `Diagnóstico HIV`. Bloco "QUADRO DO CMV" quando presente → anexar ao texto.

## Risco infeccioso
| Ficha | App | Observação |
|---|---|---|
| PESQUISA DE ESTREPTOCOCO DO GRUPO B: `( ) neg ( ) pos (X) não realizada` | `gbs` | |
| Profilaxia por: ` ` com: ` ` início `__/__ às __:__` | `profilaxia.medicamento`, `profilaxia.data`, `profilaxia.hora` | "Não se aplica" quando ausente |
| Rotura de bolsa às `<data hora>`, Tempo de BR `NO ATO` / `> 18h` | `bolsaRota.dataHora`, `tempoBR` | |
| INFECÇÃO INTRA-AMNIÓTICA (critérios) | nota livre | |
| CORTICOIDE / SULFATO Mg | nota livre | |

## Dados do nascimento
| Ficha | App | Observação |
|---|---|---|
| Data: `10/06/2026` | `dn` | |
| Hora: `04:28` | `hn` | |
| PN: `3175` (percentile) | `nascimento.pesoG` | percentil é **recalculado** por Intergrowth |
| PC: `__` | `nascimento.pcCm` | quando vazio na ficha, pegar do exame |
| C: `__` | `nascimento.comprimentoCm` | idem |
| Parto vaginal (X)não / Cesárea (X), Indicação: `OLIGOAMNIO...` | `nascimento.via` = cesarea/vaginal, `nascimento.indicacaoCesarea` | |
| Cordão umbilical: `2A1V` | `nascimento.cordao` | nota |
| Clampeamento: imediato / 30-60s / >=60s | `nascimento.clampeamento` | |
| Líquido amniótico: `CLARO` / `LAM ESPESSO+2/+4` | `nascimento.liquido` | |
| Apresentação: `CEFÁLICA` | `nascimento.apresentacao` | |
| Descrição da sala de parto: `<texto>` | `nascimento.descricao` | → "Evolução do Nascimento" |
| APGAR 1º/5º min (tabela com FC MR COR TÔN RS) | `apgar[]` = [{tempo:1,valor},{tempo:5,valor}] | somar colunas se vier detalhado |
| EXAME SUMÁRIO: Genitália `fem/masc`; Eliminações `mecônio/diurese`; Outros: `<exame>` | `rn.sexo`, exame físico inicial | sexo define genitália no exame |
| Tax bebê: `36.4` | `nascimento.tempC` | |

## Diagnósticos / Evolução / Encaminhamento
| Ficha | App |
|---|---|
| DIAGNÓSTICOS: `RNT+AIG+PC+SEXO MASCULINO` | `diagnosticos` |
| EVOLUÇÃO: `PRESCRITA` / texto de rotina | nota |
| (X) coletado grupo sg, Rh, CD | `tipagem.rnSolicitado = true` |
| Encaminhado ao: (X) Alojamento Conjunto | confirma unidade = AC |

## Campos do modelo SEM origem na ficha (entrada manual / evolução anterior)
- Leito, Paridade final (pós-parto), Horas de vida (calculado), Peso atual e série,
  Glucotestes do dia, Testes de triagem, Vacinação (status), Fototerapia, Bilirrubinas,
  Exames complementares, Condutas, Evolução clínica do dia.

## Estratégia de extração (SEM IA — 100% no dispositivo)
1. **PDF com texto selecionável** → `pdf.js` extrai o texto → **parser por âncoras
   de rótulo (regex)**.
2. **PDF imagem/scan** (caso dos exemplos) → `pdf.js` rasteriza a página em canvas →
   **Tesseract.js** (idioma `por`) gera o texto → mesmo **parser regex**.
3. Validar com `zod`, preencher o formulário, **usuário confere tudo**, então salvar
   apenas os campos (nunca o arquivo).

Como o layout da FOLHA DE SALA DE PARTO é fixo, o parser ancora nos rótulos
(`RN de:`, `Nome do bebê:`, `PN (g):`, `Apgar`, `Rotura de bolsa às`, `DIAGNÓSTICOS`,
etc.) e usa regex tolerante a ruído de OCR. Nenhum dado do paciente sai do navegador.
