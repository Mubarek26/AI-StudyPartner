const axios = require("axios");
const pdfParse = require("pdf-parse");

const downloadPdfBuffer = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
};

const extractPdfText = async (buffer) => {
  return pdfParse(buffer);
};

module.exports = { downloadPdfBuffer, extractPdfText };
