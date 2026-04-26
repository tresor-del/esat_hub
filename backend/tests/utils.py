import random, string
from enum import Enum

from sqlalchemy import select
from app.models.user import UserCreate, UserInDatabase
from app.db.schemas.user import Domain, School, Level, Year, Major, UserRole, UserStatus
from app.db.security import hash_password

def random_string() -> str:
    return ''.join(random.choices(string.ascii_lowercase, k=10))

def random_email(domain: str = "example.com") -> str:
    return f"{random_string()}@{domain}"

def random_enum(enum_class: Enum) -> Enum:
    return random.choice(list(enum_class))

def random_user_data() -> UserCreate:

    user_data = UserCreate(
        first_name=random_string(),
        last_name=random_string(),
        profil_name=random_string(),
        email=random_email(),
        password=random_string(),
        school_name=random_enum(School),
        domain=random_enum(Domain),
        level=random_enum(Level),
        year=random_enum(Year),
        major=random_enum(Major),
        role=random_enum(UserRole)
    )

    return user_data

def random_user_in_db() -> tuple[UserInDatabase, str]:
    test_user_password = random_string()
    print("original pwd :", test_user_password)
    user_data = UserInDatabase(
        first_name=random_string(),
        last_name=random_string(),
        profil_name=random_string(),
        username=random_string(),
        email=random_email(),
        hashed_password=hash_password(test_user_password),
        school_name=random_enum(School),
        domain=random_enum(Domain),
        level=random_enum(Level),
        year=random_enum(Year),
        major=random_enum(Major),
        status=UserStatus.ACTIVE,
        role=UserRole.STUDENT,
        phone_number=random_string(),
        birthday="2000-01-01",
        card_number=random_string(),
        user_room_id=None
    )

    return user_data, test_user_password

def make_db_request(db, model, **kwargs):
    statement = select(model).where(model.__table__.c.get(kwargs["field"]) == kwargs["value"])
    record = db.execute(statement).scalars().first()
    return record