# DICOM Integration Guide — Radiance Hub

## Overview

Your project is **already partially wired for DICOM** — the frontend viewer component and environment variables are in place. This guide explains how to connect the missing pieces using a **100% free, open-source stack** that is production-grade and used by hospitals worldwide.

---

## 1. Full Stack Architecture

```
Hospital/PACS → Orthanc (DICOM Server) → FastAPI Backend → OHIF Viewer (Frontend)
                      :4242                    :8000              :3000
                    DICOM store           Mints viewer URL      Renders images
```

| Layer | Tool | Port | Purpose |
|---|---|---|---|
| **DICOM Server** | [Orthanc](https://www.orthanc-server.com/) | `4242` (DICOM), `8042` (REST) | Stores & serves DICOM files |
| **DICOM Viewer** | [OHIF Viewer](https://github.com/OHIF/Viewers) | `3000` | Browser-based medical image viewer |
| **Backend Bridge** | Your FastAPI | `8000` | Looks up study, mints viewer URL |
| **Frontend** | Your React/Vite app | `8080` | Embeds viewer via `ViewerFrame.tsx` |

---

## 2. What's Already Done in Your Code

### Frontend (`radiance-hub`)
- ✅ `src/components/workflow/ViewerFrame.tsx` — Embeds OHIF Viewer in an `<iframe>`
- ✅ `src/lib/env.ts` — Has `VITE_OHIF_VIEWER_URL` and `VITE_ORTHANC_BASE_URL` config slots
- ✅ `src/lib/services.ts` — Already calls `GET /studies/{id}/viewer-url`
- ✅ `src/routes/app.studies.$studyId.tsx` — Renders `<ViewerFrame>` in the study workspace

### Backend (`radiance-hub-backend`)
- ✅ Orthanc URL env variable slot ready
- ❌ `GET /studies/{id}/viewer-url` endpoint **not yet implemented** (returns empty or 404)
- ❌ Orthanc is not running / not connected

---

## 3. Prerequisites

- **Docker Desktop** (recommended) → https://www.docker.com/products/docker-desktop/
- OR native Orthanc installer for Windows → https://www.orthanc-server.com/download.php

---

## 4. Step-by-Step Setup

### Step 1 — Run Orthanc DICOM Server

**Option A: Docker (Recommended)**
```bash
docker run -d \
  --name orthanc \
  -p 4242:4242 \
  -p 8042:8042 \
  osimis/orthanc
```

**Option B: Docker Compose (Persistent Storage)**
Create `docker-compose.yml` in your project root:
```yaml
version: "3.8"
services:
  orthanc:
    image: osimis/orthanc
    ports:
      - "4242:4242"  # DICOM C-STORE
      - "8042:8042"  # REST API + Web UI
    volumes:
      - orthanc_data:/var/lib/orthanc/db
    environment:
      ORTHANC_JSON: |
        {
          "AuthenticationEnabled": false,
          "DicomWeb": {
            "Enable": true,
            "Root": "/wado/"
          }
        }

volumes:
  orthanc_data:
```
```bash
docker-compose up -d
```

Verify Orthanc is running: http://localhost:8042 (default login: `orthanc` / `orthanc`)

---

### Step 2 — Run OHIF Viewer

**Option A: Docker**
```bash
docker run -d \
  --name ohif \
  -p 3000:80 \
  -e APP_CONFIG='{"servers":{"dicomWeb":[{"name":"Orthanc","wadoUriRoot":"http://localhost:8042/wado","qidoRoot":"http://localhost:8042/dicomweb","wadoRoot":"http://localhost:8042/dicomweb","qidoSupportsIncludeField":true,"imageRendering":"wadors","thumbnailRendering":"wadors"}]}}' \
  ohif/app:latest
```

Verify OHIF is running: http://localhost:3000

**Option B: Pre-built (No Docker)**
Download the OHIF release from https://github.com/OHIF/Viewers/releases and serve with any static server.

---

### Step 3 — Configure Environment Variables

**Frontend** — add to `radiance-hub/.env`:
```dotenv
VITE_ORTHANC_BASE_URL=http://localhost:8042
VITE_OHIF_VIEWER_URL=http://localhost:3000/viewer
```

**Backend** — add to `radiance-hub-backend/.env`:
```dotenv
ORTHANC_BASE_URL=http://localhost:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
OHIF_VIEWER_URL=http://localhost:3000/viewer
```

---

### Step 4 — Implement Backend Endpoint

In your FastAPI backend, implement `GET /studies/{id}/viewer-url`:

```python
# app/routers/studies.py (add to existing router)

import os
from fastapi import HTTPException
from sqlalchemy.orm import Session

@router.get("/{id}/viewer-url")
async def get_viewer_url(
    id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    study = db.query(Study).filter(Study.id == id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    viewer_base = os.getenv("OHIF_VIEWER_URL", "http://localhost:3000/viewer")
    orthanc_url = os.getenv("ORTHANC_BASE_URL", "http://localhost:8042")
    
    # Build DICOMweb viewer URL pointing at Orthanc
    url = (
        f"{viewer_base}"
        f"?StudyInstanceUIDs={study.study_instance_uid}"
        f"&url={orthanc_url}/dicomweb"
    )
    
    return {
        "url": url,
        "expiresAt": "2099-01-01T00:00:00Z"
    }
```

---

### Step 5 — Upload a Test DICOM File

To verify the full chain works, upload a sample DICOM file to Orthanc:

1. Download a free sample DICOM from: https://www.dicomlibrary.com/
2. Upload via cURL:
   ```bash
   curl -X POST http://localhost:8042/instances \
     --data-binary @sample.dcm \
     -H "Content-Type: application/dicom"
   ```
3. Or use the Orthanc Web UI at `http://localhost:8042` → Click "Upload"

---

## 5. How It All Connects

```
User clicks "View Study" in Radiance Hub
    ↓
ViewerFrame.tsx calls GET /api/studies/{id}/viewer-url
    ↓
FastAPI looks up study_instance_uid in DB
    ↓
FastAPI builds OHIF viewer URL pointing at Orthanc
    ↓
ViewerFrame.tsx renders an <iframe> with the OHIF URL
    ↓
OHIF Viewer fetches DICOM images directly from Orthanc via DICOMweb
    ↓
Radiologist sees the images
```

---

## 6. CORS Configuration (Required)

OHIF Viewer fetches images from Orthanc directly from the browser. Add CORS headers to Orthanc by using this config:

```json
{
  "HttpServerEnabled": true,
  "HttpPort": 8042,
  "CorsAllowCredentials": true,
  "CorsOrigins": ["http://localhost:8080", "http://localhost:3000"],
  "CorsAllowedHeaders": ["Authorization", "Content-Type"]
}
```

Mount this as `/etc/orthanc/orthanc.json` in Docker.

---

## 7. Sending Real DICOM from a Modality

Real PACS/modality devices send DICOM via C-STORE (DICOM protocol on port 4242):

```
Modality (CT/MRI/X-Ray) → DICOM C-STORE → Orthanc :4242
```

Configure the modality's AE (Application Entity) to point to:
- **IP**: your server IP
- **Port**: `4242`
- **AE Title**: `ORTHANC`

---

## 8. Troubleshooting

| Problem | Solution |
|---|---|
| OHIF shows blank viewer | Check `VITE_OHIF_VIEWER_URL` is set correctly in frontend `.env` |
| `viewer-url` returns 404 | Implement the endpoint in FastAPI (Step 4 above) |
| Orthanc not accessible | Verify Docker container is running: `docker ps` |
| CORS errors in browser | Configure Orthanc CORS headers (Section 6 above) |
| No images in OHIF | Upload a DICOM file first (Step 5 above) |
| Images load but distorted | Ensure you're using DICOMweb (not WADO-URI) |

---

## 9. Production Considerations

- Enable Orthanc authentication in production (`AuthenticationEnabled: true`)
- Use HTTPS for both Orthanc and OHIF (reverse proxy with Nginx)
- Use S3/cloud storage for large DICOM archives (Orthanc supports S3 plugin)
- Consider [Orthanc Explorer 2](https://github.com/orthanc-server/orthanc-explorer-2) for a better admin UI

---

## Summary Checklist

- [ ] Docker Desktop installed
- [ ] Orthanc running on `localhost:8042` (verify at http://localhost:8042)
- [ ] OHIF running on `localhost:3000` (verify at http://localhost:3000)
- [ ] Frontend `.env` updated with `VITE_OHIF_VIEWER_URL` and `VITE_ORTHANC_BASE_URL`
- [ ] Backend `.env` updated with `ORTHANC_BASE_URL`, `ORTHANC_USERNAME`, `ORTHANC_PASSWORD`
- [ ] `GET /studies/{id}/viewer-url` endpoint implemented in FastAPI
- [ ] Test DICOM file uploaded to Orthanc
- [ ] Full flow verified: Click study → images render in OHIF viewer
