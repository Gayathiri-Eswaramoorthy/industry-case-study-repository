# ICR Frontend (React + Vite)

## Environment
Create `.env` with:

```env
REACT_APP_API_URL=https://icr-backend-1.onrender.com
VITE_API_BASE_URL=https://icr-backend-1.onrender.com
```

`VITE_API_BASE_URL` is used by Vite at build time. `REACT_APP_API_URL` is also supported for compatibility.

## Local Run
```bash
npm install
npm run dev
```

## Production Build
```bash
npm install
npm run build
```

Vite output is configured to `build/`.

## Render Static Site
- Build Command: `npm install && npm run build`
- Publish Directory: `build`
- Rewrite Rule: `/*` -> `/index.html`

You can configure the rewrite in Render dashboard or use [`render.yaml`](./render.yaml).
