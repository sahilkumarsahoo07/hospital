from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging

router = APIRouter(tags=["realtime"])
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # active_connections maps user_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # study_viewers maps study_id -> set of user_ids viewing it
        self.study_viewers: Dict[str, set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Total active connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remove user from all study viewers when they disconnect completely
        if user_id not in self.active_connections:
            for study_id in list(self.study_viewers.keys()):
                if user_id in self.study_viewers[study_id]:
                    self.study_viewers[study_id].remove(user_id)
                if not self.study_viewers[study_id]:
                    del self.study_viewers[study_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                await connection.send_json(message)
                
    async def broadcast_to_study(self, study_id: str, message: dict):
        if study_id in self.study_viewers:
            for user_id in self.study_viewers[study_id]:
                await self.send_personal_message(message, user_id)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            action = event.get("action")
            
            if action == "join_study":
                study_id = event.get("studyId")
                if study_id:
                    if study_id not in manager.study_viewers:
                        manager.study_viewers[study_id] = set()
                    manager.study_viewers[study_id].add(user_id)
                    # Broadcast to others that someone joined
                    await manager.broadcast_to_study(study_id, {
                        "type": "viewer_joined",
                        "studyId": study_id,
                        "userId": user_id
                    })
                    
            elif action == "leave_study":
                study_id = event.get("studyId")
                if study_id and study_id in manager.study_viewers:
                    if user_id in manager.study_viewers[study_id]:
                        manager.study_viewers[study_id].remove(user_id)
                        await manager.broadcast_to_study(study_id, {
                            "type": "viewer_left",
                            "studyId": study_id,
                            "userId": user_id
                        })
                    if not manager.study_viewers[study_id]:
                        del manager.study_viewers[study_id]
                        
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
