import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get API key from environment variable
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Mistral API key is not configured" },
        { status: 500 }
      );
    }

    // Initialize Mistral client
    const client = new Mistral({ apiKey });

    // Get the uploaded file from request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if file is PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert the file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload the file to Mistral
    const uploadedPdf = await client.files.upload({
      file: {
        fileName: file.name,
        content: fileBuffer,
      },
      purpose: "ocr",
    });

    // Check if file was uploaded successfully
    await client.files.retrieve({
      fileId: uploadedPdf.id,
    });

    // Get signed URL
    const signedUrl = await client.files.getSignedUrl({
      fileId: uploadedPdf.id,
    });

    // Process OCR
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: signedUrl.url,
      },
    });

    // Return OCR results
    return NextResponse.json({
      success: true,
      fileName: file.name,
      content: ocrResponse,
    });
  } catch (error) {
    console.error("OCR processing error:", error);
    return NextResponse.json(
      { error: "Failed to process document with OCR" },
      { status: 500 }
    );
  }
}

// Configure the maximum payload size
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "50mb",
  },
};
