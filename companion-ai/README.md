# Companion AI

A modern mental health companion application built with React, TypeScript, and AI integration.

## Overview

Companion AI is an AI-powered mental health support application that provides:
- Conversational AI chat interface
- Emotion detection from images
- Mental health advice and notifications
- User authentication and profile management
- Dark/light mode support

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **AI Backend**: HuggingFace Spaces (Gradio)
- **Email Service**: EmailJS

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- HuggingFace account
- EmailJS account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd companion-ai
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your actual API keys and configuration values

4. Start the development server:
```bash
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# HuggingFace Configuration
VITE_HF_TOKEN=your_huggingface_token
VITE_GRADIO_SPACE_URL=your_gradio_space_url

# EmailJS Configuration
VITE_EMAILJS_USER_ID=your_emailjs_user_id
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
```

## Features

- **AI Chat**: Conversational interface with emotion-aware responses
- **Image Analysis**: Upload images for emotion detection
- **User Profiles**: Account management with avatar support
- **Mental Health Notifications**: Scheduled wellness reminders
- **Responsive Design**: Works on all device sizes
- **Dark Mode**: Toggle between light and dark themes

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## License

MIT License
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
