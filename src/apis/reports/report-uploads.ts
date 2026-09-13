import {
  REPORT_IMAGE_UPLOAD_ERROR_MESSAGE,
  type CompressedReportImage,
} from "@/features/reports/report-image";
import { z } from "zod";

const prepareReportUploadsResponseSchema = z.object({
  uploads: z.array(
    z.object({
      objectKey: z.string().min(1),
      uploadUrl: z.url(),
      requiredHeaders: z.record(z.string(), z.string()),
      expiresInSeconds: z.number().positive(),
    }),
  ),
});

export async function uploadReportImages(
  images: readonly CompressedReportImage[],
): Promise<string[]> {
  if (images.length === 0) {
    return [];
  }

  const response = await fetch("/api/reports/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: images.map((image) => ({ byteSize: image.byteSize })),
    }),
  });

  if (!response.ok) {
    throw new Error(REPORT_IMAGE_UPLOAD_ERROR_MESSAGE);
  }

  const parsed = prepareReportUploadsResponseSchema.safeParse(
    await response.json(),
  );

  if (!parsed.success) {
    throw new Error(REPORT_IMAGE_UPLOAD_ERROR_MESSAGE);
  }

  const { uploads } = parsed.data;

  if (uploads.length !== images.length) {
    throw new Error(REPORT_IMAGE_UPLOAD_ERROR_MESSAGE);
  }

  await Promise.all(
    uploads.map(async (upload, index) => {
      const image = images[index];
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: upload.requiredHeaders,
        body: image.blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(REPORT_IMAGE_UPLOAD_ERROR_MESSAGE);
      }
    }),
  );

  return uploads.map((upload) => upload.objectKey);
}
