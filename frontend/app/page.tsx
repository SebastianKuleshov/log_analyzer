"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { LogAnalysis } from "@/components/log-analysis"
import { NLPAnalysis } from "@/components/nlp-analysis"
import { Dashboard } from "@/components/dashboard"
import { FileText, Brain, BarChart3, Upload } from "lucide-react"

export default function LogAnalyzerApp() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [logData, setLogData] = useState<string>("")
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const handleFileUpload = (file: File, content: string) => {
    setUploadedFile(file)
    setLogData(content)
  }

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔍 Log File NLP Analyzer</h1>
          <p className="text-lg text-gray-600">Професійний аналіз лог-файлів з використанням технологій NLP</p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Завантаження
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!logData}>
              <FileText className="w-4 h-4" />
              Аналіз логів
            </TabsTrigger>
            <TabsTrigger value="nlp" className="flex items-center gap-2" disabled={!logData}>
              <Brain className="w-4 h-4" />
              NLP Аналіз
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2" disabled={!analysisResults}>
              <BarChart3 className="w-4 h-4" />
              Дашборд
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Завантаження лог-файлу</CardTitle>
                <CardDescription>
                  Завантажте ваш лог-файл для аналізу. Підтримуються формати: .log, .txt, .csv
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileUpload={handleFileUpload} />
                {uploadedFile && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">
                      ✅ Файл завантажено: <strong>{uploadedFile.name}</strong>
                    </p>
                    <p className="text-sm text-green-600 mt-1">Розмір: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <LogAnalysis logData={logData} onAnalysisComplete={handleAnalysisComplete} />
          </TabsContent>

          <TabsContent value="nlp">
            <NLPAnalysis logData={logData} />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard analysisResults={analysisResults} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
