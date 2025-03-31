const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const sharp = require("sharp");
const { exec } = require("child_process");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // Enable JSON parsing in requests
app.use(express.static("public"));

// Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});
const upload = multer({ storage });

// ✅ Function to compress images (JPEG/PNG)
async function compressImage(filePath) {
    const ext = path.extname(filePath);
    const compressedPath = filePath.replace(ext, `_compressed${ext}`);

    await sharp(filePath)
        .jpeg({ quality: 60 }) // ✅ Lower quality to 60% for better compression
        .toFile(compressedPath);

    return compressedPath;
}

// ✅ Function to compress videos (MP4)
async function compressVideo(filePath) {
    return new Promise((resolve, reject) => {
        const ext = path.extname(filePath);
        const compressedPath = filePath.replace(ext, `_compressed${ext}`);

        const command = `ffmpeg -i "${filePath}" -vcodec libx264 -crf 30 "${compressedPath}"`;

        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(compressedPath);
            }
        });
    });
}

// ✅ Function to upload file to Telegram
async function uploadToTelegram(filePath, originalName, botToken, chatId) {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("document", fs.createReadStream(filePath), originalName);

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${botToken}/sendDocument`,
            formData,
            { headers: formData.getHeaders() }
        );

        if (!response.data.ok) throw new Error(`Telegram error: ${JSON.stringify(response.data)}`);
        return response.data.result.document.file_id;
    } catch (error) {
        throw new Error("Upload to Telegram failed");
    }
}

// ✅ Function to delete files in a single transaction
function deleteFiles(files) {
    files.forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
    });
}

// ✅ File upload route
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileExt = path.extname(originalName).toLowerCase();

    try {
        // ✅ Receive botToken and chatId from the frontend (Base64 encoded)
        const botToken = Buffer.from(req.body.botToken, "base64").toString("utf-8");
        const chatId = Buffer.from(req.body.chatId, "base64").toString("utf-8");

        if (!botToken || !chatId) return res.status(400).json({ error: "Invalid bot token or chat ID" });

        let compressedPath = filePath;
        if ([".jpg", ".jpeg", ".png"].includes(fileExt)) {
            compressedPath = await compressImage(filePath);
        } else if ([".mp4", ".mkv", ".avi"].includes(fileExt)) {
            compressedPath = await compressVideo(filePath);
        }

        const fileId = await uploadToTelegram(compressedPath, originalName, botToken, chatId);
        deleteFiles([filePath, compressedPath]);

        res.json({ fileId, message: "✅ File uploaded successfully!" });
    } catch (error) {
        deleteFiles([filePath]);
        res.status(500).json({ error: "Failed to upload file to Telegram" });
    }
});

// ✅ Get fresh file URL by file ID
app.get("/getFileUrl", async (req, res) => {
    try {
        const fileId = req.query.fileId;
        const botToken = Buffer.from(req.query.botToken, "base64").toString("utf-8");

        if (!botToken || !fileId) return res.status(400).json({ error: "Invalid bot token or file ID" });

        const response = await axios.get(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
        );

        if (!response.data.ok) throw new Error("Failed to get file URL");

        const filePath = response.data.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        res.json({ fileUrl });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve file URL" });
    }
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
