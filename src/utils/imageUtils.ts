/**
 * Client-side utility for lightweight photo compression before storage or multimodal AI triage.
 * Uses native HTML5 Canvas to bound dimensions to max 1280px and JPEG 0.82 quality.
 * Prevents oversized 10-15MB base64 payloads from triggering network bottlenecks and 504 DEADLINE_EXCEEDED.
 */
export interface ProcessedMediaFile {
  name: string;
  url: string;
  size: number;
}

export const compressImageFile = (
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<ProcessedMediaFile> => {
  return new Promise((resolve) => {
    // If not an image, read standard data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          url: (e.target?.result as string) || '',
          size: file.size,
        });
      };
      reader.onerror = () => {
        resolve({
          name: file.name,
          url: '',
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ name: file.name, url: rawUrl, size: file.size });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          // Approximate binary byte size from base64 length
          const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);

          resolve({
            name: file.name,
            url: compressedDataUrl,
            size: approxBytes,
          });
        } catch {
          resolve({ name: file.name, url: rawUrl, size: file.size });
        }
      };

      img.onerror = () => {
        resolve({ name: file.name, url: rawUrl, size: file.size });
      };

      img.src = rawUrl;
    };

    reader.onerror = () => {
      resolve({ name: file.name, url: '', size: file.size });
    };

    reader.readAsDataURL(file);
  });
};
