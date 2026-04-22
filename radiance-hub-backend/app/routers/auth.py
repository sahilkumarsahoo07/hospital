from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserRegister, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="Account rejected")
    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")

    token = create_access_token({"sub": str(user.id), "roles": user.roles or []})
    return TokenResponse(access_token=token, user=UserOut.from_orm_user(user))


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        organization=body.organization,
        roles=body.roles or [],
        status="pending",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.from_orm_user(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.from_orm_user(current_user)
