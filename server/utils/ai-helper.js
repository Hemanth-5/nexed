import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import axios from "axios";
import fs from "fs";
import path from "path";
import mime from "mime";
import { google } from "googleapis";
import { fileTypeFromBuffer } from "file-type"; // Correct import
import { PDFDocument, rgb } from "pdf-lib"; // For creating PDFs
import fontkit from "@pdf-lib/fontkit"; // For embedding custom fonts
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import puppeteer from "puppeteer";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentDir = path.resolve(__dirname, "..");
const uploadDirs = join(parentDir, "uploads");

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Map mimetypes to file extensions
const mimeTypeToExtensionMap = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "text/html": "html",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/zip": "zip",
  "application/javascript": "js",
  "application/json": "json",
  "text/csv": "csv",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3", //Note: mp3 is technically MPEG audio layer III, but mp3 is the common extension.
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Puppeteer Helper for DOCX to PDF conversion
const convertDocxToPdfWithPuppeteer = async (inputPath, outputPath) => {
  try {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Read the DOCX file and convert it to HTML
    const fileContent = fs.readFileSync(inputPath, "utf8");
    await page.setContent(
      `<html><body><pre>${fileContent}</pre></body></html>`
    );

    // Convert the HTML content to PDF
    await page.pdf({ path: outputPath, format: "A4" });

    await browser.close();
    console.log(`DOCX to PDF conversion completed: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error converting DOCX to PDF:", error);
    throw error;
  }
};

// Puppeteer Helper for PPTX to PDF conversion
const convertPptxToPdfWithPuppeteer = async (inputPath, outputPath) => {
  try {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set up PPTX to HTML conversion (you can use a tool to convert PPTX to HTML or render it directly)
    // Here, you would need a library or API that can render PPTX as HTML, as Puppeteer doesn't directly support PPTX files
    // For now, this is a placeholder to illustrate the concept
    const pptxHtmlContent = await convertPptxToHtml(inputPath); // Replace this with actual conversion logic

    await page.setContent(pptxHtmlContent);
    await page.pdf({ path: outputPath, format: "A4" });

    await browser.close();
    console.log(`PPTX to PDF conversion completed: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error converting PPTX to PDF:", error);
    throw error;
  }
};

// Function to convert image files to PDF
const convertImageToPdf = async (inputPath, outputPath) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = fs.readFileSync(inputPath);

    let embeddedImage;
    if (inputPath.endsWith(".jpg") || inputPath.endsWith(".jpeg")) {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else if (inputPath.endsWith(".png")) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error("Unsupported image format for PDF conversion");
    }

    const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: embeddedImage.width,
      height: embeddedImage.height,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`Image to PDF conversion completed: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error converting Image to PDF:", error);
    throw error;
  }
};

// Download and Convert File from Google Drive
export const downloadFileFromDrive = async (fileId, accessToken) => {
  console.log(uploadDirs);
  const fileDownloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await axios.get(fileDownloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    responseType: "stream", // Handle large files
  });

  const contentType = response.headers["content-type"];
  const tempFilePath = path.join(
    uploadDirs,
    `temp-file.${mimeTypeToExtensionMap[contentType] || "txt"}`
  );

  // Only allow PDFs or images, throw error if not allowed
  if (
    !["application/pdf", "image/jpeg", "image/png", "image/gif"].includes(
      contentType
    )
  ) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  const writer = fs.createWriteStream(tempFilePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  let finalFilePath = tempFilePath;
  if (contentType === "application/pdf") {
    console.log("PDF file downloaded successfully.");
  } else if (contentType.startsWith("image/")) {
    finalFilePath = await convertImageToPdf(
      tempFilePath,
      `${tempFilePath}.pdf`
    );
  } else {
    throw new Error(
      `Unsupported file type for conversion: ${mimeTypeToExtensionMap[contentType]}`
    );
  }

  return { tempFilePath: finalFilePath, fileMimeType: "application/pdf" };
};

export const getAIResponse = async (
  message,
  chatHistory = [],
  driveFileId,
  accessToken
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const formattedHistory = chatHistory
      .map((entry) => `User: ${entry.userMessage}\nAI: ${entry.aiResponse}`)
      .join("\n");

    const prompt = `${formattedHistory}\nUser: ${message}`;

    let fileData = null;

    if (driveFileId) {
      // Download the file from Google Drive
      const { tempFilePath, fileMimeType } = await downloadFileFromDrive(
        driveFileId,
        accessToken
      );

      // Upload the file to Gemini
      const uploadResponse = await fileManager.uploadFile(tempFilePath, {
        mimeType: fileMimeType,
        displayName: path.basename(tempFilePath),
      });

      console.log(
        `Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`
      );

      fileData = {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri,
      };
    }

    const input = fileData
      ? [{ fileData }, { text: prompt }]
      : [{ text: prompt }];
    const completion = await model.generateContent(input);

    return {
      response: completion.response.text(),
      fullPrompt: prompt,
    };
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw error;
  }
};
