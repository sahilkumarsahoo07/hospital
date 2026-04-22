from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.pacs import PacsEndpoint, IngestionEvent, SyncLog

router = APIRouter(prefix="/pacs", tags=["pacs"])
PACS_ROLES = ["super_admin", "sub_admin", "pacs"]


def ep_to_dict(ep: PacsEndpoint):
    return {
        "id": str(ep.id), "name": ep.name, "type": ep.type, "baseUrl": ep.base_url,
        "enabled": ep.enabled, "lastSyncAt": ep.last_sync_at.isoformat() if ep.last_sync_at else None,
        "ingested24h": ep.ingested_24h, "rejected24h": ep.rejected_24h,
        "createdAt": ep.created_at.isoformat(), "updatedAt": ep.updated_at.isoformat(),
    }


@router.get("/endpoints")
def list_endpoints(current_user=Depends(require_roles(*PACS_ROLES)), db: Session = Depends(get_db)):
    return [ep_to_dict(ep) for ep in db.query(PacsEndpoint).all()]


@router.post("/endpoints", status_code=201)
def create_endpoint(body: dict, current_user=Depends(require_roles("super_admin", "pacs")), db: Session = Depends(get_db)):
    ep = PacsEndpoint(name=body["name"], type=body.get("type", "orthanc"), base_url=body["baseUrl"], enabled=body.get("enabled", True))
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep_to_dict(ep)


@router.get("/endpoints/{ep_id}")
def get_endpoint(ep_id: str, current_user=Depends(require_roles(*PACS_ROLES)), db: Session = Depends(get_db)):
    ep = db.query(PacsEndpoint).filter(PacsEndpoint.id == ep_id).first()
    if not ep:
        raise HTTPException(404, "Endpoint not found")
    return ep_to_dict(ep)


@router.put("/endpoints/{ep_id}")
def update_endpoint(ep_id: str, body: dict, current_user=Depends(require_roles("super_admin", "pacs")), db: Session = Depends(get_db)):
    ep = db.query(PacsEndpoint).filter(PacsEndpoint.id == ep_id).first()
    if not ep:
        raise HTTPException(404, "Endpoint not found")
    if "name" in body: ep.name = body["name"]
    if "type" in body: ep.type = body["type"]
    if "baseUrl" in body: ep.base_url = body["baseUrl"]
    ep.updated_at = datetime.now(timezone.utc)
    db.commit()
    return ep_to_dict(ep)


@router.delete("/endpoints/{ep_id}", status_code=204)
def delete_endpoint(ep_id: str, current_user=Depends(require_roles("super_admin", "pacs")), db: Session = Depends(get_db)):
    ep = db.query(PacsEndpoint).filter(PacsEndpoint.id == ep_id).first()
    if ep:
        db.delete(ep)
        db.commit()


@router.post("/endpoints/{ep_id}/test")
def test_endpoint(ep_id: str, current_user=Depends(require_roles(*PACS_ROLES))):
    return {"reachable": False, "latencyMs": None, "message": "PACS connectivity test is not wired to a real DICOM node."}


@router.post("/endpoints/{ep_id}/sync")
def sync_endpoint(ep_id: str, current_user=Depends(require_roles("super_admin", "pacs"))):
    return {"queued": True}


@router.post("/endpoints/{ep_id}/enable")
def enable_endpoint(ep_id: str, current_user=Depends(require_roles("super_admin", "pacs")), db: Session = Depends(get_db)):
    ep = db.query(PacsEndpoint).filter(PacsEndpoint.id == ep_id).first()
    if not ep:
        raise HTTPException(404, "Endpoint not found")
    ep.enabled = True
    db.commit()
    return ep_to_dict(ep)


@router.post("/endpoints/{ep_id}/disable")
def disable_endpoint(ep_id: str, current_user=Depends(require_roles("super_admin", "pacs")), db: Session = Depends(get_db)):
    ep = db.query(PacsEndpoint).filter(PacsEndpoint.id == ep_id).first()
    if not ep:
        raise HTTPException(404, "Endpoint not found")
    ep.enabled = False
    db.commit()
    return ep_to_dict(ep)


@router.get("/ingestion")
def list_ingestion(endpointId: str = None, status: str = None, page: int = 1, pageSize: int = 50,
                   current_user=Depends(require_roles(*PACS_ROLES)), db: Session = Depends(get_db)):
    q = db.query(IngestionEvent)
    if endpointId:
        q = q.filter(IngestionEvent.endpoint_id == endpointId)
    if status:
        q = q.filter(IngestionEvent.status == status)
    total = q.count()
    items = q.order_by(IngestionEvent.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"items": [{"id": str(e.id), "endpointId": str(e.endpoint_id), "studyId": str(e.study_id) if e.study_id else None,
                       "status": e.status, "anonymized": e.anonymized, "message": e.message, "createdAt": e.created_at.isoformat()} for e in items],
            "total": total, "page": page, "pageSize": pageSize}


@router.get("/logs")
def list_logs(endpointId: str = None, level: str = None, page: int = 1, pageSize: int = 50,
              current_user=Depends(require_roles(*PACS_ROLES)), db: Session = Depends(get_db)):
    q = db.query(SyncLog)
    if endpointId:
        q = q.filter(SyncLog.endpoint_id == endpointId)
    if level:
        q = q.filter(SyncLog.level.in_(level.split(",")))
    total = q.count()
    items = q.order_by(SyncLog.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"items": [{"id": str(l.id), "endpointId": str(l.endpoint_id), "level": l.level,
                       "op": l.op, "message": l.message, "createdAt": l.created_at.isoformat()} for l in items],
            "total": total, "page": page, "pageSize": pageSize}


@router.get("/health")
def pacs_health(current_user=Depends(require_roles(*PACS_ROLES)), db: Session = Depends(get_db)):
    endpoints = db.query(PacsEndpoint).all()
    return {
        "endpoints": [{"id": str(ep.id), "name": ep.name, "reachable": False,
                       "ingested24h": ep.ingested_24h, "rejected24h": ep.rejected_24h} for ep in endpoints],
        "totalIngested24h": sum(ep.ingested_24h for ep in endpoints),
        "totalRejected24h": sum(ep.rejected_24h for ep in endpoints),
    }
