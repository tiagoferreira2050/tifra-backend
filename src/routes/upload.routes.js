import { Router } from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

const router = Router();

// multer em memória
const upload = multer({
  storage: multer.memoryStorage(),
});

/* ===================================================
   POST /upload
=================================================== */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !preset) {
      return res.status(500).json({
        error: "Cloudinary não configurado",
      });
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append("upload_preset", preset);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const json = await uploadResponse.json();

    if (!uploadResponse.ok) {
      console.error("Cloudinary error:", json);
      return res.status(500).json({
        error: "Falha no upload",
        details: json,
      });
    }

    return res.json({
      url: json.secure_url,
    });

  } catch (err) {
    console.error("Erro no /upload:", err);
    return res.status(500).json({
      error: "Erro interno no servidor",
    });
  }
});

export default router;
