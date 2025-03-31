# File Upload with Telegram Bot CDN

This project provides a simple way to upload files to a Telegram bot and retrieve their URLs for sharing. It includes a front-end UI for selecting and uploading files, as well as a back-end server that handles file compression and uploading to Telegram.

## Features

- Secure bot authentication using AES encryption.
- File upload with a progress bar.
- Supports image compression (JPEG/PNG) and video compression (MP4/MKV/AVI).
- Uploads files directly to a Telegram bot.
- Generates a sharable URL for uploaded files.
- Uses Express.js and Multer for file handling.

## Prerequisites

- Node.js (v14 or higher)
- Yarn (preferred) or npm
- A Telegram bot token (created via @BotFather on Telegram)
- A Telegram chat ID where files will be uploaded

## Installation

### Backend Setup

1. Clone this repository:
   ```sh
   git clone https://github.com/yourusername/file-upload-telegram.git
   cd file-upload-telegram
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```
3. Start the server:
   ```sh
   yarn start
   ```
   The server runs on `http://localhost:5000`.

### Frontend Usage

1. Open `index.html` in a browser.
2. Enter your **Telegram Bot Token** and **Chat ID**.
3. Select a file and click **Upload**.
4. Once uploaded, a shareable link will be generated.

## How It Works

### Frontend (index.html)
- Users enter their **bot token** and **chat ID**, which are encrypted and stored in `sessionStorage`.
- A file is selected and uploaded via an AJAX request to the backend.
- The upload progress is displayed using a progress bar.
- Once uploaded, the backend returns a **file ID** which is used to generate a public file URL.

### Backend (index.js)
- Uses `multer` to handle file uploads.
- Compresses images using **Sharp** and videos using **FFmpeg**.
- Uploads the processed file to Telegram using `axios`.
- Returns the **file ID** to the frontend.
- Provides an endpoint to retrieve the file's direct URL from Telegram.

## API Endpoints

### 1. **Upload File**
   **POST** `/upload`
   - Request:
     ```sh
     FormData: { file, botToken (Base64), chatId (Base64) }
     ```
   - Response:
     ```json
     { "fileId": "<telegram_file_id>", "message": "✅ File uploaded successfully!" }
     ```

### 2. **Get File URL**
   **GET** `/getFileUrl`
   - Request:
     ```sh
     Query: ?fileId=<Base64 fileId>&botToken=<Base64 botToken>
     ```
   - Response:
     ```json
     { "fileUrl": "https://api.telegram.org/file/bot<TOKEN>/<file_path>" }
     ```

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript, CryptoJS (AES Encryption)
- **Backend:** Node.js, Express.js, Multer, Sharp (Image Compression), FFmpeg (Video Compression)
- **External APIs:** Telegram Bot API

## Notes

- The file size limit is **40MB** (Telegram's restriction for standard bots).
- Users must have a bot token and chat ID before using the service.
- The uploaded file remains stored on Telegram's servers and can be accessed via the generated URL.

## License

This project is open-source and available under the MIT License.

