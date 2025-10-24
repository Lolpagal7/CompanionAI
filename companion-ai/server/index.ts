import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import { handleHuggingFaceProxy, handleEmailProxy } from "./routes/api-proxy.js";
import { 
  handleAuthSignIn, 
  handleAuthSignUp, 
  handleFirestoreOperation, 
  handleStorageOperation,
  upload 
} from "./routes/firebase-proxy.js";

// Load environment variables
dotenv.config();

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Increased for image uploads
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Secure proxy routes (hide API keys on server-side)
  app.post("/api/huggingface", handleHuggingFaceProxy);
  app.post("/api/email", handleEmailProxy);
  
  // Firebase proxy routes (maximum security - no client-side Firebase)
  app.post("/api/auth/signin", handleAuthSignIn);
  app.post("/api/auth/signup", handleAuthSignUp);
  app.post("/api/firestore", handleFirestoreOperation);
  app.post("/api/storage", upload.single('file'), handleStorageOperation);

  return app;
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const port = process.env.PORT || 3001;
  
  app.listen(port, () => {
    console.log(`🚀 Secure Companion AI Server running on http://localhost:${port}`);
    console.log('🔒 Maximum security enabled - all Firebase operations proxied');
  });
}
