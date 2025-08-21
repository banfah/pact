# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack web application called PACT (Purposeful, Actionable, Continuous, Trackable) for tracking documents/experiments:

- **Backend**: FastAPI application (`main.py`) providing REST API for document CRUD operations
- **Frontend**: React + Vite client application in the `client/` directory
- **Database**: MongoDB (expects local instance at `mongodb://localhost:27017/`)
- **Collection**: Uses `pactdb.pact` collection in MongoDB

### Key Components

**Backend (`main.py`)**:
- FastAPI app with CORS enabled for local dev
- Document model with fields: name, description, date, category
- Full CRUD API at `/pacts` endpoints
- MongoDB integration with proper ObjectId handling

**Frontend (`client/src/`)**:
- React 18 application with Vite build system
- Main components: `DocumentsTable`, `Calendar`, `AnalogueClock`, `DigitalClock`
- Uses environment variable `VITE_API_BASE_URL` for API endpoint configuration

## Development Commands

### Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
# API available at http://localhost:8000
```

### Frontend (from repository root)
```bash
# Install client dependencies
npm run client:install

# Start development server
npm run client:dev
# Client available at http://localhost:5173

# Build for production
npm run client:build

# Preview production build
npm run client:preview
```

### Alternative client commands (from client/ directory)
```bash
cd client
npm install
npm run dev
npm run build
npm run preview
```

### Environment Configuration
Configure API base URL for client:
```bash
# macOS/Linux
VITE_API_BASE_URL=http://localhost:8001 npm run client:dev

# Windows PowerShell
$env:VITE_API_BASE_URL="http://localhost:8001"; npm run client:dev
```

### Docker Support
Both backend and client have Dockerfiles for containerized deployment.

## Prerequisites

- Python 3.10+ for backend
- Node.js 18+ for frontend
- MongoDB running locally on default port (27017)
- Add docker files for front-end and back-end respectively.