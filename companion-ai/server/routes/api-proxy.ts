import { Request, Response } from 'express';

// Secure proxy for HuggingFace API calls
export async function handleHuggingFaceProxy(req: Request, res: Response) {
  try {
    const { message, imageFile } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN; // Server-side only
    const GRADIO_SPACE_URL = process.env.GRADIO_SPACE_URL;

    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'HF_TOKEN not configured' });
    }

    // Make the API call from server-side (hides the token)
    const response = await fetch(`${GRADIO_SPACE_URL}/call/predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [message, imageFile]
      })
    });

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('HuggingFace proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Secure proxy for EmailJS (though EmailJS is less sensitive)
export async function handleEmailProxy(req: Request, res: Response) {
  try {
    const { templateData, templateType } = req.body;
    
    // Use server-side EmailJS credentials
    const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID;
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    
    let templateId;
    switch (templateType) {
      case 'contact':
        templateId = process.env.EMAILJS_TEMPLATE_ID;
        break;
      case 'mental-health':
        templateId = process.env.MENTAL_HEALTH_TEMPLATE_ID;
        break;
      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }

    // Make EmailJS call from server (hides credentials)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      res.status(400).json({ error: 'Email sending failed' });
    }

  } catch (error) {
    console.error('Email proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
