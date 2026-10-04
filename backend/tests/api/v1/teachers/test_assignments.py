from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.db.schemas.assignment import Assignment, AssignmentStatus, AssignmentSubmission
from app.db.schemas.room import Room, RoomNames
from app.models.assignment import AssignmentCreate, AssignmentUpdate, SubmissionUpdate
from app.services.teachers.assignments import (
    create_assignment,
    get_teacher_asnmts_by_room,
    update_assignment,
    update_assignment_submission,
)


def _create_room(db):
    room = Room(name=RoomNames.INGE_1)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def test_teacher_can_create_assignment_without_files(client, db, teacher_auth_headers, teacher):
    room = _create_room(db)
    response = client.post(
        f"{settings.API_V1_STR}/teacher/assignments/",
        data={
            "title": "Algebra homework",
            "description": "Solve exercises 1-5",
            "room_id": str(room.id),
            "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        },
        headers=teacher_auth_headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Algebra homework"
    assert payload["teacher_id"] == str(teacher.id)
    assert payload["room_id"] == str(room.id)
    assert payload["media"] == []


def test_teacher_cannot_update_another_teachers_assignment(
    client,
    db,
    teacher_auth_headers,
    teacher,
    teacher_auth_headers_other,
):
    room = _create_room(db)
    assignment = Assignment(
        title="Owned assignment",
        description="Description",
        teacher_id=teacher.id,
        room_id=room.id,
        subject=teacher.subject,
        due_date=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add(assignment)
    db.commit()

    response = client.patch(
        f"{settings.API_V1_STR}/teacher/assignments/{assignment.id}",
        json={"title": "Unauthorized change"},
        headers=teacher_auth_headers_other,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Accès refusé"
    db.refresh(assignment)
    assert assignment.title == "Owned assignment"


def test_teacher_can_grade_submission_for_own_assignment(
    client,
    db,
    teacher_auth_headers,
    teacher,
    test_user_with_password,
):
    room = _create_room(db)
    assignment = Assignment(
        title="Graded assignment",
        teacher_id=teacher.id,
        room_id=room.id,
        subject=teacher.subject,
        due_date=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add(assignment)
    db.flush()
    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        student_id=test_user_with_password[0].id,
    )
    db.add(submission)
    db.commit()

    response = client.patch(
        f"{settings.API_V1_STR}/teacher/assignments/{assignment.id}/submissions/{submission.id}",
        json={"grade": 18, "feedback": "Très bien"},
        headers=teacher_auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["grade"] == 18
    assert response.json()["feedback"] == "Très bien"


def test_teacher_cannot_grade_submission_from_another_assignment(
    client,
    db,
    teacher_auth_headers,
    teacher,
    test_user_with_password,
):
    room = _create_room(db)
    assignments = [
        Assignment(
            title=f"Assignment {index}",
            teacher_id=teacher.id,
            room_id=room.id,
            subject=teacher.subject,
            due_date=datetime.now(timezone.utc) + timedelta(days=1),
        )
        for index in range(2)
    ]
    db.add_all(assignments)
    db.flush()
    submission = AssignmentSubmission(
        assignment_id=assignments[1].id,
        student_id=test_user_with_password[0].id,
    )
    db.add(submission)
    db.commit()

    response = client.patch(
        f"{settings.API_V1_STR}/teacher/assignments/{assignments[0].id}/submissions/{submission.id}",
        json={"grade": 1},
        headers=teacher_auth_headers,
    )

    assert response.status_code == 404
    db.refresh(submission)
    assert submission.grade is None


def test_teacher_assignment_service_create_update_and_filter(db, teacher):
    room = _create_room(db)

    created = create_assignment(
        db,
        AssignmentCreate(
            title="Math homework",
            description="Complete exercises 1 to 10",
            room_id=room.id,
            subject="Mathematics",
            due_date=datetime.now(timezone.utc) + timedelta(days=3),
        ),
        teacher.id,
    )

    assert created.teacher_id == teacher.id
    assert created.room_id == room.id

    filtered = get_teacher_asnmts_by_room(db, teacher.id, room_id=room.id)
    assert len(filtered) == 1
    assert filtered[0].title == "Math homework"

    updated = update_assignment(
        db,
        created.id,
        AssignmentUpdate(title="Math homework v2", status=AssignmentStatus.PUBLISHED.value),
    )
    assert updated.title == "Math homework v2"
    assert updated.status == AssignmentStatus.PUBLISHED

    with pytest.raises(HTTPException) as exc:
        update_assignment(db, uuid4(), AssignmentUpdate(title="Ghost assignment"))
    assert exc.value.status_code == 404


def test_teacher_assignment_submission_service_raises_when_submission_not_found(db, teacher):
    room = _create_room(db)
    assignment = Assignment(
        title="Presentation",
        description="Prepare a slide deck",
        teacher_id=teacher.id,
        room_id=room.id,
        subject="IT",
        due_date=datetime.now(timezone.utc) + timedelta(days=1),
        status=AssignmentStatus.PUBLISHED,
    )
    db.add(assignment)
    db.commit()

    with pytest.raises(HTTPException) as exc:
        update_assignment_submission(db, uuid4(), SubmissionUpdate(grade=18, feedback="Good work"))
    assert exc.value.status_code == 404
    assert exc.value.detail == "Soumission non trouvée"


class DummySession:
    def __init__(self, submission):
        self.submission = submission
        self.added = []
        self.committed = False

    def add(self, obj):
        self.added.append(obj)

    def execute(self, statement):
        class DummyResult:
            def scalar(result_self):
                return self.submission

        return DummyResult()

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        return None


def test_update_assignment_submission_updates_grade_and_feedback():
    submission = AssignmentSubmission(
        id=uuid4(),
        assignment_id=uuid4(),
        student_id=uuid4(),
        grade=5,
        feedback="ancien commentaire",
    )
    session = DummySession(submission)

    updated_submission = update_assignment_submission(
        db=session,
        submission_id=submission.id,
        new_data=SubmissionUpdate(grade=18, feedback="Très bien"),
    )

    assert updated_submission.grade == 18
    assert updated_submission.feedback == "Très bien"
    assert session.committed is True
    assert submission in session.added
