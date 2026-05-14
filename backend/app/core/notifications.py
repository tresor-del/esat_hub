from enum import Enum
from typing import Optional
from uuid import UUID


class NotificationType(str, Enum):
    """Types de notifications disponibles"""

    # Commentaires
    NEW_COMMENT = "new_comment"
    COMMENT_REPLY = "comment_reply"
    
    # Statut utilisateur
    STATUS_UPDATE = "STATUS_UPDATE"
    
    # Admin
    USER_APPROVED = "user.approved"
    USER_REJECTED = "user.rejected"
    USER_SUSPENDED = "user.suspended"
    

class NotificationContentBuilder:
    """Builder pour créer les contenus de notifications"""
    
    @staticmethod
    def new_comment(
        username: str,
        post_title: str,
        comment_preview: str,
        is_reply: bool = False
    ) -> str:
        """Contenu pour un nouveau commentaire"""
        if is_reply:
            return f"{username} a répondu à votre commentaire."
        return f"{username} a commenté votre post."
    
    @staticmethod
    def new_post(
        username: str,
        post_title: str,
        post_type: str ,
        is_general: bool = False,
    ) -> str:
        """Contenu pour un nouveau post"""
        if post_type == "photo":
            return f"{username} a publier une photo."
        elif post_type == "document":
            return f"{username} a publier un document."
        return f"{username} a fait une publication."

    @staticmethod
    def status_update(new_status: str) -> str:
        """Contenu pour une mise à jour de statut"""
        return f"Le statut de votre compte est changé à {new_status}"
    
    @staticmethod
    def user_approved() -> str:
        """Contenu pour approbation d'utilisateur"""
        return "Votre compte a été approuvé. Vous pouvez maintenant accéder à toutes les fonctionnalités."
    
    @staticmethod
    def user_rejected(reason: Optional[str] = None) -> str:
        """Contenu pour rejet d'utilisateur"""
        if reason:
            return f"Votre demande d'inscription a été rejetée. Raison: {reason}"
        return "Votre demande d'inscription a été rejetée."
    
    @staticmethod
    def user_suspended(duration: str, reason: str) -> str:
        """Contenu pour suspension d'utilisateur"""
        return f"Votre compte a été suspendu pour {duration}. Raison: {reason}"
    

notification_contents = NotificationContentBuilder()