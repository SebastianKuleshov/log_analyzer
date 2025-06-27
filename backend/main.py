from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime

from app.models.schemas import LogRequest, LogData
from app.analyzers.nlp_analyzer import perform_nlp_analysis
from app.analyzers.log_analyzer import analyze_logs_structure

app = FastAPI(title="Log Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_analysis: Optional[dict] = None
last_analysis_time: Optional[str] = None
latest_log_analysis: Optional[dict] = None
last_log_analysis_time: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Log Analyzer API", "version": "1.0.0"}

@app.get("/dashboard-summary")
def get_dashboard_summary():
    if latest_log_analysis is not None:
        return {
            "analysisResults": latest_log_analysis,
            "lastAnalyzedAt": last_log_analysis_time,
        }
    elif latest_analysis is not None:
        return {
            "analysisResults": latest_analysis,
            "lastAnalyzedAt": last_analysis_time,
        }
    else:
        return {"detail": "No analysis data available"}

@app.post("/analyze")
def analyze_logs(request: LogRequest):
    global latest_analysis, last_analysis_time
    
    text = request.log_data
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    analysis_data = perform_nlp_analysis(text, lines)
    
    latest_analysis = analysis_data
    last_analysis_time = datetime.utcnow().isoformat()

    return analysis_data

@app.post("/analyze-log")
def analyze_log(data: LogData):
    global latest_log_analysis, last_log_analysis_time
    
    result = analyze_logs_structure(data.log_data)
    
    latest_log_analysis = result
    last_log_analysis_time = datetime.utcnow().isoformat()

    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
