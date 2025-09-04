/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * CompanionAI unified API response types
 */
export interface CompanionAIRequest {
  message?: string;
  image?: string; // base64 image data
}

export interface CompanionAIResponse {
  response?: string;
  error?: string;
  success: boolean;
  emotion?: string; // detected emotion if image provided
}

/**
 * Message interface for chat history
 */
export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  imageUrl?: string;
  emotion?: string; // detected emotion if image was provided
}
