import re
from typing import List, Dict, Any
from datetime import datetime
from collections import Counter

from app.models.schemas import LogEntry
from app.parsers.log_parser import parse_log_line

def analyze_logs_structure(log_data: str) -> Dict[str, Any]:
    lines = log_data.strip().split("\n")
    entries = []

    for line in lines:
        entry = parse_log_line(line)
        if entry:
            entries.append(entry)

    stats = {
        "total": len(entries),
        "errors": sum(1 for e in entries if e.level == "ERROR"),
        "warnings": sum(1 for e in entries if e.level == "WARNING"),
        "info": sum(1 for e in entries if e.level == "INFO"),
        "debug": sum(1 for e in entries if e.level == "DEBUG"),
        "malformed": sum(1 for e in entries if "MALFORMED LOG" in e.message),
        "corrupted_lines": len(lines) - len(entries)
    }

    top_errors = analyze_top_errors(entries)
    time_analysis = analyze_time_patterns(entries)
    patterns = analyze_patterns(entries, log_data)
    integrity_check = analyze_integrity(lines, entries)

    result = {
        "stats": stats,
        "entries": entries[:100],
        "topErrors": top_errors,
        "timeAnalysis": time_analysis,
        "patterns": patterns,
        "integrity": integrity_check
    }
    
    return result

def analyze_top_errors(entries: List[LogEntry]) -> List[Dict[str, Any]]:
    error_messages = [e.message for e in entries if e.level == "ERROR"]
    error_counts = {}
    
    for msg in error_messages:
        key = msg[:100]
        error_counts[key] = error_counts.get(key, 0) + 1
    
    top_errors = sorted(error_counts.items(), key=lambda x: -x[1])[:5]
    return [{"message": msg, "count": count} for msg, count in top_errors]

def analyze_time_patterns(entries: List[LogEntry]) -> Dict[str, int]:
    time_analysis = {}
    
    for entry in entries:
        try:
            hour = datetime.fromisoformat(entry.timestamp).hour
            time_analysis[hour] = time_analysis.get(hour, 0) + 1
        except:
            continue
            
    return time_analysis

def analyze_patterns(entries: List[LogEntry], log_data: str) -> Dict[str, Any]:
    ips = re.findall(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", log_data)
    ip_counts = Counter(ips)
    suspicious_ips = [ip for ip, count in sorted(ip_counts.items(), key=lambda x: -x[1])[:10]]

    frequent_keywords = extract_frequent_keywords(entries)

    return {
        "suspiciousIPs": suspicious_ips,
        "frequentKeywords": frequent_keywords,
    }

def extract_frequent_keywords(entries: List[LogEntry]) -> List[Dict[str, Any]]:
    all_words = []
    
    for entry in entries:
        words = re.findall(r"\b\w{4,}\b", entry.message.lower())
        all_words.extend(word for word in words if not word.isdigit())
    
    word_counts = Counter(all_words)
    frequent_keywords = word_counts.most_common(10)
    
    return [{"word": word, "count": count} for word, count in frequent_keywords]

def analyze_integrity(lines: List[str], entries: List[LogEntry]) -> Dict[str, Any]:
    malformed_entries = sum(1 for e in entries if "MALFORMED LOG" in e.message)
    unparsable_lines = len(lines) - len(entries)
    
    integrity_score = 100
    if lines:
        valid_entries = len(entries) - malformed_entries
        integrity_score = round((valid_entries / len(lines)) * 100, 2)
    
    issues = []
    
    if malformed_entries > 0:
        issues.append(f"Виявлено {malformed_entries} пошкоджених записів")
    if unparsable_lines > 0:
        issues.append(f"Не вдалося розпарсити {unparsable_lines} рядків")
    if integrity_score < 95:
        issues.append("Низька цілісність даних - рекомендується перевірка лог-файлу")

    return {
        "total_lines": len(lines),
        "parsed_entries": len(entries),
        "malformed_entries": malformed_entries,
        "unparsable_lines": unparsable_lines,
        "integrity_score": integrity_score,
        "issues": issues
    }
