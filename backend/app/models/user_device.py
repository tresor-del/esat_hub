from pydantic import BaseModel, BeforeValidator
from uuid import UUID
from typing import Annotated

# Fonction magique qui nettoie les chaînes de texte avant validation
def clean_uuid_string(v: any) -> any:
    if isinstance(v, str):
        cleaned = v.strip() # Enlève les espaces invisibles au début et à la fin
        if not cleaned or cleaned == "" or cleaned == "null":
            # Si Kodular envoie du texte vide, on lève une erreur propre
            raise ValueError("L'ID utilisateur ne peut pas être vide")
        return cleaned
    return v

# On crée un type d'UUID sécurisé
SafeUUID = Annotated[UUID, BeforeValidator(clean_uuid_string)]

class DeviceRegistration(BaseModel):
    user_id: SafeUUID  
    device_token: str
