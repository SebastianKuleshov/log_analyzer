import re
import json
from typing import Optional
from datetime import datetime

from app.models.schemas import LogEntry
from app.utils.log_utils import (
    normalize_log_level, 
    safe_timestamp_apache, 
    safe_timestamp_syslog, 
    safe_timestamp
)

def parse_log_line(line: str) -> Optional[LogEntry]:
    if not line.strip():
        return None
    
    log_format = detect_log_format(line)
    
    if log_format == "apache":
        return parse_apache_log(line)
    elif log_format == "application":
        return parse_application_log(line)
    elif log_format == "system":
        return parse_system_log(line)
    elif log_format == "json":
        return parse_json_log(line)
    else:
        if is_potentially_valid_log(line):
            return LogEntry(
                timestamp=datetime.utcnow().isoformat(),
                level="INFO",
                message=line.strip(),
                source="unknown_format"
            )
        else:
            return create_malformed_entry(line, "Corrupted or incomplete log entry")

def detect_log_format(line: str) -> str:
    line = line.strip()
    
    if re.match(r'^\S+ \S+ \S+ \[.*?\] ".*?" \d+ \d+', line):
        return "apache"
    
    if line.startswith('{') and line.endswith('}'):
        return "json"
    
    if re.match(r'^\d{4}-\d{2}-\d{2}.*?\[(ERROR|WARN|INFO|DEBUG)\]', line, re.IGNORECASE):
        return "application"
    
    if re.match(r'^(ERROR|WARN|INFO|DEBUG|TRACE)\s+', line, re.IGNORECASE):
        return "application"
    
    if re.match(r'^[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', line):
        return "system"
    
    if re.match(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', line):
        return "application"
    
    return "unknown"

def is_potentially_valid_log(line: str) -> bool:
    line = line.strip()
    
    if len(line) < 10:
        return False
    
    if not re.search(r'[a-zA-Z]', line):
        return False
    
    suspicious_endings = [
        r'\s+$',
        r':\d{1,2}$',
        r'\[$',
        r'"[^"]*$',
    ]
    
    for pattern in suspicious_endings:
        if re.search(pattern, line):
            return False
    
    return True

def parse_apache_log(line: str) -> Optional[LogEntry]:
    pattern = r'^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]*)" (\d+) (\d+|-) "([^"]*)" "([^"]*)"'
    match = re.match(pattern, line)
    
    if not match:
        return create_malformed_entry(line, "Invalid Apache log format")
    
    ip, timestamp, request, status, size, referer, user_agent = match.groups()
    
    if not all([ip, timestamp, request, status]):
        return create_malformed_entry(line, "Incomplete Apache log entry - missing critical fields")
    
    try:
        status_code = int(status)
        if status_code >= 500:
            level = "ERROR"
        elif status_code >= 400:
            level = "WARNING"
        else:
            level = "INFO"
    except ValueError:
        return create_malformed_entry(line, "Invalid HTTP status code")
    
    return LogEntry(
        timestamp=safe_timestamp_apache(timestamp),
        level=normalize_log_level(level),
        message=f"{request} -> {status} {size}",
        source=ip
    )

def parse_application_log(line: str) -> Optional[LogEntry]:
    patterns = [
        r"^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+\[(\w+)\]\s+(.+)$",
        r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+(.+)$",
        r"^(\w+)\s+(\d{4}-\d{2}-\d{2}.*?)\s+(.+)$",
        r"^\[(\w+)\]\s+(.+)$",
    ]
    
    for i, pattern in enumerate(patterns):
        match = re.match(pattern, line)
        if match:
            if i == 0 or i == 1:
                timestamp, level, message = match.groups()
                return LogEntry(
                    timestamp=safe_timestamp(timestamp),
                    level=normalize_log_level(level),
                    message=message
                )
            elif i == 2:
                level, timestamp, message = match.groups()
                return LogEntry(
                    timestamp=safe_timestamp(timestamp),
                    level=normalize_log_level(level),
                    message=message
                )
            elif i == 3:
                level, message = match.groups()
                return LogEntry(
                    timestamp=datetime.utcnow().isoformat(),
                    level=normalize_log_level(level),
                    message=message
                )
    
    return None

def parse_system_log(line: str) -> Optional[LogEntry]:
    pattern = r'^([A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(.+)$'
    match = re.match(pattern, line)
    
    if match:
        timestamp_str, hostname, message = match.groups()
        level = "ERROR" if any(word in message.lower() for word in ["error", "fail", "critical"]) else "INFO"
        
        return LogEntry(
            timestamp=safe_timestamp_syslog(timestamp_str),
            level=normalize_log_level(level),
            message=message,
            source=hostname
        )
    
    return None

def parse_json_log(line: str) -> Optional[LogEntry]:
    try:
        data = json.loads(line)
        
        timestamp = data.get('timestamp', data.get('time', data.get('@timestamp')))
        level = data.get('level', data.get('severity', 'INFO'))
        message = data.get('message', data.get('msg', str(data)))
        source = data.get('source', data.get('service', data.get('component')))
        
        return LogEntry(
            timestamp=safe_timestamp(timestamp) if timestamp else datetime.utcnow().isoformat(),
            level=normalize_log_level(str(level)),
            message=str(message),
            source=str(source) if source else None
        )
    except (json.JSONDecodeError, Exception):
        return create_malformed_entry(line, "Invalid JSON log format")

def create_malformed_entry(line: str, reason: str) -> LogEntry:
    return LogEntry(
        timestamp=datetime.utcnow().isoformat(),
        level="ERROR",
        message=f"MALFORMED LOG: {reason} - Original: {line[:100]}{'...' if len(line) > 100 else ''}",
        source="log_parser"
    )
