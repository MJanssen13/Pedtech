/**
 * OCR no navegador via Tesseract.js (idioma português).
 * A imagem nunca sai do dispositivo; apenas o modelo treinado é baixado.
 */

export type OcrProgress = (info: { status: string; progress: number }) => void;

/** Reconhece texto de uma lista de canvases, concatenando o resultado. */
export async function ocrCanvases(
  canvases: HTMLCanvasElement[],
  onProgress?: OcrProgress,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", 1, {
    logger: onProgress
      ? (m: { status: string; progress: number }) =>
          onProgress({ status: m.status, progress: m.progress })
      : undefined,
  });
  try {
    const partes: string[] = [];
    for (const canvas of canvases) {
      const { data } = await worker.recognize(canvas);
      partes.push(data.text);
    }
    return partes.join("\n");
  } finally {
    await worker.terminate();
  }
}
