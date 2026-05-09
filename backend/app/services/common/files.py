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
from sqlalchemy.orm import Session

from app.db.schemas.user import User
from app.core.config import settings
from app.db.schemas.user import User

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
        # self.UPLOAD_DIR = settings.UPLOAD_DIR
        # self.AVATAR_DIR = settings.AVATAR_DIR

    def save_upload_file(
        self,
        *,
        upload_file: UploadFile = None,
        resized_file: bytes = None,
        post_type: str = None,
        resized: bool = False,
        is_avatar: bool = False,
        is_post_file: bool = True,
    ) -> tuple[str, str | None]:
        
        """Sauvegarder le fichier uploadé et retourner le chemin et le nom"""

        # si on reçoit un fichier uploadé depuis un formulaire (pour les posts)
        if upload_file and is_post_file:

            file_ext = Path(upload_file.filename).suffix.lower()
        
            if post_type == "photo" and file_ext not in self.ALLOWED_PHOTO_EXTENSIONS:
                return None, None
            
            if post_type == "document" and file_ext not in self.ALLOWED_DOCUMENT_EXTENSIONS:
                return None, None
        
            # Générer un nom de fichier unique
            # unique_filename = f"{uuid.uuid4()}{file_ext}"
            # upload_dir = Path(self.UPLOAD_DIR)
            # upload_dir.mkdir(exist_ok=True)
            # file_path = upload_dir / post_type / unique_filename

            # # Créer le sous-dossier si nécessaire
            # file_path.parent.mkdir(exist_ok=True)
            
            # # Sauvegarder le fichier
            # with file_path.open("wb") as buffer:
            #     shutil.copyfileobj(upload_file.file, buffer)

            content = upload_file.file.read()
            folder = f"esat_hub/{post_type}"
            public_id = f"{folder}/{uuid.uuid4()}"

            result = cloudinary.uploader.upload(
                content,
                public_id=public_id,
                resource_type="auto"
            )
            return result["secure_url"], upload_file.filename
        
        # si on reçoit du contenu binaire
        if resized and resized_file: 
            
            # si c'est un avatar
            if is_avatar:
                public_id = f"esat_hub/avatars/{uuid.uuid4()}"
                result = cloudinary.uploader.upload(
                    resized_file,
                    public_id=public_id,
                    resource_type="image"
                )
                return result["secure_url"], upload_file.filename if upload_file else None

        return None, None
                # Sauvegarder avec un nom unique
        #         filename = f"{uuid.uuid4()}.jpg"
        #         file_path = Path(self.AVATAR_DIR) / filename
        #         file_path.parent.mkdir(exist_ok=True)
        #         # resized_file.save(file_path, "JPEG", quality=85)
        #         Path(file_path).write_bytes(resized_file)
        
        # return str(file_path), upload_file.filename if upload_file else None

    def delete_file_path(self, file_path: str):

        try:
            # Extraire le public_id depuis l'URL
            part = file_path.split("/upload/")[1]
            public_id = part.split(".")[0]
            cloudinary.uploader.destroy(public_id)
        except Exception:
            pass

        # if Path(file_path).exists():
        #     Path(file_path).unlink()
    
    def resize_image(self, content: bytes, max_size: tuple[int, int] = (800, 800)) -> bytes:

        # créer un fichier virtuel en mémoire à partir du contenu binaire
        image = Image.open(io.BytesIO(content))

        # convertir en RGB pour éviter les problèmes avec les PNG par exemple
        image = image.convert("RGB")

        # redimensionner l'image en gardant le ratio
        image.thumbnail(max_size)

        # on crée un buffer en mémoire pour sauvegarder l'image redimensionnée
        buffer = io.BytesIO()

        # on sauvegarde l'image dans ce buffer au format JPEG
        image.save(buffer, format="JPEG", quality=85)

        # on retourne le contenu binaire du buffer
        return buffer.getvalue()

    def update_avatar(self, db: Session, current_user: User, new_avatar_path: str):

        current_user.avatar_path = new_avatar_path
        db.commit()

    def check_file_exists(self, input_value: str):
        """
        Vérifie si un fichier existe. 
        L'input peut être un public_id ou une URL complète.
        """
        if not input_value:
            return False
            
        public_id = input_value
        resource_type = "image" # Par défaut

        # Correction : on cherche 'res.cloudinary.com' ou 'cloudinary.com'
        if "cloudinary.com" in input_value:
            # Déterminer le type de ressource pour les fichiers non-images (PDF, etc.)
            if "/raw/upload/" in input_value:
                resource_type = "raw"
            elif "/video/upload/" in input_value:
                resource_type = "video"

            # Regex robuste : capture tout après /upload/ (ignore v123...) jusqu'à l'extension
            pattern = r"/upload/(?:v\d+/)?(.+?)(?:\.[a-z0-9]{3,4})?$"
            match = re.search(pattern, input_value)
            if match:
                public_id = match.group(1)

        try:
            # On passe le resource_type pour gérer les documents et images
            cloudinary.api.resource(public_id, resource_type=resource_type)
            return True
        except NotFound:
            return False
        except Exception as e:
            # En FastAPI, il vaut mieux logger l'erreur ici
            raise HTTPException(
                status_code=500, 
                detail=f"Erreur lors de la vérification Cloudinary : {str(e)}"
            )
        
        
