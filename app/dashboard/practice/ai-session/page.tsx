"use client";

import { useState, useEffect, useRef } from "react";
import { getReferenceById } from "@/lib/api/reference";
import { useUser } from "@/context/UserContext";
import {
  createPracticeSession,
  getUserSessionPerformances,
  endSession as endSessionApi,
} from "@/lib/api/session";
import { createThreadForSession } from "@/lib/api/assistant";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AITutor } from "@/components/practice/ai-tutor";
import { ProgressPanel } from "@/components/practice/progress-panel";
import { MIDIPerformanceProvider } from "@/components/midi/midi-performance-provider";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { VoiceWaveform } from "@/components/practice/voice-waveform";
import { SimpleMidiListener } from "@/components/midi/simple-midi-listenner";
import { useRouter } from "next/navigation";

interface MidiNote {
  note: number;
  noteName: string;
  velocity: number;
  time: number;
}

export default function AIPracticePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<{
    title: string;
    description?: string;
  }>({
    title: "",
    description: "",
  });
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const { user } = useUser();
  const [activeNotes, setActiveNotes] = useState<Record<number, boolean>>({});
  const [midiData, setMidiData] = useState<MidiNote[]>([]);
  const [showMidiListener, setShowMidiListener] = useState(false);
  const [userPerformances, setUserPerformances] = useState<any>([]);
  // For triggering a refresh after a new performance
  const [refreshKey, setRefreshKey] = useState(0);
 
  const router = useRouter();
 
  // Handle MIDI data from the listener
  const handleMidiData = (data: MidiNote[]) => {
    setMidiData(data);

    // Provide feedback for the latest note
    if (data.length > 0) {
      const latestNote = data[0];
      toast.success(`Played: ${latestNote.noteName}`, {
        description: `Velocity: ${latestNote.velocity}`,
        duration: 1000,
      });
    }
  };

  // Call this function after a performance is sent to backend to refresh stats
  const refreshPerformances = () => setRefreshKey((k) => k + 1);

  // Handle note clicks from the piano keyboard
  const handleNoteClick = (midiNote: number) => {
    // Convert MIDI note to note name
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12] + octave;

    toast.info(`Clicked: ${noteName}`, {
      description: `MIDI note: ${midiNote}`,
      duration: 1000,
    });
  };

  // Handle active notes from the listener
  const handleActiveNotes = (notes: Record<number, boolean>) => {
    setActiveNotes(notes);
  };
  // Initialisation : création session + thread AI

  // Fonctions de contrôle de la pratique
  const endSession = () => {
    setSessionId(null);
    setThreadId(null);
    localStorage.removeItem("practiceSessionId");
    localStorage.removeItem("practiceThreadId");
  };
  useEffect(() => {
    if (!user) return;

    const initializeSession = async () => {
      try {
        const session = await createPracticeSession({ userId: user.id });
        setSessionId(session._id);
        localStorage.setItem("practiceSessionId", session._id);
        setReferenceId(session.reference);
        localStorage.setItem("practiceReferenceId", session.reference);

        const thread = await createThreadForSession({ sessionId: session._id });
        setThreadId(thread.threadId);
        localStorage.setItem("practiceThreadId", thread.threadId);
        // Charger le nom de la partition (reference)
        if (session.reference) {
          getReferenceById(session.reference)
            .then((ref) =>
              setCurrentLesson({
                title: ref.name,
                description:
                  "Practice and get instant AI feedback. Ask the AI any question about the piece!",
              })
            )
            .catch(() =>
              setCurrentLesson({ title: "Unknown Piece", description: "" })
            );
        }
        const userPerf = await getUserSessionPerformances(session._id, user.id);
        setUserPerformances(userPerf);
        setIsLoading(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Erreur création session/thread:", e);
      }
    }

    const existingSessionId = localStorage.getItem("practiceSessionId");
    const existingThreadId = localStorage.getItem("practiceThreadId");
    const existingReferenceId = localStorage.getItem("practiceReferenceId");
    if (existingSessionId && existingThreadId && existingReferenceId) {
      setSessionId(existingSessionId);
      setThreadId(existingThreadId);
      setReferenceId(existingReferenceId);
      // Charger le nom de la partition (reference)
      getReferenceById(existingReferenceId)
        .then((ref) => {
          setCurrentLesson({
            title: ref.name,
            description:
              "Practice and get instant AI feedback. Ask the AI any question about the piece!",
          });
        })
        .catch(() =>
          setCurrentLesson({ title: "Unknown Piece", description: "" })
        );

      getUserSessionPerformances(existingSessionId, user.id).then((userPerf) => {
        setUserPerformances(userPerf);
        setIsLoading(false);
      });
      return;
    } else {
      initializeSession();
    }

    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [user, refreshKey]);

  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setIsListening(false);
      toast.info("Voice recognition paused");
    } else {
      try {
        // Start listening
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        micStreamRef.current = stream;

        if (audioContextRef.current && analyserRef.current) {
          const source =
            audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
        }

        setIsListening(true);
        toast.success("Listening for voice commands", {
          description:
            "Try saying 'Show me how to play this' or 'What is a C major scale?'",
        });
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Could not access microphone", {
          description: "Please check your browser permissions and try again.",
        });
      }
    }
  };

  // Start practice session
  const startPractice = () => {
    setIsPlaying(true);
    toast.success("Practice session started", {
      description: "Play along with the highlighted notes on the keyboard.",
    });
  };
  const endPractice = () => {
    setIsPlaying(false);
    toast.info("Practice session paused", {
      description: "You can resume anytime or end the session.",
    });
  };

  // End session and call backend
  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      await endSessionApi(sessionId);
      toast.success("Session ended successfully!");
      endSession(); // local cleanup
      router.push("/dashboard"); // Redirect to dashboard
      
    } catch (e) {
      toast.error("Failed to end session");
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading practice session...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <MIDIPerformanceProvider>
        <div className="flex flex-col gap-6 relative">
          {/* Lesson Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {currentLesson.title}
              </h1>
              {currentLesson.description && (
                <p className="text-muted-foreground">
                  {currentLesson.description}
                </p>
              )}
            </div>
            <Button variant="destructive" onClick={handleEndSession} disabled={!sessionId}>
              End Session
            </Button>
          </div>

          {/* Voice Waveform - Only shown when listening */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                className="absolute top-24 right-4 z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <VoiceWaveform analyser={analyserRef.current} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Piano Keyboard */}

          <SimpleMidiListener
            onMidiData={handleMidiData}
            onActiveNotes={handleActiveNotes}
            referenceId={referenceId}
            userId={user?.id}
            sessionId={sessionId}
            section="intro"
            onPerformanceSent={refreshPerformances}
          />

          {/* Stats Toggle Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-muted-foreground"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? (
                <>
                  Hide Statistics <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show Statistics <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Progress Statistics Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <ProgressPanel data={userPerformances}  />
          {/* Pass refreshPerformances to children if needed, e.g. to SimpleMidiListener or PracticeControls */}
          {/* <SimpleMidiListener ... onPerformanceSent={refreshPerformances} /> */}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Tutor with integrated chat */}
          <AITutor
            isListening={isListening}
            toggleListening={toggleListening}
            sessionId={sessionId}
            threadId={threadId}
            userId={user?.id}
          />
        </div>
      </MIDIPerformanceProvider>
    </DashboardShell>
  );
}
