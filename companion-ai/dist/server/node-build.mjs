import path from "path";
import * as express from "express";
import express__default from "express";
import cors from "cors";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
async function handleHuggingFaceProxy(req, res) {
  try {
    const { message, imageFile } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;
    const GRADIO_SPACE_URL = process.env.GRADIO_SPACE_URL;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN not configured" });
    }
    const response = await fetch(`${GRADIO_SPACE_URL}/call/predict`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [message, imageFile]
      })
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("HuggingFace proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function handleEmailProxy(req, res) {
  try {
    const { templateData, templateType } = req.body;
    const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID;
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    let templateId;
    switch (templateType) {
      case "contact":
        templateId = process.env.EMAILJS_TEMPLATE_ID;
        break;
      case "mental-health":
        templateId = process.env.MENTAL_HEALTH_TEMPLATE_ID;
        break;
      default:
        return res.status(400).json({ error: "Invalid template type" });
    }
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: EMAILJS_USER_ID,
        template_params: templateData
      })
    });
    if (response.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Email sending failed" });
    }
  } catch (error) {
    console.error("Email proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json({ limit: "10mb" }));
  app2.use(express__default.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/huggingface", handleHuggingFaceProxy);
  app2.post("/api/email", handleEmailProxy);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`Fusion Starter server running on port ${port}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
