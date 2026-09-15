# CityPulse AI

CityPulse is an AI-powered platform for citizens to report civic issues and for authorities to monitor, manage, and analyze them via an intuitive dashboard and hotspot map.

## Project Structure
- `frontend/`: A Next.js web application containing portals for both citizens and authorities.
- `backend/`: A FastAPI Python backend that handles the API, database, and AI integrations (e.g., Gemini, Ollama).

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   # source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set up your environment variables:
   Copy `.env.example` to `.env` and fill in your necessary keys (e.g., API keys for AI services).
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at http://localhost:8000

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3000

## Features
- **Citizen Portal**: Register, login, and report civic issues with descriptions and images.
- **Authority Dashboard**: View analytics, track reports, and explore a hotspot map to manage city infrastructure efficiently.
- **AI Analysis**: Automated analysis and categorization of reported issues using advanced AI models.

## Technologies Used
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Python, FastAPI, SQLite
- **AI**: Integrations with Gemini and local models (Ollama)
