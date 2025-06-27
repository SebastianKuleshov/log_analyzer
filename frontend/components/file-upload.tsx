"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, AlertCircle } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleFileRead = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setError("")

      try {
        const content = await file.text()
        onFileUpload(file, content)
      } catch (err) {
        setError("Помилка при читанні файлу")
      } finally {
        setIsUploading(false)
      }
    },
    [onFileUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const file = files[0]

      if (file && (file.name.endsWith(".log") || file.name.endsWith(".txt") || file.name.endsWith(".csv"))) {
        handleFileRead(file)
      } else {
        setError("Будь ласка, завантажте файл з розширенням .log, .txt або .csv")
      }
    },
    [handleFileRead],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileRead(file)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Перетягніть файл сюди або натисніть для вибору</p>
          <p className="text-sm text-gray-500 mb-4">Підтримуються формати: .log, .txt, .csv</p>
          <input
            type="file"
            accept=".log,.txt,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <Button asChild disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              {isUploading ? "Завантаження..." : "Вибрати файл"}
            </label>
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
