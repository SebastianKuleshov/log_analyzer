"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, TrendingUp, Hash, MessageSquare } from "lucide-react"
import { formatNumber, calculateFontSize, calculateOpacity } from "@/lib/utils"

interface NLPAnalysisProps {
  logData: string
}

export function NLPAnalysis({ logData }: NLPAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const performNLPAnalysis = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setResults(null)
    setError(null)

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 90))
    }, 300)

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_data: logData }),
      })

      if (!response.ok) throw new Error("Помилка запиту до бекенду")

      const data = await response.json()
      setResults(data)
    } catch (e: any) {
      setError("Не вдалося виконати аналіз. Перевірте, чи запущено бекенд.")
    } finally {
      clearInterval(progressInterval)
      setProgress(100)
      setIsAnalyzing(false)
    }
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            NLP Аналіз лог-файлів
          </CardTitle>
          <CardDescription>Глибокий аналіз тексту з використанням технологій обробки природної мови</CardDescription>
        </CardHeader>
        <CardContent>
        {!results && (
            <div className="space-y-4">
              <Button
                onClick={performNLPAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Аналізую з NLP...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Почати NLP аналіз
                  </>
                )}
              </Button>

              {isAnalyzing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">Обробка тексту: {progress}%</p>
                </div>
              )}

              {error && <p className="text-red-500 text-center">{error}</p>}
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {/* Аналіз сентиментів */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Аналіз сентиментів
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.sentiment.positive}</div>
                      <div className="text-sm text-gray-600">Позитивні</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.sentiment.negative}</div>
                      <div className="text-sm text-gray-600">Негативні</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{results.sentiment.neutral}</div>
                      <div className="text-sm text-gray-600">Нейтральні</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full"
                      style={{ width: `${Math.max(10, (results.sentiment.score + 1) * 50)}%` }}
                    />
                  </div>
                  <p className="text-sm text-center mt-2">
                    Загальний сентимент:{" "}
                    {results.sentiment.score > 0
                      ? "Позитивний"
                      : results.sentiment.score < 0
                        ? "Негативний"
                        : "Нейтральний"}
                  </p>
                </CardContent>
              </Card>

              {/* Ключові слова */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Ключові слова
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.keywords.map((keyword: any, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm keyword-badge"
                        style={{
                          fontSize: `${calculateFontSize(keyword.count)}rem`,
                          opacity: calculateOpacity(keyword.count),
                        }}
                      >
                        <span className="number-display">{keyword.word} ({formatNumber(keyword.count)})</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Виявлені сутності */}
              <Card>
                <CardHeader>
                  <CardTitle>Виявлені сутності</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">IP адреси ({results.entities.ips.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {results.entities.ips.slice(0, 10).map((ip: string, index: number) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {ip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Файли ({results.entities.files.length})</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {results.entities.files.slice(0, 10).map((file: string, index: number) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {results.entities.emails && results.entities.emails.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Email адреси ({results.entities.emails.length})</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {results.entities.emails.slice(0, 5).map((email: string, index: number) => (
                            <Badge key={index} variant="outline" className="mr-1 mb-1">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {results.entities.urls && results.entities.urls.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">URL адреси ({results.entities.urls.length})</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {results.entities.urls.slice(0, 5).map((url: string, index: number) => (
                            <Badge key={index} variant="outline" className="mr-1 mb-1 text-xs">
                              {url.length > 30 ? url.substring(0, 30) + '...' : url}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Класифікація повідомлень */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Класифікація повідомлень
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(results.classification).map(([category, count]: [string, any]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category}</span>
                        <div className="flex items-center gap-2">                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${results.summary.totalLines > 0 ? (count / results.summary.totalLines) * 100 : 0}%` }}
                          />
                        </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Аномалії */}
              {results.anomalies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Виявлені аномалії</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.anomalies.map((anomaly: any, index: number) => (
                        <div key={index} className="p-3 border-l-4 border-red-500 bg-red-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="destructive">{anomaly.severity}</Badge>
                            <span className="font-medium">{anomaly.type}</span>
                          </div>
                          <p className="text-sm text-gray-700">{anomaly.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
