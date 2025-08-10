# Pact project

This repository contains:
- FastAPI backend (main.py)
- React client (Vite) in `client/`

## Run the backend

Requirements: Python 3.10+ and MongoDB running locally on mongodb://localhost:27017/

```
python main.py
```
The API will be available at http://localhost:8000

## Run the React app with npm

From the repository root:

1) Install client dependencies
```
npm run client:install
```

2) Start the dev server
```
npm run client:dev
```
This will launch Vite on http://localhost:5173 and the app will fetch the backend from http://localhost:8000 by default.

Alternatively, you can run commands inside the client folder as usual:
```
cd client
npm install
npm run dev
```

### Configure API base URL
By default, the client uses `http://localhost:8000`.
You can point to a different backend by setting an environment variable before starting the dev server, e.g.:

macOS/Linux:
```
VITE_API_BASE_URL=http://localhost:8001 npm run client:dev
```

Windows (PowerShell):
```
$env:VITE_API_BASE_URL="http://localhost:8001"; npm run client:dev
```

## Build and preview the client

From the repository root:
```
npm run client:build
npm run client:preview
```

## Notes
- CORS is enabled in the FastAPI app for common local dev ports (5173 and 3000).
- Ensure MongoDB is running locally; the backend uses `pactdb.pact` collection.
