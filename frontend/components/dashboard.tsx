"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Download, AlertTriangle, CheckCircle, TrendingUp, Activity, Shield, Clock } from "lucide-react"
import { formatNumber, calculateFontSize, calculateOpacity } from "@/lib/utils"

interface DashboardProps {
  analysisResults: any
}

export function Dashboard({ analysisResults }: DashboardProps) {
  if (!analysisResults) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Немає даних для відображення</p>
        </CardContent>
      </Card>
    )
  }

  const stats = analysisResults.stats || {}
  const topErrors = analysisResults.topErrors || []
  const patterns = analysisResults.patterns || {}
  const integrity = analysisResults.integrity || {}
  const timeAnalysis = analysisResults.timeAnalysis || {}
  
  const healthScore = (() => {
    const total = stats.total || 0
    if (total === 0) return 100
    
    const errors = stats.errors || 0
    const malformed = stats.malformed || 0
    const warnings = stats.warnings || 0
    
    const criticalIssues = errors + malformed
    const totalIssues = criticalIssues + warnings * 0.5
    
    return Math.max(0, 100 - (totalIssues / total) * 100)
  })()
  
  const criticalIssues = (() => {
    let count = 0
    
    count += topErrors.filter((e: any) => e.count > 5).length
    
    if (integrity.integrity_score && integrity.integrity_score < 95) count += 1
    
    if (stats.malformed && stats.malformed > (stats.total || 0) * 0.05) count += 1
    
    return count
  })()

  const exportResults = () => {
    const dataStr = JSON.stringify(analysisResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "log-analysis-results.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = () => {
    const report = `
# Звіт аналізу лог-файлів
Дата: ${new Date().toLocaleDateString("uk-UA")}

## Загальна статистика
- Всього записів: ${stats.total || 0}
- Помилки: ${stats.errors || 0}
- Попередження: ${stats.warnings || 0}
- Інформаційні: ${stats.info || 0}
- Пошкоджені записи: ${stats.malformed || 0}
- Не розпарсені рядки: ${stats.corrupted_lines || 0}
- Рівень здоров'я системи: ${healthScore.toFixed(1)}%
${integrity.integrity_score ? `- Цілісність даних: ${integrity.integrity_score}%` : ''}

## Топ помилок
${topErrors.length > 0 ? topErrors
  .map((error: any, index: number) => `${index + 1}. ${error.message} (${formatNumber(error.count)} разів)`)
  .join("\n") : 'Помилки не виявлено'}

${integrity.issues && integrity.issues.length > 0 ? `\n## Проблеми з цілісністю\n${integrity.issues.map((issue: string) => `- ${issue}`).join('\n')}` : ''}

## Рекомендації
${healthScore < 80 ? '- КРИТИЧНО: Негайно перевірити систему через високий рівень помилок' : ''}
${stats.malformed && stats.malformed > 0 ? '- Перевірити формат лог-файлів - виявлені пошкоджені записи' : ''}
${integrity.integrity_score && integrity.integrity_score < 95 ? '- Налаштувати валідацію логування для покращення цілісності даних' : ''}
- Регулярно моніторити рівень помилок
- Налаштувати алерти для критичних помилок
- Проводити аналіз трендів щотижня
    `

    const reportBlob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(reportBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "log-analysis-report.txt"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок дашборду */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Дашборд аналізу</h2>
          <p className="text-gray-600">Комплексний огляд результатів аналізу лог-файлів</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportResults} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Експорт JSON
          </Button>
          <Button onClick={generateReport}>
            <Download className="w-4 h-4 mr-2" />
            Звіт
          </Button>
        </div>
      </div>

      {/* Основні метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Загальна кількість</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
                {stats.corrupted_lines > 0 && (
                  <p className="text-xs text-orange-600">+{stats.corrupted_lines} не розпарсено</p>
                )}
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Помилки</p>
                <p className="text-2xl font-bold text-red-600">{stats.errors || 0}</p>
                {stats.malformed > 0 && (
                  <p className="text-xs text-red-600">+{stats.malformed} пошкоджених</p>
                )}
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Рівень здоров'я</p>
                <p className={`text-2xl font-bold ${
                  healthScore >= 90 ? 'text-green-600' : 
                  healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {healthScore.toFixed(1)}%
                </p>
                {integrity.integrity_score && (
                  <p className="text-xs text-gray-600">
                    Цілісність: {integrity.integrity_score}%
                  </p>
                )}
              </div>
              <CheckCircle className={`w-8 h-8 ${
                healthScore >= 90 ? 'text-green-600' : 
                healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Критичні проблеми</p>
                <p className={`text-2xl font-bold ${
                  criticalIssues === 0 ? 'text-green-600' : 
                  criticalIssues <= 2 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {criticalIssues}
                </p>
                <p className="text-xs text-gray-600">потребують уваги</p>
              </div>
              <Shield className={`w-8 h-8 ${
                criticalIssues === 0 ? 'text-green-600' : 
                criticalIssues <= 2 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Цілісність даних */}
      {integrity.integrity_score !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Цілісність даних
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Оцінка цілісності</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={integrity.integrity_score}
                    className="w-32 h-2"
                  />
                  <span className="text-sm font-bold">{integrity.integrity_score}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Всього рядків:</span>
                  <span className="ml-2 font-medium">{integrity.total_lines || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Розпарсено:</span>
                  <span className="ml-2 font-medium">{integrity.parsed_entries || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Пошкоджені:</span>
                  <span className="ml-2 font-medium text-red-600">{integrity.malformed_entries || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Не розпарсені:</span>
                  <span className="ml-2 font-medium text-orange-600">{integrity.unparsable_lines || 0}</span>
                </div>
              </div>

              {integrity.issues && integrity.issues.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">Виявлені проблеми:</h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {integrity.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Детальна статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Розподіл за рівнями */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Розподіл за рівнями логування
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ERROR</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={stats.total > 0 ? ((stats.errors || 0) / stats.total) * 100 : 0}
                    className="w-32 h-2"
                  />
                  <span className="text-sm">{stats.errors || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WARNING</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={stats.total > 0 ? ((stats.warnings || 0) / stats.total) * 100 : 0}
                    className="w-32 h-2"
                  />
                  <span className="text-sm">{stats.warnings || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">INFO</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={stats.total > 0 ? ((stats.info || 0) / stats.total) * 100 : 0}
                    className="w-32 h-2"
                  />
                  <span className="text-sm">{stats.info || 0}</span>
                </div>
              </div>
              {stats.malformed > 0 && (
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-medium text-red-600">MALFORMED</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={stats.total > 0 ? (stats.malformed / stats.total) * 100 : 0}
                      className="w-32 h-2"
                    />
                    <span className="text-sm text-red-600">{stats.malformed}</span>
                  </div>
                </div>
              )}
              {stats.corrupted_lines > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-600">UNPARSED</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={integrity.total_lines > 0 ? (stats.corrupted_lines / integrity.total_lines) * 100 : 0}
                      className="w-32 h-2"
                    />
                    <span className="text-sm text-orange-600">{stats.corrupted_lines}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Топ проблем */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Найчастіші проблеми
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topErrors.length > 0 ? (
              <div className="space-y-3">
                {topErrors.slice(0, 5).map((error: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 truncate">
                        {error.message.substring(0, 50)}...
                      </p>
                    </div>
                    <Badge variant="destructive" className="number-display">{formatNumber(error.count)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">Критичних помилок не виявлено</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Виявлені IP адреси */}
      {patterns?.suspiciousIPs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Активні IP адреси</CardTitle>
            <CardDescription>IP адреси, які найчастіше з'являються в логах</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patterns.suspiciousIPs.slice(0, 10).map((ip: string, index: number) => (
                <Badge key={index} variant="secondary" className="font-mono">
                  {ip}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Часові тренди */}
      {Object.keys(timeAnalysis).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Активність по годинах
            </CardTitle>
            <CardDescription>Розподіл логів протягом доби</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const count = timeAnalysis[hour] || 0
                const maxCount = Math.max(...Object.values(timeAnalysis).map(Number))
                const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0
                
                return (
                  <div key={hour} className="text-center">
                    <div 
                      className="h-8 bg-blue-500 rounded mb-1 flex items-end justify-center"
                      style={{ opacity: intensity / 100 }}
                      title={`${hour}:00 - ${formatNumber(count)} записів`}
                    >
                      {count > 0 && (
                        <span className="text-xs text-white font-medium number-display">{formatNumber(count)}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{hour}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ключові слова */}
      {patterns?.frequentKeywords?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Частіші ключові слова</CardTitle>
            <CardDescription>Найпоширеніші терміни в логах</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patterns.frequentKeywords.slice(0, 15).map((keyword: any, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-sm keyword-badge"
                  style={{ 
                    fontSize: `${calculateFontSize(keyword.count)}rem`,
                    opacity: calculateOpacity(keyword.count)
                  }}
                >
                  <span className="number-display">{keyword.word} ({formatNumber(keyword.count)})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Рекомендації */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Рекомендації та попередження
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Критичні попередження */}
            {healthScore < 50 && (
              <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-800">
                  <strong>🚨 КРИТИЧНО:</strong> Дуже низький рівень здоров'я системи ({healthScore.toFixed(1)}%). 
                  Негайно перевірте систему та усуньте причини помилок.
                </p>
              </div>
            )}
            
            {healthScore < 80 && healthScore >= 50 && (
              <div className="p-4 bg-orange-100 border-l-4 border-orange-500 rounded">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ УВАГА:</strong> Знижений рівень здоров'я системи ({healthScore.toFixed(1)}%). 
                  Рекомендується перевірка та оптимізація.
                </p>
              </div>
            )}

            {/* Попередження про пошкоджені записи */}
            {stats.malformed > 0 && (
              <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-800">
                  <strong>🔧 ЦІЛІСНІСТЬ ДАНИХ:</strong> Виявлено {stats.malformed} пошкоджених записів. 
                  Перевірте формат логування та джерела даних.
                </p>
              </div>
            )}

            {/* Попередження про не розпарсені рядки */}
            {stats.corrupted_lines > 0 && (
              <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>📝 ФОРМАТ ДАНИХ:</strong> {stats.corrupted_lines} рядків не вдалося розпарсити. 
                  Можливо, потрібно додати підтримку нових форматів логів.
                </p>
              </div>
            )}

            {/* Попередження про цілісність */}
            {integrity.integrity_score && integrity.integrity_score < 95 && (
              <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>📊 ЯКІСТЬ ДАНИХ:</strong> Цілісність даних {integrity.integrity_score}%. 
                  Рекомендується покращити валідацію логування.
                </p>
              </div>
            )}

            {/* Попередження про багато попереджень */}
            {stats.warnings > (stats.total || 0) * 0.1 && (
              <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ ПОПЕРЕДЖЕННЯ:</strong> Багато попереджень ({stats.warnings}). 
                  Варто проаналізувати причини та усунути їх.
                </p>
              </div>
            )}

            {/* Позитивні рекомендації */}
            {healthScore >= 90 && stats.malformed === 0 && (
              <div className="p-4 bg-green-100 border-l-4 border-green-500 rounded">
                <p className="text-sm text-green-800">
                  <strong>✅ ВІДМІННО:</strong> Система працює стабільно! Продовжуйте моніторинг.
                </p>
              </div>
            )}

            {/* Загальні рекомендації */}
            <div className="p-4 bg-blue-100 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-800">
                <strong>💡 ЗАГАЛЬНІ РЕКОМЕНДАЦІЇ:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>Налаштуйте автоматичні алерти для критичних помилок</li>
                <li>Проводьте регулярний аналіз логів (щоденно/щотижня)</li>
                <li>Створіть дашборд для моніторингу в реальному часі</li>
                <li>Архівуйте старі логи для економії місця</li>
                {stats.malformed > 0 && <li>Стандартизуйте формати логування у всіх компонентах</li>}
                {integrity.integrity_score && integrity.integrity_score < 95 && <li>Впровадьте валідацію логів на рівні додатку</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Час останнього аналізу */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            Останній аналіз: {new Date().toLocaleString("uk-UA")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
