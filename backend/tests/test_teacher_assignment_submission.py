import uuid

from app.db.schemas.assignment import AssignmentSubmission
from app.models.assignment import SubmissionUpdate
from app.services.teachers.assignments import update_assignment_submission


class DummySession:
    def __init__(self, submission):
        self.submission = submission
        self.added = []
        self.committed = False

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        return None


def test_update_assignment_submission_updates_grade_and_feedback():
    submission = AssignmentSubmission(
        id=uuid.uuid4(),
        assignment_id=uuid.uuid4(),
        student_id=uuid.uuid4(),
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
