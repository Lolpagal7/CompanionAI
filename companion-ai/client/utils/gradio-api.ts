// GRADIO CLIENT IMPLEMENTATION - THE RIGHT WAY FOR PRIVATE SPACES
import { Client } from "@gradio/client";

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

// PROPER GRADIO CLIENT CONNECTION
export async function apiCompanionAI(message?: string, imageFile?: File) {
  try {
    // Connect to your private space using official Gradio client
    const client = await Client.connect(GRADIO_SPACE_URL, {
      hf_token: HF_TOKEN  // This is the correct way for private spaces!
    });
    
    // Prepare image data if provided
    let imageData = null;
    if (imageFile) {
      imageData = await fileToBase64(imageFile);
    }
    
    // Call your companion_ai function
    const result = await client.predict("/companion_ai", {
      text: message || "",        // first parameter: text
      image: imageData           // second parameter: image
    });
    
    console.log("[SUCCESS] GRADIO CLIENT WORKED:", result);
    
    // Extract the response
    const aiResponse = result?.data?.[0] || result?.data || "I'm here to help!";
    
    return { 
      response: aiResponse,
      success: true 
    };
    
  } catch (err) {
    console.error("[ERROR] Gradio client failed:", err);
    
    // FALLBACK: Try the HTTP approach as backup
    return await httpFallback(message, imageFile);
  }
}

// HTTP Fallback function
async function httpFallback(message?: string, imageFile?: File) {
  try {
    // Prepare image data if provided
    let imageData = null;
    if (imageFile) {
      imageData = await fileToBase64(imageFile);
    }
    
    // Try the corrected space endpoint
    const response = await fetch(`${GRADIO_SPACE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [message || "", imageData],
        fn_index: 0
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("[SUCCESS] HTTP FALLBACK WORKED:", result);
      return {
        response: result?.data?.[0] || "I'm here to help!",
        success: true
      };
    }
    
    throw new Error(`HTTP fallback failed: ${response.status}`);
    
  } catch (fallbackErr) {
    console.error("[ERROR] All methods failed:", fallbackErr);
    
    // Smart fallback response
    const fallbackResponse = message 
      ? `I heard: "${message}". I'm having connection issues but I'm here to support you.`
      : "I'm experiencing technical difficulties but I'm still here to listen.";
    
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
