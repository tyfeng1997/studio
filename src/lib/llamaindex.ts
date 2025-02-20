import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";

const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY;
const BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

// 创建 axios 实例
const llamaAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 秒超时
  headers: {
    Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}`,
    accept: "application/json",
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// 将 File/Blob 转换为 Buffer
const convertFileToBuffer = async (file: File | Blob): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// 解析作业状态检查函数
const checkParsingStatus = async (jobId: string): Promise<string> => {
  try {
    const { data } = await llamaAPI.get(`/job/${jobId}`);
    return data.status;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to check parsing status: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw error;
  }
};

// 获取解析结果函数
const getParsingResult = async (jobId: string): Promise<string> => {
  try {
    const { data } = await llamaAPI.get(`/job/${jobId}/result/markdown`);
    console.log("Parsing result data:", data.markdown);
    return data.markdown || "";
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to get parsing result: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw error;
  }
};

// 带轮询的文档解析函数
export const parseDocumentWithLlama = async (file: File): Promise<string> => {
  if (!LLAMA_CLOUD_API_KEY) {
    throw new Error("LLAMA_CLOUD_API_KEY is not configured");
  }
  console.log("here.", file);
  try {
    // 将文件转换为 Buffer
    const fileBuffer = await convertFileToBuffer(file);

    // 创建 FormData
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: file.name,
      contentType: file.type,
    });

    // 上传文件
    const { data: uploadData } = await llamaAPI.post("/upload", formData, {
      headers: {
        ...formData.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("Upload response:", uploadData);
    const jobId = uploadData.id;
    console.log("Job ID:", jobId);

    // 轮询检查状态
    const maxAttempts = 30;
    const pollInterval = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await checkParsingStatus(jobId);
      console.log(`Parsing status for ${file.name}: ${status}`);

      if (status === "SUCCESS") {
        console.log("Parsing completed successfully");
        return await getParsingResult(jobId);
      } else if (status === "FAILED") {
        throw new Error(`Parsing failed for ${file.name}`);
      } else if (status === "PENDING" || status === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
      } else {
        throw new Error(`Unknown status: ${status}`);
      }
    }

    throw new Error(
      `Parsing timeout for ${file.name} after ${maxAttempts} attempts`
    );
  } catch (error) {
    console.error("Error in parseDocumentWithLlama:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        response: error.response?.data,
        status: error.response?.status,
      });
    }
    throw error;
  }
};
