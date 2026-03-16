import asyncio

from fastapi import FastAPI, WebSocket
import app.api.v1.state as state

app = FastAPI()

# structure de donnée pour stocker les connexions
conn = set()
# Création d'un évenement qui va permettre de mettre en pause les coroutines
# et de les déclencher que quand il y a un message
event = asyncio.Event()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    # On accepte les connexions qui rentrent
    await websocket.accept()
    # et on les ajoutes à la liste des connnexions existantes
    conn.add(websocket)


    # boucle pour garder la connexion ouverte
    while True:

        try:
            # on attend qu'un évenement soit déclenché 
            # pour envoyer des notifications
            await event.wait()
            for websocket in conn:
                await websocket.send(state.current_message)

        except:
            pass
        
        # a la fin on nettoie le status de l'evenement
        event.clear()
        
