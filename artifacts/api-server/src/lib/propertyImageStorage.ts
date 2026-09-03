import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Store property images alongside the APK storage area
const IMAGE_STORAGE_DIR = path.resolve(process.cwd(), "../../storage/property-images");

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function ensureImageDir(): Promise<string> {
  await fs.mkdir(IMAGE_STORAGE_DIR, { recursive: true });
  return IMAGE_STORAGE_DIR;
}

export function getImageFilePath(filename: string): string {
  return path.join(IMAGE_STORAGE_DIR, filename);
}

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_TYPES.has(mimeType);
}

export function getMaxImageSize(): number {
  return MAX_SIZE;
}

export function generateImageFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
  return `${randomUUID()}${safeExt}`;
}

export async function savePropertyImage(buffer: Buffer, originalName: string): Promise<{ filename: string; filePath: string }> {
  await ensureImageDir();
  const filename = generateImageFilename(originalName);
  const filePath = getImageFilePath(filename);
  await fs.writeFile(filePath, buffer);
  // Verify write
  const stat = await fs.stat(filePath);
  if (stat.size !== buffer.length) {
    throw new Error(`Write verification failed: expected ${buffer.length} bytes, got ${stat.size}`);
  }
  return { filename, filePath };
}

export async function deletePropertyImage(filename: string): Promise<void> {
  try {
    await fs.unlink(getImageFilePath(filename));
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
  }
}

export async function propertyImageExists(filename: string): Promise<boolean> {
  try {
    await fs.access(getImageFilePath(filename));
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a stored image path/URL to a servable path.
 * Handles both uploaded images (/uploads/property-images/xxx.jpg) and external URLs.
 */
export function resolveImageUrl(imageRef: string): string {
  if (!imageRef) return imageRef;
  // Already an external URL — return as-is
  if (imageRef.startsWith("http://") || imageRef.startsWith("https://")) return imageRef;
  // Already a relative path to our uploads — return as-is
  if (imageRef.startsWith("/uploads/")) return imageRef;
  // Bare filename — prefix with our upload path
  return `/uploads/property-images/${imageRef}`;
}
