import { Router, type IRouter, type Response } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import {
  savePropertyImage,
  deletePropertyImage,
  propertyImageExists,
  getImageFilePath,
  isAllowedImageType,
  getMaxImageSize,
} from "../lib/propertyImageStorage";
import { createReadStream } from "fs";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMaxImageSize() },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF`));
    }
  },
});

/**
 * POST /admin/property-images/upload
 * Upload a property image. Returns the relative path to store in the database.
 */
router.post("/admin/property-images/upload", requireAdmin, upload.single("image"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  try {
    const { filename } = await savePropertyImage(file.buffer, file.originalname);
    const imageUrl = `/uploads/property-images/${filename}`;
    res.json({ url: imageUrl, filename, size: file.size, type: file.mimetype });
  } catch (err: any) {
    console.error("[PropertyImage] Upload error:", err);
    res.status(500).json({ error: "Upload failed: " + (err.message ?? "Unknown error") });
  }
});

/**
 * DELETE /admin/property-images/:filename
 * Delete a property image by filename.
 */
router.delete("/admin/property-images/:filename", requireAdmin, async (req, res): Promise<void> => {
  const filename = req.params.filename as string;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  try {
    await deletePropertyImage(filename);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Delete failed: " + err.message });
  }
});

/**
 * GET /uploads/property-images/:filename
 * Public endpoint to serve uploaded property images.
 */
router.get("/uploads/property-images/:filename", async (req, res): Promise<void> => {
  const filename = req.params.filename as string;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  try {
    const exists = await propertyImageExists(filename);
    if (!exists) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    const filePath = getImageFilePath(filename);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      webp: "image/webp", gif: "image/gif",
    };

    res.setHeader("Content-Type", contentTypes[ext] ?? "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("[PropertyImage] Stream error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Read error" });
    });
    stream.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to serve image" });
  }
});

export default router;
