# DocuForge Pro

DocuForge Pro is an advanced, fully offline, AI-independent professional document formatting engine. It takes raw text or badly formatted `.doc`/`.docx` files and instantly standardizes them into publication-ready formats using deterministic, rigorous Python rules.

## Features
- **API-Free Architecture**: Operates 100% locally with zero external API dependencies (no GPT-4 costs, no balance errors).
- **Rule-Based Engine**: Automates heading hierarchy, typography spacing, smart quotes, and justified alignments.
- **Auto-Exporting**: Instantly generates downloadable, perfectly formatted `.docx` and `.pdf` files.
- **Robust Parsing**: Handles `.txt`, `.doc`, and `.docx` using `python-docx` and fallback extraction.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python), `python-docx`, `reportlab`, `spaCy`, `nltk`

## Getting Started

### 1. Backend Setup
Navigate to the `backend` directory and set up your Python environment:

```bash
cd backend
python -m venv venv

# Activate Virtual Environment (Windows)
.\venv\Scripts\Activate.ps1
# Activate Virtual Environment (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI Server
python -m uvicorn app.main:app --reload
```

> **Note**: The backend runs on `http://127.0.0.1:8000`.

### 2. Frontend Setup
Open a new terminal window, navigate to the root directory, and run the React app:

```bash
npm install
npm run dev
```

> **Note**: The frontend runs on `http://localhost:5173`.

## Environment Variables (.env)
*Sensitive files like `.env` are explicitly excluded from Git.*

If you wish to configure the backend, create a `.env` inside the `/backend` folder. No external keys are required for the rule-based engine to run!

```env
SECRET_KEY=your_secret_key_here
# Optional: Only needed if you want to fall back to an external AI enhancement pass
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://api.deepseek.com
# AI_MODEL=deepseek-chat
```

## Security
- `node_modules/` and `venv/` are excluded.
- All `.env` and `.env.*` files are safely added to `.gitignore`.
