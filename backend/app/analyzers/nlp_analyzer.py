import re
import spacy
from typing import List, Dict, Any, Optional
from collections import Counter

try:
    nlp = spacy.load("en_core_web_sm")
    nlp.max_length = 5_000_000
except OSError:
    print("Warning: spaCy English model not found. Install with: python -m spacy download en_core_web_sm")
    nlp = None

def analyze_sentiment(lines: List[str]) -> Dict[str, Any]:
    positive_words = ["success", "completed", "ok", "good", "passed", "connected", "started"]
    negative_words = ["error", "failed", "exception", "timeout", "denied", "rejected", "critical"]

    pos = neg = neutral = 0
    for line in lines:
        lower = line.lower()
        if any(w in lower for w in negative_words):
            neg += 1
        elif any(w in lower for w in positive_words):
            pos += 1
        else:
            neutral += 1

    total = len(lines)
    return {
        "positive": pos,
        "negative": neg,
        "neutral": neutral,
        "total": total,
        "score": (pos - neg) / total if total else 0,
    }

def extract_entities_improved(text: str, doc=None) -> Dict[str, List[str]]:
    ip_regex = r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
    email_regex = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    url_regex = r"https?:\/\/[^\s]+"
    file_regex = r"[^\s]+\.(log|txt|json|xml|csv|sql|py|js|html|css)"
    
    ips = list(set(re.findall(ip_regex, text)))
    emails = list(set(re.findall(email_regex, text)))
    urls = list(set(re.findall(url_regex, text)))
    files = list(set(re.findall(file_regex, text)))
    
    if doc and nlp:
        try:
            spacy_entities = {
                "persons": [ent.text for ent in doc.ents if ent.label_ in ["PERSON"]],
                "organizations": [ent.text for ent in doc.ents if ent.label_ in ["ORG"]],
                "locations": [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]],
                "dates": [ent.text for ent in doc.ents if ent.label_ in ["DATE", "TIME"]],
            }
        except:
            spacy_entities = {"persons": [], "organizations": [], "locations": [], "dates": []}
    else:
        spacy_entities = {"persons": [], "organizations": [], "locations": [], "dates": []}

    return {
        "ips": ips[:20],
        "emails": emails[:10],
        "urls": urls[:10], 
        "files": files[:15],
        **spacy_entities
    }

