from pydantic import BaseModel, Field, UUID4
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
import uuid

# Request models
class GenerateSQLRequest(BaseModel):
    session_id: UUID4
    question: str

class StartSessionRequest(BaseModel):
    title: Optional[str] = None

# Response models
class MessageModel(BaseModel):
    id: UUID4
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SessionModel(BaseModel):
    id: UUID4
    title: Optional[str] = None
    created_at: datetime
    messages: List[MessageModel] = []
    
    class Config:
        from_attributes = True

class StartSessionResponse(BaseModel):
    session_id: UUID4
    created_at: datetime
    title: Optional[str] = None

class DatasetReference(BaseModel):
    id: UUID4
    title: str
    description: str
    url: Optional[str] = None
    info_url: Optional[str] = None
    source: str
    source_at: datetime
    
    class Config:
        from_attributes = True

class QueryReference(BaseModel):
    id: UUID4
    title: str
    description: str
    sql_query: str
    
    class Config:
        from_attributes = True

class GenerateSQLResponse(BaseModel):
    sql: str
    datasets_used: List[DatasetReference]
    reference_queries_used: List[QueryReference]
    explanation: str
    messages: List[MessageModel]

# Error models
class ErrorResponse(BaseModel):
    detail: str
