import logging

def setup_logging():
    """
    Configuration du système de log.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        force=True
    )