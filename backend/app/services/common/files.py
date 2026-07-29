import io
import re
from PIL import Image
from pathlib import Path
import shutil
import uuid
import cloudinary
import cloudinary.uploader 
from cloudinary.exceptions import NotFound
from fastapi import UploadFile, status, HTTPException
import httpx
from sqlalchemy.orm import Session

from app.db.schemas.user import User
from app.core.config import settings
from app.db.schemas.user import User

env = settings.ENV

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

class FileService:

    def __init__(self):
        self.ALLOWED_DOCUMENT_EXTENSIONS = settings.ALLOWED_DOCUMENT_EXTENSIONS
        self.ALLOWED_PHOTO_EXTENSIONS = settings.ALLOWED_PHOTO_EXTENSIONS
        if env == "dev":
            self.UPLOAD_DIR = settings.UPLOAD_DIR
            self.AVATAR_DIR = settings.AVATAR_DIR
    
    def upload_to_cloud(
        self,
        folder: str, 
        upload_file: UploadFile = None, 
        byte_file: bytes = None, 
        rt: str = "auto"
    ):

        public_id = f"{folder}/{uuid.uuid4()}"
        if upload_file:
            content = upload_file.file.read()
        if byte_file:
            content = byte_file

        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type=rt
        )
        return result["secure_url"], upload_file.filename if upload_file else None
    
    def upload_to_local(
        self,
        upload_file: UploadFile = None,
        byte_file: bytes = None,
    ):
        
        extension = ".jpg"  # Par défaut pour les bytes
        if upload_file and upload_file.filename:
            extension = Path(upload_file.filename).suffix
        
        # Générer un nom de fichier unique
        unique_filename = f"{uuid.uuid4()}{extension}"
        upload_dir = Path(self.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_loc = upload_dir / unique_filename
        file_path = f"http://127.0.0.1:8000/static/{unique_filename}"

        # # Créer le sous-dossier si nécessaire
        file_loc.parent.mkdir(exist_ok=True)
         
        if upload_file:           
            # Sauvegarder le fichier
            with file_loc.open("wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
        
        if byte_file:
            # byte_file.save(file_loc, "JPEG", quality=85)
            file_loc.write_bytes(byte_file)

        return str(file_path), upload_file.filename if upload_file else None

    def save_upload_file(
        self,
        *,
        upload_file: UploadFile = None,
        resized_file: bytes = None,
        post_type: str = None,
        resized: bool = False,
        is_avatar: bool = False,
        is_post_file: bool = False,
        is_room_file: bool = False,
        room_id: uuid.UUID = None, 
        is_chat_file: bool = False
    ) -> tuple[str, str | None]:
        
        """Sauvegarder le fichier uploadé et retourner le chemin et le nom"""

        # si on reçoit un fichier uploadé depuis un formulaire
        if upload_file:

            # extraire l'extension du fichier
            file_ext = Path(upload_file.filename or "").suffix.lower()

            if is_post_file:
            
                # vérifier si le type de fichier est autorisé
                if post_type == "photo" and file_ext not in self.ALLOWED_PHOTO_EXTENSIONS:
                    return None, None
                
                if post_type == "document" and file_ext not in self.ALLOWED_DOCUMENT_EXTENSIONS:
                    return None, None

                if env == "prod":
                    folder = f"esat_hub/posts/{post_type}"
                    result = self.upload_to_cloud(
                        upload_file=upload_file,
                        folder=folder
                    )
                    return result
                
                if env == "dev":
                    return self.upload_to_local(upload_file)
        
            if is_room_file or is_chat_file:
                if file_ext not in self.ALLOWED_PHOTO_EXTENSIONS and file_ext not in self.ALLOWED_DOCUMENT_EXTENSIONS:
                    return None, None

                folder = f"esat_hub/room/media/{room_id}"
                if is_chat_file:
                    folder = f"esat_hub/chat/media"
                
                if env == "prod":
                    result = self.upload_to_cloud(
                        upload_file=upload_file,
                        folder=folder
                    )
                if env == "dev":
                    result = self.upload_to_local(
                        upload_file=upload_file,
                    )
                return result
            
        # si on reçoit du contenu binaire
        if resized and resized_file: 
            
            # si c'est un avatar
            if is_avatar:
                if env == "prod":
                    folder = "esat_hub/avatars"
                    result = self.upload_to_cloud(
                        byte_file=resized_file,
                        folder=folder
                    )
                    return result
                if env == "dev":
                    return self.upload_to_local(byte_file=resized_file)
                
        return None, None

    def delete_file_path(self, file_path: str):

        if env == "prod":
            try:
                # Extraire le public_id depuis l'URL
                part = file_path.split("/upload/")[1]
                public_id = part.split(".")[0]
                cloudinary.uploader.destroy(public_id)
            except Exception:
                pass
        if env == "env":
            if Path(file_path).exists():
                Path(file_path).unlink()
    
    def resize_image(self, content: bytes, max_size: tuple[int, int] = (800, 800)) -> bytes:

        # créer un fichier virtuel en mémoire à partir du contenu binaire
        image = Image.open(io.BytesIO(content))

        # convertir en RGB pour éviter les problèmes avec les PNG par exemple
        image = image.convert("RGB")

        # redimensionner l'image en gardant le ratio
        image.thumbnail(max_size)

        # on crée un buffer en mémoire pour sauvegarder l'image redimensionnée
        buffer = io.BytesIO()

        # on sauvegarde l'image dans ce buffer au format WEBP (plus léger et gère la transparence de l'image)
        image.save(buffer, format="JPEG", quality=85)

        # on retourne le contenu binaire du buffer
        return buffer.getvalue()

    def update_avatar(self, db: Session, current_user: User, new_avatar_path: str):

        current_user.avatar_path = new_avatar_path
        db.commit()
      