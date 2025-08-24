"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  LucideX,
  Volume2,
  VolumeX,
  MessageSquare,
  Mic,
  MicOff,
  HelpCircle,
  Lightbulb,
  Send,
} from "lucide-react";
import { useMIDIPerformance } from "@/components/midi/midi-performance-provider";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { getThreadById, sendAIMessage } from "@/lib/api/assistant";
import { formatStringToJSON } from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";

interface AITutorProps {
  isListening: boolean;
  toggleListening: () => void;
  sessionId?: string | null;
  threadId?: string | null;
  userId?: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  type?: typeof MessageType[keyof typeof MessageType];
}

interface IChatMessage {
  message: Message;
}
interface AIChatMessage {
  message: string;
}
const MessageType = {
  Text: "text",
  Voice: "voice",
  System: "system",
} as const;

const MessageRole = {
  User: "user",
  Assistant: "assistant",
  System: "system",
} as const;

// Suggest questions to the user
const suggestedQuestions = [
  "How do I play this scale?",
  "What is the correct fingering?",
  "What should I focus on?",
];

const schema = z.object({
  message: z.string().min(2, "⚠️ Message must be at least 2 characters long").max(1000, "⚠️ Message must be at most 1000 characters long")
});

const formatAiResponse = (msg: any) => {
  let content = "";
  if (Array.isArray(msg.content)) {
    content = msg.content
      .map((part: any) => {
        if (
          part.text &&
          typeof part.text === "object" &&
          part.text.value
        ) {
          return part.text.value;
        }
        if (typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join(" ");
  } else if (msg.content?.text?.value) {
    content = msg.content.text.value;
  } else if (msg.content?.text) {
    content = msg.content.text;
  } else if (typeof msg.content === "string") {
    content = msg.content;
  }
  return {
    id: msg.id,
    content,
    role: msg.role,
    timestamp: new Date(msg.created_at * 1000),
    type: msg.type || MessageType.Text,
  };
}
export function ChatMessage(props: IChatMessage) {
  const { message } = props;
  const { id, content, role, timestamp, type } = message;

  let parsedContent = content;
  if (role === MessageRole.Assistant) {
    let json = formatStringToJSON(content);
    // Handle both {messages:[],emotion:""} and {messages:{messages:[],emotion:""}}
    if (json && typeof json === "object") {
      // Case 1: {messages:[], emotion:""}
      if (Array.isArray(json.messages) && typeof json.emotion === "string") {
        parsedContent =
          (json.emotion ? json.emotion + " " : "") +
          json.messages
            .map((m: any) =>
              typeof m === "object" && m.value ? m.value : m
            )
            .join(" ");
      }
      // Case 2: {messages:{messages:[],emotion:""}}
      else if (
        json.messages &&
        typeof json.messages === "object" &&
        Array.isArray(json.messages.messages)
      ) {
        parsedContent =
          (json.messages.emotion ? json.messages.emotion + " " : "") +
          json.messages.messages
            .map((m: any) =>
              typeof m === "object" && m.value ? m.value : m
            )
            .join(" ");
      }
    }
  }
  return (
    <div
      key={id}
      className={`flex ${role === MessageRole.User
        ? "justify-end"
        : "justify-start"
        }`}
    >
      <div className="flex items-start gap-2 max-w-[85%]">
        {role === MessageRole.Assistant && (
          <Fragment>
            <Avatar className="h-6 w-6 mt-1">
              <AvatarImage
                src="/ai-tutor-avatar.png"
                alt="AI Tutor"
              />
              <AvatarFallback className="bg-primary/20 text-primary">
                <Bot className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
          </Fragment>
        )}
        <div
          className={`rounded-lg p-2 text-sm ${role === MessageRole.User
            ? "bg-primary text-primary-foreground"
            : type === MessageType.System
              ? "bg-muted border border-primary/20"
              : "bg-muted border border-border"
            }`}
        >
          {parsedContent}
          <div className="text-xs opacity-60 mt-1 flex items-center gap-1">
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {type === MessageType.Voice && (
              <Mic className="h-2.5 w-2.5" />
            )}
          </div>
        </div>
        {role === MessageRole.User && (
          <Avatar className="h-6 w-6 mt-1">
            <AvatarImage
              src="/placeholder.svg"
              alt="User"
            />
            <AvatarFallback className="bg-primary/10">
              U
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

export function AITutor(props: AITutorProps) {
  const {
    isListening,
    toggleListening,
    sessionId,
    threadId,
    userId,
  } = props;
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(true);
  const [avatarState, setAvatarState] = useState<
    "neutral" | "speaking" | "listening" | "thinking"
  >("neutral");
  const [avatarEmotion, setAvatarEmotion] = useState<
    "neutral" | "happy" | "concerned"
  >("neutral");
  const [showHelp, setShowHelp] = useState(false);

  const { handleSubmit, control, formState: { errors }, setValue, setFocus, watch } = useForm<AIChatMessage>({
    defaultValues: {
      message: '',
    },
    resolver: zodResolver(schema)
  })
  const { performanceAnalysis } = useMIDIPerformance();
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatMessage = watch("message");

  const onSubmit = (data: AIChatMessage) => {
    handleSendMessage(data.message);
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      speechSynthesisRef.current = window.speechSynthesis;
    }
    return () => {
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);
  const fetchThreadMessages = async () => {
    if (!threadId || !userId || !sessionId) return;

    try {
      const data = await getThreadById(threadId);

      // OpenAI-style message objects with content.text.value
      setMessages(
        data.messages
          .map(formatAiResponse)
          .sort(
            (a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime()
          )
      );
    } catch (error) {
      console.error("Error fetching thread messages:", error);
    }
  };
  // Retreive thread messages on mount
  useEffect(() => {
    fetchThreadMessages();
  }, [threadId, userId, sessionId]);

  // Handle performance analysis changes
  useEffect(() => {
    if (performanceAnalysis && performanceAnalysis.feedback.length > 0) {
      const feedback = performanceAnalysis.feedback[0];

      // Add feedback to messages
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: feedback,
          role: MessageRole.Assistant,
          timestamp: new Date(),
          type: MessageType.System,
        },
      ]);

      // Set avatar emotion based on score
      if (typeof performanceAnalysis.overallScore === "number") {
        if (performanceAnalysis.overallScore > 85) {
          setAvatarEmotion("happy");
        } else if (performanceAnalysis.overallScore < 70) {
          setAvatarEmotion("concerned");
        } else {
          setAvatarEmotion("neutral");
        }
      }

      // Speak the feedback if not muted
      if (!muted) {
        speakText(feedback);
      }

      // Reset emotion after a delay
      setTimeout(() => {
        setAvatarEmotion("neutral");
      }, 5000);
    }
  }, [performanceAnalysis, muted]);

  // Update avatar state based on listening status
  useEffect(() => {
    setAvatarState(
      isListening ? "listening" : isSpeaking ? "speaking" : "neutral"
    );
  }, [isListening, isSpeaking]);

  // Display messages one at a time
  useEffect(() => {
    if (
      messages.length > 0 &&
      currentMessage !== messages[messages.length - 1].content
    ) {
      setCurrentMessage(messages[messages.length - 1].content);

      // Speak the new message if not muted
      if (
        !muted &&
        messages[messages.length - 1].role === MessageRole.Assistant &&
        messages[messages.length - 1].content !== currentMessage
      ) {
        speakText(messages[messages.length - 1].content);
      }
    }
  }, [messages, currentMessage, muted]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // Function to speak text using speech synthesis
  const speakText = (text: string) => {
    if (speechSynthesisRef.current && !muted) {
      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice to a female voice if available
      const voices = speechSynthesisRef.current.getVoices();
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.includes("Female") || voice.name.includes("female")
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesisRef.current.speak(utterance);
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    if (
      !muted &&
      speechSynthesisRef.current &&
      speechSynthesisRef.current.speaking
    ) {
      speechSynthesisRef.current.cancel();
    }
    setMuted(!muted);
  };

  // Handle sending a text message
  const handleSendMessage = async (data: string) => {

    if (!data.trim().length || !threadId || !userId || !sessionId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: data,
      role: MessageRole.User,
      timestamp: new Date(),
      type: MessageType.Text,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add loading/typing indicator
    const typingId = (Date.now() + 0.5).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        content: "AI is typing...",
        role: MessageRole.Assistant,
        timestamp: new Date(),
        type: MessageType.System,
      },
    ]);

    // Call backend AI
    try {
      const { response } = await sendAIMessage({
        threadId,
        message: data,
        userId,
        sessionId,
      });
      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      // Instead of adding AI response directly, refresh all messages from backend after 5s
      const formattedApiResponse = formatAiResponse({ content: `${response.emotion} ${response.messages.join(" ")}` });
      setMessages((prev) => [...prev, {
        ...formattedApiResponse,
        type: MessageType.System,
        role: MessageRole.Assistant,
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content:
            "AI error: " +
            (e && typeof e === "object" && "message" in e
              ? e.message
              : String(e)),
          role: MessageRole.Assistant,
          timestamp: new Date(),
          type: MessageType.System,
        },
      ]);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setValue('message', question, { shouldValidate: true, shouldDirty: true });
    setFocus('message')
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md"
          >
            <Card className="border-2 border-primary/20 shadow-lg bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Piano Tutor</span>
                    <div
                      className={`h-2 w-2 rounded-full ${avatarState === "speaking"
                        ? "bg-green-500 animate-pulse"
                        : avatarState === "listening"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-muted"
                        }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={toggleListening}
                      title={
                        isListening
                          ? "Stop voice recognition"
                          : "Start voice recognition"
                      }
                    >
                      {isListening ? (
                        <Mic className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowHelp(!showHelp)}
                      title={showHelp ? "Hide help" : "Show help"}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={toggleMute}
                      title={muted ? "Unmute" : "Mute"}
                    >
                      {muted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsExpanded(false)}
                      title="Minimize"
                    >
                      <LucideX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Help panel */}
                <AnimatePresence>
                  {showHelp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="bg-muted/20 rounded-md p-3 text-sm">
                        <h4 className="font-medium mb-2">Quick Help</h4>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-1">
                            <Mic className="h-3 w-3 text-primary" /> Click the
                            microphone to use voice commands
                          </li>
                          <li className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-primary" />{" "}
                            Type questions or commands below
                          </li>
                          <li className="flex items-center gap-1">
                            <Volume2 className="h-3 w-3 text-primary" /> Toggle
                            AI voice on/off
                          </li>
                        </ul>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            Try asking about fingering, scales, or specific
                            techniques. You can also request demonstrations or
                            explanations.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat messages */}
                <ScrollArea className="h-60 pr-4 mb-3">
                  <div className="space-y-3">
                    {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
                    <div ref={scrollAreaRef} />
                  </div>
                </ScrollArea>

                {/* Suggested questions */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">
                      Suggested questions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Input area */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex items-center gap-2 w-full"
                >
                  <div className="flex-1">
                    <Controller
                      name="message"
                      control={control}
                      render={({ field }) => (
                        <Input
                          control={control}
                          placeholder="Ask a question..."
                          {...field}
                        />
                      )}
                    />
                    {errors.message && (<span className="text-red-500 text-xs">{errors.message.message}</span>)}
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-2"
                    disabled={!chatMessage.trim().length}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Send</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stacked Notifications - Only shown when chat is closed */}
      <AnimatePresence>
        {!isExpanded && messages.length > 0 && (
          <motion.div
            className="fixed bottom-20 right-4 flex flex-col-reverse gap-2 max-w-xs w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {messages
              .slice(-3)
              .reverse()
              .map(
                (message, index) =>
                  message.role === MessageRole.Assistant && (
                    <motion.div
                      key={message.id}
                      className="bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg p-3 shadow-md"
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { delay: index * 0.1 },
                      }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      style={{ zIndex: 40 - index }}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6 mt-0.5">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-sm">
                          <p className="line-clamp-3">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 -mt-1 -mr-1 opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessages((prev) =>
                              prev.filter((m) => m.id !== message.id)
                            );
                          }}
                        >
                          <LucideX className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  )
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Avatar className="h-14 w-14 border-2 border-primary shadow-lg cursor-pointer">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        {/* Avatar Status Indicator */}
        <motion.div
          className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${avatarState === "speaking"
            ? "bg-green-500"
            : avatarState === "listening"
              ? "bg-blue-500"
              : avatarState === "thinking"
                ? "bg-amber-500"
                : "bg-muted"
            }`}
          animate={
            avatarState === "speaking" || avatarState === "listening"
              ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }
              : {}
          }
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
        />

        {/* Emotion Indicator */}
        {!isExpanded && (
          <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
            {avatarEmotion === "happy" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs"
              >
                😊
              </motion.div>
            )}
            {avatarEmotion === "concerned" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-amber-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs"
              >
                🤔
              </motion.div>
            )}
          </div>
        )}

        {/* Chat Indicator when collapsed */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center shadow-md"
          >
            <MessageSquare className="h-3 w-3" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
