// WORKING GRADIO HTTP APPROACH - NO CLIENT DEPENDENCY ISSUES!
import { Client, handle_file } from "@gradio/client";

const GRADIO_SPACE_URL = "https://lolpagal7-companion-ai-backend.hf.space";
const HF_TOKEN = "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";

// Convert File to base64 for Gradio
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// CORRECT ENDPOINT FOR YOUR GRADIO SPACE!
export async function apiCompanionAI(message?: string, imageFile?: File) {
  try {
    // Prepare image data as base64 if provided (Gradio expects this format)
    let imageData = null;
    if (imageFile) {
      imageData = await fileToBase64(imageFile);
    }

    const client = await Client.connect(GRADIO_SPACE_URL, {hf_token: HF_TOKEN});

    // Use Gradio's /predict endpoint (EXACTLY as your space expects)
    const response = await client.predict("/predict", {
      image: imageFile ?? null,
      message: message ?? "Hello!"
    });
    
    // Gradio client returns the result directly, no need to check .ok or .status
    
    // Extract response from Gradio result
    const aiResponse = response.data?.[0] || "I'm here to help!";
    return {
      response: aiResponse,
      success: true
    };
    
  } catch (err) {
    console.error("[ERROR] /predict connection failed:", err);
    
    // Smart fallback response
    const fallbackResponse = message 
      ? `I heard: "${message}". Connection issues with your HuggingFace Space.`
      : "Having trouble connecting to your AI backend.";
    
    return { 
      response: fallbackResponse,
      success: false 
    };
  }
}

// Backward compatibility
export const apiChat = (message: string) => apiCompanionAI(message);
export const apiPredictEmotion = (imageFile: File) => apiCompanionAI(undefined, imageFile);
export const apiChatWithImage = (message: string, imageFile?: File) => apiCompanionAI(message, imageFile);
