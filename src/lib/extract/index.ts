/**
 * Orquestrador da extração da ficha de parto — 100% no navegador, sem IA.
 *   1) tenta texto selecionável (pdf.js);
 *   2) se vier pouco texto, rasteriza e roda Tesseract.js (OCR);
 *   3) parser regex preenche os campos do formulário.
 */

import { extractTextLayer, rasterizePages, fileToArrayBuffer } from "@/lib/extract/pdf";
import { ocrCanvases } from "@/lib/extract/ocr";
import { parseFicha, type FichaParse } from "@/lib/extract/parse-ficha";

const MIN_TEXT_CHARS = 160; // abaixo disso, tratamos como PDF imagem

export type ExtractStage =
  | { stage: "lendo-pdf" }
  | { stage: "texto-ok" }
  | { stage: "ocr"; progress: number; status: string }
  | { stage: "parseando" }
  | { stage: "pronto"; usouOcr: boolean };

export interface ExtractResult extends FichaParse {
  usouOcr: boolean;
}

export async function extrairFicha(
  file: File,
  onStage?: (s: ExtractStage) => void,
): Promise<ExtractResult> {
  onStage?.({ stage: "lendo-pdf" });
  const buf = await fileToArrayBuffer(file);

  let texto = await extractTextLayer(buf);
  let usouOcr = false;

  if (texto.replace(/\s/g, "").length < MIN_TEXT_CHARS) {
    usouOcr = true;
    const canvases = await rasterizePages(buf);
    texto = await ocrCanvases(canvases, (info) =>
      onStage?.({ stage: "ocr", progress: info.progress, status: info.status }),
    );
  } else {
    onStage?.({ stage: "texto-ok" });
  }

  onStage?.({ stage: "parseando" });
  const parsed = parseFicha(texto);
  onStage?.({ stage: "pronto", usouOcr });
  return { ...parsed, usouOcr };
}
