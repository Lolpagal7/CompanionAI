// Secure API helper - routes sensitive calls through backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Secure HuggingFace API call via backend proxy
export async function secureHuggingFaceCall(message: string, imageFile?: File) {
  try {
    let imageData = null;
    if (imageFile) {
      // Convert to base64 for transmission
      imageData = await fileToBase64(imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/huggingface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        imageFile: imageData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Secure HuggingFace API error:', error);
    throw error;
  }
}

// Secure EmailJS call via backend proxy
export async function secureEmailSend(templateData: any, templateType: 'contact' | 'mental-health') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateData,
        templateType
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Secure email API error:', error);
    throw error;
  }
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
