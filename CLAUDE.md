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

### Docker Deployment
Full-stack deployment with Docker Compose:
```bash
# Build and start all services
docker-compose up --build -d

# Services available at:
# - Frontend: http://localhost:80
# - Backend API: http://localhost:8000  
# - MongoDB: localhost:27018
```

## Prerequisites

- Python 3.10+ for backend
- Node.js 18+ for frontend
- MongoDB running locally on default port (27017)
- Docker and Docker Compose for containerized deployment

## Recent Development Activities

### Docker Deployment Implementation (2025-09-02)
- **Objective**: Deploy both client and server to Docker Desktop
- **Implementation**: 
  - Created `docker-compose.yml` for orchestrating MongoDB, backend (FastAPI), and frontend (nginx) services
  - Updated nginx configuration to proxy API calls to backend container
  - Resolved port conflicts by using MongoDB on port 27018
  - All services now run in isolated Docker network with proper inter-service communication
- **Result**: Complete containerized deployment accessible at http://localhost

### Pagination Feature Implementation (2025-09-02)  
- **Objective**: Add pagination controls to the documents table with 10/50/100 per page options
- **Implementation**:
  - Added pagination state management (currentPage, itemsPerPage, totalItems)
  - Implemented server-side pagination using existing API `limit` and `skip` parameters
  - Created comprehensive pagination UI with first/previous/next/last navigation
  - Added items-per-page selector with 10, 50, 100 options
  - Integrated pagination with existing search, filter, and CRUD operations
  - Fixed HTTP 422 error by respecting API's 500-item limit validation
- **Result**: Fully functional pagination system that enhances navigation through large datasets