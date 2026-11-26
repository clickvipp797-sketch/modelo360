export interface WatermarkOptions {
  brandText?: string;
  codeText?: string;
  quality?: number;
  opacity?: number;
}

export async function applyWatermarkToFile(
  file: File,
  options: WatermarkOptions = {}
): Promise<File> {
  const {
    brandText = "MODEL360",
    codeText = "",
    quality = 0.88,
    opacity = 0.08,
  } = options;

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Falha ao carregar imagem para marca d'água"));
      el.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Contexto 2D indisponível");
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Marca d'água repetida suave
    const baseSize = Math.max(13, Math.round(Math.min(canvas.width, canvas.height) * 0.022));
    const label = codeText ? `${brandText} · ${codeText}` : brandText;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `700 ${baseSize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.rotate((-28 * Math.PI) / 180);

    const stepX = Math.max(240, Math.round(baseSize * 13));
    const stepY = Math.max(165, Math.round(baseSize * 9));
    const diagonal = Math.hypot(canvas.width, canvas.height);

    for (let y = -diagonal; y < diagonal; y += stepY) {
      for (let x = -diagonal; x < diagonal; x += stepX) {
        ctx.fillText(label, x, y);
      }
    }
    ctx.restore();

    // Etiqueta discreta no canto inferior direito
    if (codeText) {
      const tagSize = Math.max(11, Math.round(Math.min(canvas.width, canvas.height) * 0.017));
      const padX = Math.round(tagSize * 0.65);
      const padY = Math.round(tagSize * 0.4);
      const margin = Math.round(tagSize * 0.85);

      ctx.save();
      ctx.font = `700 ${tagSize}px sans-serif`;
      const textWidth = ctx.measureText(codeText).width;
      const boxW = textWidth + padX * 2;
      const boxH = tagSize + padY * 2;
      const boxX = canvas.width - boxW - margin;
      const boxY = canvas.height - boxH - margin;

      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#09090b";
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.globalAlpha = 0.65;
      ctx.fillStyle = "#f4f4f5";
      ctx.fillText(codeText, boxX + padX, boxY + boxH / 2 + 1);
      ctx.restore();
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Falha ao gerar o arquivo final"));
        },
        mimeType,
        quality
      );
    });

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const extension = mimeType === "image/png" ? "png" : "jpg";

    return new File([blob], `${cleanName}-m360.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}