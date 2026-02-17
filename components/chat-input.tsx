"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic } from "lucide-react"
import { toast } from "sonner"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({ onSendMessage, placeholder = "Poser une question", disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("La reconnaissance vocale n'est pas prise en charge par votre navigateur")
      return
    }

    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = "fr-FR" // Set language to French
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsRecording(true)
        toast.info("Écoute en cours...")
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setMessage((prev) => prev + " " + transcript.trim())

        if (inputRef.current) {
          inputRef.current.focus()
        }
      }

      recognition.onerror = (event) => {
        console.error("Erreur de reconnaissance vocale:", event.error)
        toast.error("Erreur lors de la reconnaissance vocale")
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la reconnaissance vocale:", error)
      toast.error("Impossible d'initialiser la reconnaissance vocale")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-4xl mx-auto p-2 bg-background border rounded-lg shadow-sm">
      <input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={toggleSpeechRecognition}
        disabled={disabled}
        className={`h-9 w-9 rounded-full ${isRecording ? "bg-red-100 text-red-500" : ""}`}
        aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement vocal"}
      >
        <Mic className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={handleSendMessage}
        disabled={disabled || !message.trim()}
        className="h-9 w-9 rounded-full"
        aria-label="Envoyer le message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  )
}
