"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, AlertTriangle, ThumbsUp, Bot, Music, Clock, Target, Sparkles } from "lucide-react"
import { useMIDIPerformance } from "@/components/midi/midi-performance-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  type?: "feedback" | "warning" | "success"
  isTyping?: boolean
  focusArea?: "notes" | "rhythm" | "technique" | "general"
}

type TutorStyle = "encouraging" | "technical" | "strict" | "funny"

export function AIChatPanel() {
  const { performanceAnalysis } = useMIDIPerformance()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI piano tutor. I'll provide feedback as you play. Try playing a C major scale to start.",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [focusArea, setFocusArea] = useState<"notes" | "rhythm" | "technique" | "general">("general")
  const [tutorStyle, setTutorStyle] = useState<TutorStyle>("encouraging")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Add a ref to track if we've already processed this analysis
  const processedAnalysisRef = useRef<string | null>(null)

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Show typing indicator
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(input, tutorStyle),
        role: "assistant",
        timestamp: new Date(),
        focusArea: focusArea,
      }

      setMessages((prev) => [...prev, aiMessage])
    }, 1500)
  }

  // Generate personalized responses based on tutor style
  const generateResponse = (userInput: string, style: TutorStyle): string => {
    const input = userInput.toLowerCase()

    if (input.includes("difficult") || input.includes("hard") || input.includes("struggle")) {
      switch (style) {
        case "encouraging":
          return "That's completely normal! Everyone finds certain passages challenging. Let's break it down into smaller sections and practice slowly. You're making great progress! 💪"
        case "technical":
          return "Difficulty often stems from technical limitations. Let's analyze your hand position and finger movements. Try practicing with a metronome at 60 BPM and gradually increase the tempo."
        case "strict":
          return "Difficulty is overcome with disciplined practice. You need to isolate the problematic measures and repeat them 10 times perfectly before moving on. No shortcuts."
        case "funny":
          return "Ah, the pianist's eternal struggle! Even Mozart probably hit wrong notes when he was texting. 😂 Let's tackle this one note at a time - Rome wasn't built in a day, and neither was anyone's piano technique!"
      }
    }

    if (input.includes("finger") || input.includes("hand position")) {
      switch (style) {
        case "encouraging":
          return "Great question about technique! Try keeping your wrists relaxed and fingers curved. You're already showing good awareness of your hand position! 👏"
        case "technical":
          return "For optimal finger positioning, maintain a curved shape with relaxed wrists. Your metacarpophalangeal joints should be aligned with your forearm to minimize strain and maximize efficiency."
        case "strict":
          return "Your hand position needs work. Curved fingers, relaxed wrists, and proper thumb positioning are non-negotiable fundamentals. Practice Hanon exercises daily to develop proper technique."
        case "funny":
          return "Ah, the eternal claw vs. noodle debate! Your hands should be relaxed but not so relaxed they're taking a nap. Think 'gentle tarantula' not 'dead spider' or 'jazz hands'! 🕷️🎹"
      }
    }

    // Default responses
    switch (style) {
      case "encouraging":
        return "That's a great question! I'm here to help you improve and enjoy the learning process. What specific aspect would you like to work on next? You're doing wonderfully! 😊"
      case "technical":
        return "I appreciate your inquiry. Let's approach this systematically by analyzing the technical components involved. We should consider fingering, articulation, and harmonic structure for optimal performance."
      case "strict":
        return "Focus is essential for improvement. Your question indicates you need more structured practice. I recommend 30 minutes of scales, 30 minutes of technical exercises, and 60 minutes of repertoire daily."
      case "funny":
        return "Ah, the eternal mysteries of piano playing! Where do our socks go in the dryer, and why does that one measure always trip us up? Let's figure this out together - with fewer missing socks hopefully! 🧦🎹"
    }
  }

  // Update the effect that responds to performance analysis changes
  useEffect(() => {
    if (
      performanceAnalysis &&
      performanceAnalysis.feedback.length > 0 &&
      processedAnalysisRef.current !== JSON.stringify(performanceAnalysis)
    ) {
      // Store the current analysis to prevent reprocessing
      processedAnalysisRef.current = JSON.stringify(performanceAnalysis)

      // Show typing indicator
      setIsTyping(true)

      setTimeout(() => {
        setIsTyping(false)

        // Determine message type based on overall score
        let messageType: "feedback" | "warning" | "success" = "feedback"
        if (performanceAnalysis.overallScore < 70) {
          messageType = "warning"
        } else if (performanceAnalysis.overallScore > 85) {
          messageType = "success"
        }

        // Customize feedback based on tutor style and focus area
        let feedbackContent = performanceAnalysis.feedback[0]

        // Adjust feedback based on tutor style
        switch (tutorStyle) {
          case "encouraging":
            feedbackContent = feedbackContent.replace("Try to", "You're doing well! Try to")
            if (messageType === "success") {
              feedbackContent += " You're making excellent progress! 🌟"
            } else if (messageType === "warning") {
              feedbackContent += " Don't worry, you'll get it with practice! 💪"
            }
            break
          case "technical":
            if (focusArea === "rhythm") {
              feedbackContent += " Consider using a metronome set to 60 BPM to internalize the rhythmic patterns."
            } else if (focusArea === "notes") {
              feedbackContent += " Pay attention to the intervallic relationships between consecutive notes."
            } else if (focusArea === "technique") {
              feedbackContent += " Maintain proper wrist alignment and finger curvature throughout the passage."
            }
            break
          case "strict":
            if (messageType === "warning") {
              feedbackContent = "This needs significant improvement. " + feedbackContent
            } else if (messageType === "success") {
              feedbackContent = "Acceptable. " + feedbackContent
            }
            break
          case "funny":
            if (messageType === "warning") {
              feedbackContent += " Hey, even Mozart had off days! 😂"
            } else if (messageType === "success") {
              feedbackContent += " You're rocking this like Mozart with a Red Bull! 🎵"
            } else {
              feedbackContent += " Keep it up, you're somewhere between 'Chopsticks' and Chopin! 🎹"
            }
            break
        }

        // Filter feedback based on focus area
        if (
          focusArea === "rhythm" &&
          !feedbackContent.toLowerCase().includes("timing") &&
          !feedbackContent.toLowerCase().includes("rhythm")
        ) {
          feedbackContent += " Focus particularly on maintaining consistent timing between notes."
        } else if (focusArea === "notes" && !feedbackContent.toLowerCase().includes("note")) {
          feedbackContent += " Pay special attention to playing the correct notes in sequence."
        } else if (
          focusArea === "technique" &&
          !feedbackContent.toLowerCase().includes("finger") &&
          !feedbackContent.toLowerCase().includes("hand")
        ) {
          feedbackContent += " Remember to maintain proper finger positioning and hand posture."
        }

        // Create a message with the customized feedback
        const feedbackMessage: Message = {
          id: Date.now().toString(),
          content: feedbackContent,
          role: "assistant",
          timestamp: new Date(),
          type: messageType,
          focusArea: focusArea,
        }

        setMessages((prev) => [...prev, feedbackMessage])

        // If there are more feedback items, add them after a delay
        if (performanceAnalysis.feedback.length > 1) {
          setTimeout(() => {
            setIsTyping(true)

            setTimeout(() => {
              setIsTyping(false)

              // Create a message with performance stats
              const statsMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: `Performance analysis: Accuracy: ${performanceAnalysis.accuracy}%, Timing: ${performanceAnalysis.timing}%, Dynamics: ${performanceAnalysis.dynamics}%, Overall: ${performanceAnalysis.overallScore}%`,
                role: "assistant",
                timestamp: new Date(),
                type: "feedback",
                focusArea: focusArea,
              }

              setMessages((prev) => [...prev, statsMessage])

              // Add a victory message for high scores
              if (performanceAnalysis.overallScore > 90) {
                setTimeout(() => {
                  const victoryMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    content:
                      "🎉 Outstanding performance! You've mastered this passage! Ready to move on to something more challenging?",
                    role: "assistant",
                    timestamp: new Date(),
                    type: "success",
                  }

                  setMessages((prev) => [...prev, victoryMessage])
                }, 1000)
              }
            }, 1500)
          }, 2000)
        }
      }, 1500)
    }
  }, [performanceAnalysis, tutorStyle, focusArea]) // Keep performanceAnalysis in dependencies

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className="flex h-[500px] flex-col bg-gradient-to-b from-primary/5 to-background">
      <div className="flex items-center justify-between p-2 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarImage src="/placeholder.svg" alt="AI Tutor" />
            <AvatarFallback className="bg-primary/20 text-primary">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">AI Piano Tutor</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0">
                {tutorStyle === "encouraging"
                  ? "Encouraging"
                  : tutorStyle === "technical"
                    ? "Technical"
                    : tutorStyle === "strict"
                      ? "Strict"
                      : "Funny"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Focus:{" "}
                {focusArea === "general"
                  ? "General"
                  : focusArea === "notes"
                    ? "Notes"
                    : focusArea === "rhythm"
                      ? "Rhythm"
                      : "Technique"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Sparkles className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tutor Style</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTutorStyle("encouraging")}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                <span>Encouraging</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTutorStyle("technical")}>
                <Music className="mr-2 h-4 w-4" />
                <span>Technical</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTutorStyle("strict")}>
                <Target className="mr-2 h-4 w-4" />
                <span>Strict</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTutorStyle("funny")}>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Funny</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs defaultValue="general" className="w-auto">
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger
                value="general"
                className="text-xs px-2 py-0 h-6 data-[state=active]:bg-primary data-[state=active]:text-white"
                onClick={() => setFocusArea("general")}
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="text-xs px-2 py-0 h-6 data-[state=active]:bg-primary data-[state=active]:text-white"
                onClick={() => setFocusArea("notes")}
              >
                Notes
              </TabsTrigger>
              <TabsTrigger
                value="rhythm"
                className="text-xs px-2 py-0 h-6 data-[state=active]:bg-primary data-[state=active]:text-white"
                onClick={() => setFocusArea("rhythm")}
              >
                Rhythm
              </TabsTrigger>
              <TabsTrigger
                value="technique"
                className="text-xs px-2 py-0 h-6 data-[state=active]:bg-primary data-[state=active]:text-white"
                onClick={() => setFocusArea("technique")}
              >
                Technique
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3 max-w-[80%]">
                  {message.role === "assistant" && (
                    <motion.div whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }} transition={{ duration: 0.5 }}>
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src="/placeholder.svg" alt="AI Tutor" />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : message.type === "warning"
                          ? "bg-amber-50 border border-amber-200 shadow-sm"
                          : message.type === "success"
                            ? "bg-green-50 border border-green-200 shadow-sm"
                            : "bg-white border border-gray-100 shadow-sm"
                    }`}
                  >
                    {message.type === "warning" && (
                      <div className="flex items-center mb-1 text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs font-medium">Suggestion</span>
                      </div>
                    )}

                    {message.type === "success" && (
                      <div className="flex items-center mb-1 text-green-500">
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs font-medium">Good job!</span>
                      </div>
                    )}

                    {message.focusArea && message.focusArea !== "general" && (
                      <div className="flex items-center mb-1">
                        {message.focusArea === "notes" && <Music className="h-3.5 w-3.5 mr-1 text-blue-500" />}
                        {message.focusArea === "rhythm" && <Clock className="h-3.5 w-3.5 mr-1 text-purple-500" />}
                        {message.focusArea === "technique" && <Target className="h-3.5 w-3.5 mr-1 text-indigo-500" />}
                        <span className="text-xs font-medium capitalize text-muted-foreground">
                          {message.focusArea} focus
                        </span>
                      </div>
                    )}

                    <p className="text-sm">{message.content}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src="/placeholder.svg" alt="User" />
                      <AvatarFallback className="bg-primary/10">SC</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Enhanced typing indicator with better animation */}
            {isTyping && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3 max-w-[80%]">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -3, 3, -3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                    }}
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src="/placeholder.svg" alt="AI Tutor" />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div className="rounded-lg p-3 bg-white border border-gray-100 shadow-sm">
                    <div className="flex space-x-1 items-center h-5">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary/60"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 0.8,
                          delay: 0,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary/60"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 0.8,
                          delay: 0.2,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary/60"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 0.8,
                          delay: 0.4,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-white/50 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2"
          aria-label="Message input form"
        >
          <input
            placeholder={`Ask your ${tutorStyle} AI tutor about ${focusArea}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border-gray-200 focus-visible:ring-primary/50 bg-white"
            aria-label="Message input"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-primary hover:bg-primary/90 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
