# PACT Docker Architecture

## System Overview

```mermaid
graph TB
    subgraph "Host Machine"
        MongoDB[(MongoDB<br/>localhost:27017)]
        Browser[Web Browser]
    end
    
    subgraph "Docker Containers"
        subgraph "Backend Container"
            Backend[FastAPI Server<br/>Port 8000<br/>Python 3.11]
        end
        
        subgraph "Frontend Container"
            Frontend[Nginx Server<br/>Port 80<br/>Static React Build]
        end
    end
    
    Browser -->|HTTP :80| Frontend
    Frontend -->|API Proxy /api/*| Backend
    Backend -->|MongoDB Connection<br/>host.docker.internal:27017| MongoDB
    
    classDef container fill:#e1f5fe
    classDef service fill:#f3e5f5
    classDef database fill:#e8f5e8
    
    class Backend,Frontend container
    class Browser service
    class MongoDB database
```

## Container Details

### Backend Container (pact-backend)
- **Base Image**: `python:3.11-slim`
- **Port**: 8000
- **Dependencies**: FastAPI, PyMongo, Uvicorn
- **MongoDB**: Connects to `host.docker.internal:27017`
- **Build**: `docker build -t pact-backend .`
- **Run**: `docker run -p 8000:8000 pact-backend`

### Frontend Container (pact-frontend)
- **Base Image**: `nginx:alpine` (multi-stage from `node:18-alpine`)
- **Port**: 80
- **Build Stage**: Vite React build
- **Serve Stage**: Nginx static file server
- **Build**: `cd client && docker build -t pact-frontend .`
- **Run**: `docker run -p 80:80 pact-frontend`

## Network Communication

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend Container<br/>(Nginx :80)
    participant BE as Backend Container<br/>(FastAPI :8000)
    participant M as MongoDB<br/>(Host :27017)
    
    B->>F: GET / (React App)
    F->>B: Static HTML/JS/CSS
    
    B->>F: GET /api/pacts
    F->>BE: Proxy to :8000/pacts
    BE->>M: Query via host.docker.internal:27017
    M->>BE: Return documents
    BE->>F: JSON response
    F->>B: API response
```

## CORS Configuration

Backend allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `http://localhost:80` (Docker frontend)
- `http://localhost` (Docker frontend, no port)

## Key Files

- `/Dockerfile` - Backend container definition
- `/client/Dockerfile` - Frontend container definition  
- `/client/nginx.conf` - Nginx configuration for frontend
- `/main.py` - FastAPI backend with `host.docker.internal` MongoDB connection