def extract_keywords_improved(doc, lines: List[str]) -> List[Dict[str, Any]]:
    if doc and nlp:
        try:
            tokens = [token.text.lower() for token in doc 
                     if token.is_alpha and not token.is_stop 
                     and len(token.text) >= 3 and not token.is_punct]
        except:
            tokens = re.findall(r'\b\w{3,}\b', " ".join(lines).lower())
    else:
        stop_words = {"the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "use", "man", "she", "own", "say"}
        tokens = [word for word in re.findall(r'\b\w{3,}\b', " ".join(lines).lower()) 
                 if word not in stop_words and not word.isdigit()]

    total = len(tokens)
    if total == 0:
        return []
        
    counts = Counter(tokens).most_common(15)
    max_weight = 0.1
    
    return [
        {
            "word": word,
            "count": count,
            "weight": round(min(count / total if total else 0, max_weight), 4)
        }
        for word, count in counts
    ]

def classify_messages_improved(doc, lines: List[str]) -> Dict[str, int]:
    categories = {
        "authentication": ["login", "auth", "password", "token", "session", "user", "credential"],
        "database": ["sql", "query", "database", "connection", "table", "mysql", "postgres", "mongodb"],
        "network": ["http", "tcp", "connection", "request", "response", "socket", "port", "ssl"],
        "security": ["security", "access", "denied", "unauthorized", "blocked", "firewall", "attack"],
        "performance": ["slow", "timeout", "memory", "cpu", "performance", "load", "latency"],
        "error": ["error", "exception", "failed", "critical", "fatal", "panic"],
        "system": ["system", "kernel", "process", "service", "daemon", "startup", "shutdown"]
    }

    result = {key: 0 for key in categories}
    
    for line in lines:
        lower = line.lower()
        for cat, keywords in categories.items():
            if any(kw in lower for kw in keywords):
                result[cat] += 1
    
    return result

def detect_anomalies_improved(doc, lines: List[str]) -> List[Dict[str, Any]]:
    anomalies = []
    total = len(lines)
    
    if total == 0:
        return anomalies

    error_keywords = ["error", "exception", "failed", "critical", "fatal"]
    error_lines = [l for l in lines if any(keyword in l.lower() for keyword in error_keywords)]
    error_rate = len(error_lines) / total
    
    if error_rate > 0.1:
        anomalies.append({
            "type": "High Error Rate",
            "description": f"Високий рівень помилок: {len(error_lines)} з {total} записів ({error_rate:.1%})",
            "severity": "high" if error_rate > 0.3 else "medium"
        })

    ip_pattern = r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b"
    ips = re.findall(ip_pattern, " ".join(lines))
    ip_counts = Counter(ips)
    
    for ip, count in ip_counts.most_common(5):
        if count > max(50, total * 0.1):
            anomalies.append({
                "type": "Suspicious IP Activity",
                "description": f"IP {ip} з'являється {count} разів ({count/total:.1%} від всіх записів)",
                "severity": "medium" if count > total * 0.2 else "low"
            })

    time_pattern = r"\b(\d{1,2}):(\d{2}):(\d{2})\b"
    times = re.findall(time_pattern, " ".join(lines))
    
    if times:
        hours = [int(h) for h, m, s in times]
        hour_counts = Counter(hours)
        avg_per_hour = len(times) / 24
        
        for hour, count in hour_counts.most_common(3):
            if count > avg_per_hour * 3:
                anomalies.append({
                    "type": "Time-based Anomaly",
                    "description": f"Незвичайно висока активність о {hour:02d}:00 - {count} записів",
                    "severity": "low"
                })

    error_messages = [l for l in lines if "error" in l.lower()]
    if error_messages:
        error_patterns = {}
        for msg in error_messages:
            simplified = re.sub(r'\d+', 'N', msg.lower())[:50]
            error_patterns[simplified] = error_patterns.get(simplified, 0) + 1
        
        for pattern, count in error_patterns.items():
            if count >= 5:
                anomalies.append({
                    "type": "Repeated Error Pattern",
                    "description": f"Повторювана помилка {count} разів: {pattern[:40]}...",
                    "severity": "medium"
                })

    return anomalies

def generate_summary(lines: List[str]) -> Dict[str, Any]:
    total = len(lines)
    errors = sum(1 for l in lines if "error" in l.lower())
    warnings = sum(1 for l in lines if "warn" in l.lower())

    health_score = max(0, 100 - (errors / total) * 100 - (warnings / total) * 50) if total else 100
    recommendations = [
        "Високий рівень помилок потребує уваги" if errors > total * 0.05 else None,
        "Багато попереджень, рекомендується перевірка" if warnings > total * 0.1 else None,
        "Регулярний моніторинг логів допоможе виявити проблеми раніше"
    ]

    return {
        "totalLines": total,
        "errorCount": errors,
        "warningCount": warnings,
        "healthScore": health_score,
        "recommendations": [r for r in recommendations if r],
    }

def perform_nlp_analysis(text: str, lines: List[str]) -> Dict[str, Any]:
    max_text_length = 1_000_000
    if len(text) > max_text_length:
        text_for_nlp = text[:max_text_length]
        print(f"Текст обрізано до {max_text_length} символів для NLP аналізу")
    else:
        text_for_nlp = text
    
    doc = None
    if nlp:
        try:
            doc = nlp(text_for_nlp)
        except Exception as e:
            print(f"Помилка spaCy: {e}")
            doc = None

    sentiment_result = analyze_sentiment(lines)
    entities_result = extract_entities_improved(text, doc)
    keywords_result = extract_keywords_improved(doc, lines)
    classification_result = classify_messages_improved(doc, lines)
    anomalies_result = detect_anomalies_improved(doc, lines)
    summary_result = generate_summary(lines)

    return {
        "sentiment": sentiment_result,
        "entities": entities_result,
        "keywords": keywords_result,
        "classification": classification_result,
        "anomalies": anomalies_result,
        "summary": summary_result,
    }
