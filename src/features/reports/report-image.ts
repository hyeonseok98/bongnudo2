import { MAX_REPORT_IMAGE_COUNT } from "./report-validation";

export const MAX_REPORT_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_REPORT_IMAGE_EDGE = 2560;
export const REPORT_IMAGE_WEBP_QUALITY = 0.82;
export const REPORT_IMAGE_MIME_TYPE = "image/webp";

const ALLOWED_REPORT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  REPORT_IMAGE_MIME_TYPE,
]);

interface ReportImageFileMetadata {
  size: number;
  type: string;
}

export interface CompressedReportImage {
  blob: Blob;
  mimeType: typeof REPORT_IMAGE_MIME_TYPE;
  width: number;
  height: number;
  byteSize: number;
}

export function validateReportImageFiles(
  files: readonly ReportImageFileMetadata[],
): void {
  if (files.length > MAX_REPORT_IMAGE_COUNT) {
    throw new Error("이미지는 최대 3장까지 등록할 수 있습니다.");
  }

  for (const file of files) {
    if (!ALLOWED_REPORT_IMAGE_TYPES.has(file.type)) {
      throw new Error("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
    }

    if (file.size <= 0 || file.size > MAX_REPORT_IMAGE_BYTES) {
      throw new Error("이미지는 파일당 10MB 이하로 등록해주세요.");
    }
  }
}

export function getReportImageDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  const longestEdge = Math.max(width, height);

  if (longestEdge <= MAX_REPORT_IMAGE_EDGE) {
    return { width, height };
  }

  const scale = MAX_REPORT_IMAGE_EDGE / longestEdge;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function compressReportImage(
  file: File,
): Promise<CompressedReportImage> {
  validateReportImageFiles([file]);

  let image: ImageBitmap | null = null;

  try {
    image = await createImageBitmap(file);
    const dimensions = getReportImageDimensions(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas context is unavailable");
    }

    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    const blob = await canvasToWebp(canvas);

    return {
      blob,
      mimeType: REPORT_IMAGE_MIME_TYPE,
      width: dimensions.width,
      height: dimensions.height,
      byteSize: blob.size,
    };
  } catch {
    throw new Error("이미지를 처리하지 못했습니다.");
  } finally {
    image?.close();
  }
}

export async function compressReportImages(
  files: readonly File[],
): Promise<CompressedReportImage[]> {
  validateReportImageFiles(files);
  return Promise.all(files.map((file) => compressReportImage(file)));
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("WebP conversion failed"));
        }
      },
      REPORT_IMAGE_MIME_TYPE,
      REPORT_IMAGE_WEBP_QUALITY,
    );
  });
}
