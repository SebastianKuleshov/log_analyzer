from typing import Literal
from datetime import datetime

def normalize_log_level(level: str) -> Literal["ERROR", "WARNING", "INFO", "DEBUG"]:
    if not level:
        return "INFO"
    
    level_upper = level.upper().strip()
    
    level_mapping = {
        "ERROR": "ERROR",
        "ERR": "ERROR", 
        "CRITICAL": "ERROR",
        "CRIT": "ERROR",
        "FATAL": "ERROR",
        "PANIC": "ERROR",
        "EMERGENCY": "ERROR",
        "EMERG": "ERROR",
        "ALERT": "ERROR",
        "WARNING": "WARNING",
        "WARN": "WARNING",
        "CAUTION": "WARNING",
        "INFO": "INFO",
        "INFORMATION": "INFO",
        "NOTICE": "INFO",
        "NOTE": "INFO",
        "DEBUG": "DEBUG",
        "TRACE": "DEBUG",
        "VERBOSE": "DEBUG",
        "FINE": "DEBUG",
        "FINEST": "DEBUG",
    }
    
    return level_mapping.get(level_upper, "INFO")

def safe_timestamp_apache(timestamp_str: str) -> str:
    try:
        dt = datetime.strptime(timestamp_str, "%d/%b/%Y:%H:%M:%S %z")
        return dt.isoformat()
    except Exception:
        return datetime.utcnow().isoformat()

def safe_timestamp_syslog(timestamp_str: str) -> str:
    try:
        current_year = datetime.now().year
        dt = datetime.strptime(f"{current_year} {timestamp_str}", "%Y %b %d %H:%M:%S")
        return dt.isoformat()
    except Exception:
        return datetime.utcnow().isoformat()

def safe_timestamp(value: str) -> str:
    try:
        return datetime.fromisoformat(value).isoformat()
    except Exception:
        try:
            return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").isoformat()
        except Exception:
            return datetime.utcnow().isoformat()
