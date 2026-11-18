
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const app = express();
const PORT = 4000;

// Configurações básicas
app.use(cors({
  origin: "http://localhost:3001"
}));

app.use(express.json());

// Pasta de armazenamento
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Formatos permitidos
const allowedExtensions = [".mp4", ".mov", ".mkv", ".webm"];

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${extension}`;

    callback(null, uniqueName);
  }
});

// Configuração do upload
const upload = multer({
  storage,

  limits: {
    fileSize: 500 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return callback(
        new Error("Formato não permitido. Use MP4, MOV, MKV ou WebM.")
      );
    }

    callback(null, true);
  }
});

// Rota inicial
app.get("/", (req, res) => {
  res.json({
    message: "API do Cortes IA funcionando!"
  });
});

// Verificar saúde da API
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "Cortes IA API"
  });
});

// Receber vídeo
app.post("/api/videos/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Nenhum vídeo foi enviado."
    });
  }

  res.status(201).json({
    success: true,
    message: "Vídeo recebido com sucesso!",
    video: {
      id: path.parse(req.file.filename).name,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
});

// Tratamento de erros
app.use((error, req, res, next) => {
  console.error(error.message);

  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    return res.status(status).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "O vídeo ultrapassa o limite de 500 MB."
          : error.message
    });
  }

  res.status(400).json({
    error: error.message || "Erro ao processar solicitação."
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Cortes IA API rodando em http://localhost:${PORT}`);
});
