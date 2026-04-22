from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.comment import Comment
from app.models.study import Study
from app.schemas.misc import CommentOut, CommentBody

router = APIRouter(tags=["comments"])


def comment_to_out(c: Comment) -> CommentOut:
    role = (c.author.roles or ["unknown"])[0] if c.author and c.author.roles else "unknown"
    return CommentOut(
        id=c.id,
        studyId=c.study_id,
        parentId=c.parent_id,
        authorId=c.author_id,
        authorName=c.author.full_name if c.author else "Unknown",
        authorRole=role,
        body=c.body,
        createdAt=c.created_at,
    )


@router.get("/studies/{study_id}/comments", response_model=list[CommentOut])
def list_comments(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.study_id == study_id).order_by(Comment.created_at.asc()).all()
    return [comment_to_out(c) for c in comments]


@router.post("/studies/{study_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(study_id: str, body: CommentBody, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    if study.status == "FINALIZED":
        raise HTTPException(status_code=409, detail="Comments are locked on finalized studies")
    comment = Comment(
        study_id=study_id,
        author_id=current_user.id,
        body=body.body,
        parent_id=body.parentId,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment_to_out(comment)
