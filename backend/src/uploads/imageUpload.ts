// src/uploads/.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Carpeta temporal
const tempDir = path.join(__dirname, '../../temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `img-${unique}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
