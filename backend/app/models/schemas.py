from pydantic import BaseModel
from typing import List, Dict, Any, Literal, Optional

class LogEntry(BaseModel):
    timestamp: str
    level: Literal["ERROR", "WARNING", "INFO", "DEBUG"]
    message: str
    source: Optional[str] = None

class LogRequest(BaseModel):
    log_data: str

class LogData(BaseModel):
    log_data: str

class AnalysisResult(BaseModel):
    sentiment: Dict[str, Any]
    entities: Dict[str, List[str]]
    keywords: List[Dict[str, Any]]
    classification: Dict[str, int]
    anomalies: List[Dict[str, Any]]
    summary: Dict[str, Any]

class LogAnalysisResult(BaseModel):
    stats: Dict[str, int]
    entries: List[LogEntry]
    topErrors: List[Dict[str, Any]]
    timeAnalysis: Dict[str, int]
    patterns: Dict[str, Any]
    integrity: Dict[str, Any]
