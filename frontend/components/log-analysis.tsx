"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Info, XCircle, CheckCircle, Play, Clock } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface LogAnalysisProps {
  logData: string
  onAnalysisComplete: (results: any) => void
}

interface LogEntry {
  timestamp: string
  level: "ERROR" | "WARN" | "INFO" | "DEBUG"
  message: string
  source?: string
}

export function LogAnalysis({ logData, onAnalysisComplete }: LogAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)

  const analyzeLogData = async () => {
    setIsAnalyzing(true)
    setProgress(0)
  
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 200)
  
    try {
      const response = await fetch("http://localhost:8000/analyze-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_data: logData }),
      })
  
      const data = await response.json()
      clearInterval(progressInterval)
      setProgress(100)
      setResults(data)
      onAnalysisComplete(data)
    } catch (error) {
      console.error("Analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "WARN":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "INFO":
        return <Info className="w-4 h-4 text-blue-500" />
      case "DEBUG":
        return <CheckCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200"
      case "WARN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "INFO":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "DEBUG":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Аналіз структури логів
          </CardTitle>
          <CardDescription>Парсинг та аналіз лог-файлу для виявлення помилок, попереджень та трендів</CardDescription>
        </CardHeader>
        <CardContent>
          {!results && (
            <div className="space-y-4">
              <Button onClick={analyzeLogData} disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Аналізую...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Почати аналіз
                  </>
                )}
              </Button>

              {isAnalyzing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">Прогрес: {progress}%</p>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {/* Статистика */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.stats.total}</div>
                    <div className="text-sm text-gray-600">Всього записів</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{results.stats.errors}</div>
                    <div className="text-sm text-gray-600">Помилки</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{results.stats.warnings}</div>
                    <div className="text-sm text-gray-600">Попередження</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(((results.stats.total - results.stats.errors) / results.stats.total) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Успішність</div>
                  </CardContent>
                </Card>
              </div>

              {/* Топ помилок */}
              {results.topErrors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Найчастіші помилки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.topErrors.map((error: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex-1 text-sm font-mono text-red-800 truncate">{error.message}</div>
                          <Badge variant="destructive" className="number-display">{formatNumber(error.count)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Останні записи */}
              <Card>
                <CardHeader>
                  <CardTitle>Останні лог-записи</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.entries.slice(0, 20).map((entry: LogEntry, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getLevelIcon(entry.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getLevelColor(entry.level)}>{entry.level}</Badge>
                            <span className="text-xs text-gray-500">{entry.timestamp}</span>
                          </div>
                          <p className="text-sm font-mono text-gray-800 break-words">{entry.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
