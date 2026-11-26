export interface WatermarkOptions {
  brandText?: string;
  codeText?: string;
  quality?: number;
}

export async function applyWatermarkToFile(
  file: File,
  options: WatermarkOptions = {}
): Promise<File> {
  const brandText = options.brandText ?? "MODEL360";
  const codeText = options.codeText ?? "";
  const quality = options.quality ?? 0.88;

  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Falha ao carregar a imagem."));
      image.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Não foi possível inicializar o canvas.");
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const baseSize = Math.max(18, Math.round(canvas.width * 0.032));
    const codeSize = Math.max(14, Math.round(canvas.width * 0.024));

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const stepX = Math.max(220, Math.round(canvas.width / 3));
    const stepY = Math.max(180, Math.round(canvas.height / 3));

    ctx.rotate((-24 * Math.PI) / 180);

    for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
      for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
        ctx.font = `700 ${baseSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
        ctx.lineWidth = Math.max(2, Math.round(baseSize * 0.08));

        ctx.strokeText(brandText, x, y);
        ctx.fillText(brandText, x, y);

        if (codeText) {
          ctx.font = `600 ${codeSize}px monospace`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.26)";
          ctx.fillText(codeText, x, y + baseSize * 0.95);
        }
      }
    }

    ctx.restore();

    if (codeText) {
      const badgeFontSize = Math.max(15, Math.round(canvas.width * 0.025));
      ctx.font = `700 ${badgeFontSize}px monospace`;

      const label = `${brandText} • ${codeText}`;
      const metrics = ctx.measureText(label);
      const padX = Math.round(badgeFontSize * 0.7);
      const boxWidth = Math.ceil(metrics.width + padX * 2);
      const boxHeight = Math.round(badgeFontSize * 1.8);
      const margin = Math.max(24, Math.round(canvas.height * 0.06));
      const boxX = canvas.width - boxWidth - margin;
      const boxY = canvas.height - boxHeight - margin;

      ctx.fillStyle = "rgba(9, 9, 11, 0.68)";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, boxX + padX, boxY + boxHeight / 2 + 1);
    }

    const mimeType =
      file.type === "image/png" || file.type === "image/webp"
        ? file.type
        : "image/jpeg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Falha ao gerar o arquivo final."));
        },
        mimeType,
        quality
      );
    });

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";

    return new File([blob], `${cleanName}-m360.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}