/**
 * Leitura de PDF no navegador via pdf.js.
 * - extractTextLayer: texto selecionável (quando o PDF tem camada de texto).
 * - rasterizePages: rende riza as páginas em <canvas> para OCR (PDF imagem).
 *
 * pdf.js é importado dinamicamente para nunca rodar no SSR.
 */

type PdfjsModule = typeof import("pdfjs-dist");
let _pdfjs: PdfjsModule | null = null;

async function getPdfjs(): Promise<PdfjsModule> {
  if (!_pdfjs) {
    const mod = await import("pdfjs-dist");
    mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    _pdfjs = mod;
  }
  return _pdfjs;
}

/** Texto selecionável de todas as páginas (string vazia se for imagem). */
export async function extractTextLayer(data: ArrayBuffer): Promise<string> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({ data: data.slice(0) });
  const doc = await task.promise;
  const partes: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const linha = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    partes.push(linha);
  }
  await task.destroy();
  return partes.join("\n").replace(/[ \t]+/g, " ").trim();
}

/** Binariza o canvas (cinza + limiar) — melhora muito o OCR de formulários. */
function binarize(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = g < 165 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Rasteriza cada página em um canvas (para OCR). Escala 4 + binarização recupera
 * linhas densas da ficha (peso/data) que se perdem em escalas menores.
 */
export async function rasterizePages(
  data: ArrayBuffer,
  scale = 4,
): Promise<HTMLCanvasElement[]> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({ data: data.slice(0) });
  const doc = await task.promise;
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const canvasContext = canvas.getContext("2d", { willReadFrequently: true })!;
    // Fundo branco ajuda o OCR.
    canvasContext.fillStyle = "#ffffff";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext, viewport, canvas } as never).promise;
    binarize(canvasContext, canvas.width, canvas.height);
    canvases.push(canvas);
  }
  await task.destroy();
  return canvases;
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
