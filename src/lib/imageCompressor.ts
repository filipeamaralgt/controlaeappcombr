/**
 * Compress an image file to max dimensions and target size.
 * Returns a compressed File ready for upload.
 */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  targetSizeKB = 300,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until under target size
      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            // If still too large and quality can decrease, try again
            if (blob.size > targetSizeKB * 1024 && quality > 0.3) {
              tryCompress(quality - 0.1);
              return;
            }
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"),
              { type: "image/jpeg" },
            );
            resolve(compressed);
          },
          "image/jpeg",
          quality,
        );
      };

      tryCompress(0.8);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // If compression fails, return original
      resolve(file);
    };

    img.src = url;
  });
}
