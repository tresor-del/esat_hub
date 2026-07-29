from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.assignment import AssignmentCreate, AssignmentUpdate, SubmissionUpdate
from app.db.schemas.assignment import Assignment, AssignmentStatus, AssignmentSubmission
from app.db.schemas.media import Media
from app.models.media import MediaCreate, MediaResponse


def create_assignment(db: Session, asnmt_data: AssignmentCreate, teacher_id: UUID) -> Assignment:
    valid_data = asnmt_data.model_dump()
    db_data = Assignment(**valid_data)
    db_data.teacher_id = teacher_id
    db.add(db_data)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de créer le devoir (room_id invalide ?)"
        )
    db.refresh(db_data)

    return db_data

def update_assignment(db: Session, asnmt_id: UUID, new_data: AssignmentUpdate) -> Assignment:
    stmt = select(Assignment).where(Assignment.id==asnmt_id)
    db_asnmt = db.execute(stmt).scalar()
    if not db_asnmt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devoir non trouvé"
        )
    
    data = new_data.model_copy()
    validated_data = data.model_dump(exclude_unset=True)
    for key, value in validated_data.items():
        setattr(db_asnmt, key, value)
    
    db.add(db_asnmt)
    db.commit()
    db.refresh(db_asnmt)
    return db_asnmt
    

def upload_asnmt_media(db: Session, data: MediaCreate) -> MediaResponse:
    db_media = Media(**data.model_dump())
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return MediaResponse.model_validate(db_media)


def update_assignment_submission(
    db: Session,
    submission_id: UUID,
    new_data: SubmissionUpdate,
) -> AssignmentSubmission:
    stmt = select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id)
    db_submission = db.execute(stmt).scalar()
    if not db_submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soumission non trouvée"
        )

    validated_data = new_data.model_dump(exclude_unset=True)
    for key, value in validated_data.items():
        setattr(db_submission, key, value)

    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission


def get_teacher_asnmts_by_room(
    db: Session,
    teacher_id: UUID,
    asnmt_status: AssignmentStatus = None,
    room_id: UUID = None
) -> List[Assignment]:
    filters = [
        Assignment.teacher_id == teacher_id,
    ]
    if room_id is not None:
        filters.append(Assignment.room_id == room_id)

    if asnmt_status is not None:
        filters.append(Assignment.status==asnmt_status)

    stmt = select(Assignment).filter(*filters)
    asnmts = db.execute(stmt).scalars().all()
    return asnmts
