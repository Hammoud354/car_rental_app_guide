import html2canvas from "html2canvas";

/**
 * Generate a thumbnail image from an HTML element
 * @param element - HTML element to capture
 * @param maxWidth - Maximum width of thumbnail (default: 300px)
 * @param maxHeight - Maximum height of thumbnail (default: 400px)
 * @returns Base64 encoded image data URL
 */
export async function generateThumbnail(
  element: HTMLElement,
  maxWidth: number = 300,
  maxHeight: number = 400
): Promise<string> {
  // Capture the element as canvas
  const canvas = await html2canvas(element, {
    scale: 1, // Lower scale for thumbnail
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Calculate aspect ratio
  const aspectRatio = canvas.width / canvas.height;
  let thumbnailWidth = maxWidth;
  let thumbnailHeight = maxHeight;

  if (aspectRatio > maxWidth / maxHeight) {
    // Width is the limiting factor
    thumbnailHeight = Math.round(maxWidth / aspectRatio);
  } else {
    // Height is the limiting factor
    thumbnailWidth = Math.round(maxHeight * aspectRatio);
  }

  // Create a new canvas for the thumbnail
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = thumbnailWidth;
  thumbnailCanvas.height = thumbnailHeight;

  const ctx = thumbnailCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw the original canvas scaled down to thumbnail size
  ctx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);

  // Convert to base64
  return thumbnailCanvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Note: Upload functionality should be called from the component using trpc.whatsappTemplates.uploadThumbnail.mutateAsync()
 * This keeps the upload logic in the tRPC layer where it belongs.
 * 
 * Example usage in component:
 * ```
 * const uploadThumbnail = trpc.whatsappTemplates.uploadThumbnail.useMutation();
 * const thumbnailDataUrl = await generateThumbnail(element);
 * const result = await uploadThumbnail.mutateAsync({
 *   thumbnailData: thumbnailDataUrl,
 *   filename: 'contract-thumbnail.jpg'
 * });
 * console.log(result.url);
 * ```
 */
