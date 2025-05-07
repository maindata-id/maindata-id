from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
import uuid

# Request models
class GenerateSQLRequest(BaseModel):
    session_id: uuid.UUID
    question: str

class StartSessionRequest(BaseModel):
    title: Optional[str] = None

# Response models
class MessageModel(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SessionModel(BaseModel):
    id: uuid.UUID
    title: Optional[str] = None
    created_at: datetime
    messages: List[MessageModel] = []
    
    class Config:
        from_attributes = True

class StartSessionResponse(BaseModel):
    session_id: uuid.UUID
    created_at: datetime
    title: Optional[str] = None

class DatasetReference(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    url: str
    info_url: Optional[str] = None
    direct_source: str
    original_source: str
    source_at: datetime
    is_cors_allowed: bool
    slug: str
    
    class Config:
        from_attributes = True

class QueryReference(BaseModel):
    id: uuid.UUID
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
