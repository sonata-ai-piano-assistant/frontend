"use client";

import { useState, useEffect, useRef } from "react";
import { getReferenceById } from "@/lib/api/reference";
import { useUser } from "@/context/UserContext";
import { Midi } from "@tonejs/midi";
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
import { useMidiStore } from "@/store/midi-store";
import { ILesson, MidiNote } from "@/types";
import { fetchMidiFileBySongName } from "@/lib/api/music";
import { CustomMidiPlayer } from "@/components/midi/midi-player";

export default function AIPracticePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<ILesson>({
    title: "",
    description: "",
  });
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [musicBlob, setMusicBlob] = useState<Blob | null>(null);
  const { user } = useUser();
  const [showMidiListener, setShowMidiListener] = useState(false);
  const [userPerformances, setUserPerformances] = useState<any>([]);
  const [midiSong,setMidiSong]= useState<Midi|null>(null);
  // For triggering a refresh after a new performance
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const {
    midiNotes,
    addMidiNote,
    clearMidiNotes,
    activeNotes,
    setActiveNote,
    clearActiveNote,
  } = useMidiStore();

  const clearMidiData = () => clearMidiNotes();
  // Handle MIDI data from the listener
  const handleMidiData = (data: MidiNote) => {
    addMidiNote(data);
  };

  // Call this function after a performance is sent to backend to refresh stats
  const refreshPerformances = () => setRefreshKey((k) => k + 1);

  // Fonctions de contrôle de la pratique
  const endSession = () => {
    setSessionId(null);
    setThreadId(null);
    localStorage.removeItem("practiceSessionId");
    localStorage.removeItem("practiceThreadId");
  };
  
  const setupMidi = async (blob: Blob) => {
    const initMidi = new Midi(await blob.arrayBuffer());
    setMidiSong(initMidi);
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
            .then(async (ref) => {
              setCurrentLesson({
                title: ref.name,
                description:
                  "Practice and get instant AI feedback. Ask the AI any question about the piece!",
              });
              const midiBlob = await fetchMidiFileBySongName(ref.name);
              setupMidi(midiBlob);
            })
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
    };

    const existingSessionId = localStorage.getItem("practiceSessionId");
    const existingThreadId = localStorage.getItem("practiceThreadId");
    const existingReferenceId = localStorage.getItem("practiceReferenceId");
    if (existingSessionId && existingThreadId && existingReferenceId) {
      setSessionId(existingSessionId);
      setThreadId(existingThreadId);
      setReferenceId(existingReferenceId);
      // Charger le nom de la partition (reference)
      getReferenceById(existingReferenceId)
        .then(async (ref) => {
          setCurrentLesson({
            title: ref.name,
            description:
              "Practice and get instant AI feedback. Ask the AI any question about the piece!",
          });
          const midiBlob = await fetchMidiFileBySongName(ref.name);
          setupMidi(midiBlob);
        })
        .catch((err) => {
          setCurrentLesson({ title: "Unknown Piece", description: "" });
        });

      getUserSessionPerformances(existingSessionId, user.id).then(
        (userPerf) => {
          setUserPerformances(userPerf);
          setIsLoading(false);
        }
      );
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
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={!sessionId}
            >
              End Session
            </Button>
          </div>

          {/*Custom Midi player */}
          <CustomMidiPlayer midi={midiSong} />

          {/* Piano Keyboard */}

          <SimpleMidiListener
            clearMidiData={clearMidiData}
            onMidiData={handleMidiData}
            referenceId={referenceId}
            userId={user?.id}
            sessionId={sessionId}
            section="intro"
            onPerformanceSent={refreshPerformances}
            midiData={midiNotes}
            activeNote={activeNotes}
            setActiveNotes={setActiveNote}
            clearActiveNotes={clearActiveNote}
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
                <ProgressPanel data={userPerformances} />
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
