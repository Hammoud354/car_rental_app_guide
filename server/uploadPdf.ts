import { storagePut } from "./storage";

/**
 * Upload PDF buffer to S3 and return public URL
 */
export async function uploadPdfToS3(
  pdfBuffer: Buffer,
  filename: string,
  userId: number
): Promise<{ url: string; key: string }> {
  // Generate unique filename with timestamp and random suffix
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileKey = `contracts/${userId}/${timestamp}-${randomSuffix}-${filename}`;
  
  // Upload to S3
  const result = await storagePut(fileKey, pdfBuffer, "application/pdf");
  
  return {
    url: result.url,
    key: fileKey,
  };
}
