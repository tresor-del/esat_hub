import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.core.config import settings
from app.db.schemas.assignment import Assignment, AssignmentStatus, AssignmentSubmission
from app.db.schemas.room import AttendanceRecord, CourseSession, Room, RoomNames, SessionStatus
from app.db.schemas.user import Level, User, Year
from app.models.assignment import SubmissionCreate
from app.services.social.room import RoomService


def _prepare_student_and_assignment(db, student):
    room = Room(name=RoomNames.PREPA_1)
    db.add(room)
    db.flush()
    student.user_room_id = room.id
    assignment = Assignment(
        title="Published homework",
        description="Submit your work",
        teacher_id=student.id,
        room_id=room.id,
        subject="Mathematics",
        due_date=datetime.now(timezone.utc) + timedelta(days=5),
        status=AssignmentStatus.PUBLISHED,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return room, assignment


def test_student_can_list_published_room_assignments(
    client,
    db,
    test_user_with_password,
    access_token_for_test_user,
):
    student, _ = test_user_with_password
    _, assignment = _prepare_student_and_assignment(db, student)
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}

    response = client.get(
        f"{settings.API_V1_STR}/rooms/assignments/",
        headers=headers,
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [str(assignment.id)]


def test_student_can_submit_assignment_without_files(
    client,
    db,
    test_user_with_password,
    access_token_for_test_user,
):
    student, _ = test_user_with_password
    _, assignment = _prepare_student_and_assignment(db, student)
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}

    response = client.post(
        f"{settings.API_V1_STR}/rooms/assignments/",
        data={"assignment_id": str(assignment.id)},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["assignment_id"] == str(assignment.id)
    assert response.json()["student_id"] == str(student.id)
    assert response.json()["media"] == []


def test_student_cannot_submit_unpublished_assignment(
    client,
    db,
    test_user_with_password,
    access_token_for_test_user,
):
    student, _ = test_user_with_password
    room = Room(name=RoomNames.PREPA_2)
    db.add(room)
    db.flush()
    student.user_room_id = room.id
    assignment = Assignment(
        title="Draft homework",
        teacher_id=student.id,
        room_id=room.id,
        subject="Mathematics",
        due_date=datetime.now(timezone.utc) + timedelta(days=5),
        status=AssignmentStatus.DRAFT,
    )
    db.add(assignment)
    db.commit()
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}

    response = client.post(
        f"{settings.API_V1_STR}/rooms/assignments/",
        data={"assignment_id": str(assignment.id)},
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Non autorisé à envoyer des solutions pour ce devoir"


def _create_room_for_service(db, room_name=RoomNames.INGE_1):
    room = Room(name=room_name)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def test_room_service_assigns_default_room_from_level_and_year(db, test_user_with_password):
    student, _ = test_user_with_password
    student.user_room_id = None
    student.level = Level.PREPA
    student.year = Year.PREMIERE_ANNEE
    db.add(student)

    room = _create_room_for_service(db, RoomNames.PREPA_1)
    service = RoomService(db)

    result = service.get_user_room(student)

    assert result is not None
    assert result.id == room.id
    assert student.user_room_id == room.id


def test_room_service_can_create_and_mark_session_present(db, teacher, test_user_with_password):
    student, _ = test_user_with_password
    room = _create_room_for_service(db, RoomNames.INGE_1)
    teacher.user_room_id = room.id
    student.user_room_id = room.id
    db.add(teacher)
    db.add(student)
    db.commit()

    service = RoomService(db)
    created = service.create_session(teacher, "Algorithms")
    session = db.query(CourseSession).filter(CourseSession.id == UUID(str(created["session_id"]))).one()

    assert session.course == "Algorithms"
    assert session.room_id == room.id
    assert session.status == SessionStatus.ACTIVE

    asyncio.run(service.mark_present(session.qr_token, str(student.id)))

    attendance = (
        db.query(AttendanceRecord)
        .filter_by(session_id=session.id, student_id=student.id)
        .one()
    )
    assert attendance is not None
    assert attendance.is_present is True


def test_room_service_close_session_and_history(db, teacher):
    room = _create_room_for_service(db, RoomNames.PREPA_2)
    teacher.user_room_id = room.id
    db.add(teacher)
    db.commit()

    session = CourseSession(
        course="Physics",
        session_author_id=teacher.id,
        qr_token="history-token-123",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        room_id=room.id,
        status=SessionStatus.ACTIVE,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    db.add(AttendanceRecord(session_id=session.id, student_id=teacher.id))
    db.commit()

    service = RoomService(db)
    result = service.close_session(str(session.id), str(teacher.id))
    history = service.get_session_history(str(teacher.id))

    assert result["message"] == "Session fermée"
    assert result["total_present"] == 1
    assert history[0]["sessions"][0]["course"] == "Physics"
    assert history[0]["total_present"] == 1
