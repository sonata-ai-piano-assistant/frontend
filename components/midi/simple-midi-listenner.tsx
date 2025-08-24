"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Trash2, Music } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Helper function to convert MIDI note number to note name
const getNoteName = (noteNumber: number): string => {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const octave = Math.floor(noteNumber / 12) - 1
  const noteName = noteNames[noteNumber % 12]
  return `${noteName}${octave}`
}

import { useRef } from "react"
import { createPerformance } from "@/lib/api/performance"
import { analyzePerformance } from "@/lib/api/analyze"
import { getReferenceById } from "@/lib/api/reference"
import { MidiNote } from "@/types"

interface SimpleMidiListenerProps {
  clearMidiData: () => void
  onMidiData: (data: MidiNote) => void
  userId?: string
  sessionId: string | null
  referenceId: string | null // adapte le type si tu as un type Reference
  section?: "intro" | "verse" | "chorus" | "bridge" | "outro"
  onPerformanceSent?: () => void
  midiData: MidiNote[]
  activeNote: Record<number, boolean>
  setActiveNotes: (note: number) => void
  clearActiveNotes: () => void
}


export function SimpleMidiListener(props: SimpleMidiListenerProps) {
  const { onMidiData, userId, sessionId, referenceId, section = "intro", onPerformanceSent, midiData, clearMidiData, activeNote, setActiveNotes, clearActiveNotes } = props
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...")
  const [error, setError] = useState<string | null>(null)
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null)
  const isSendingRef = useRef(false)

  useEffect(() => {
    // Check if Web MIDI API is supported
    if (!navigator.requestMIDIAccess) {
      setError("Web MIDI API is not supported in this browser.")
      setConnectionStatus("Not supported")
      return
    }

    if (!midiAccess) {
      navigator
        .requestMIDIAccess()
        .then((access) => {
          setMidiAccess(access)
          // Setup MIDI device connection listener
          access.addEventListener("statechange", handleStateChange)
          // Initial connection check
          const inputs = Array.from(access.inputs.values())
          if (inputs.length === 0) {
            setConnectionStatus("No MIDI devices found")
          } else {
            setConnectionStatus(`Connected to ${inputs.length} MIDI device(s)`)
            setupMidiListeners(access)
          }
        })
        .catch((err) => {
          console.error("MIDI Access Error:", err)
          setError(`Failed to access MIDI devices: ${err.message}`)
          setConnectionStatus("Connection failed")
        })
    }

    return () => {
      if (midiAccess) {
        midiAccess.removeEventListener("statechange", handleStateChange)
      }
    }
  }, [])

  const handleStateChange = (event: MIDIConnectionEvent) => {
    const { port } = event
    if (port && port.type === "input") {
      if (port.state === "connected") {
        setConnectionStatus(`Connected to ${port.name || "MIDI device"}`)
        if (midiAccess) setupMidiListeners(midiAccess)
      } else {
        setConnectionStatus("MIDI device disconnected")
      }
    }
  }

  const setupMidiListeners = (access: MIDIAccess) => {
    access.inputs.forEach((input) => {
      input.onmidimessage = handleMidiMessage
    })
  }

  const handleMidiMessage = (msg: MIDIMessageEvent) => {
    if (!msg.data) return;
    const [command, note, velocity] = msg.data

    // Note On event (command 144-159) with velocity > 0
    if (command >= 144 && command <= 159 && velocity > 0) {
      const noteName = getNoteName(note)
      const newNote = { note, noteName, velocity, time: Date.now() }

      onMidiData(newNote)
      setActiveNotes(note);

      // --- Suppression du timer, déclenchement manuel par bouton ---
    }
    // Note Off event (command 128-143) or Note On with velocity 0
    else if ((command >= 128 && command <= 143) || (command >= 144 && command <= 159 && velocity === 0)) {
      clearActiveNotes();
    }

  }
  // --- Fonction pour envoyer la performance à l’API et à l’IA ---
  const sendPerformance = async () => {
    if (isSendingRef.current) return;
    if (!userId || !sessionId || !referenceId || midiData.length === 0) return;
    isSendingRef.current = true;
    try {
      const notesChrono = [...midiData].reverse();
      const startedAt = notesChrono[0]?.time;
      const endedAt = notesChrono[notesChrono.length - 1]?.time;
      const perf = await createPerformance({
        user: userId,
        session: sessionId,
        midiNotes: notesChrono.map(({ note, velocity, time }) => ({ note, velocity, time })),
        startedAt: new Date(startedAt),
        endedAt: new Date(endedAt),
        section: section || "intro",
      });
      console.log("Performance created:", perf);
      const reference = await getReferenceById(referenceId);
      console.log("Reference data:", reference);
      await analyzePerformance({ performance: perf, reference });
      console.log("Performance analyzed successfully");
      clearMidiData()
      if (onPerformanceSent) onPerformanceSent();
    } catch (e) {
      console.error("Failed to send performance or analyze:", e);
    } finally {
      isSendingRef.current = false;
    }
  };

  // Create an array of all possible piano keys for visualization
  const pianoKeys = Array.from({ length: 88 }, (_, i) => i + 21) // MIDI notes 21-108 (standard 88-key piano)

  // Appelle onActiveNotes quand activeNotes change
  // useEffect(() => {
  //   onActiveNotes(activeNotes)
  // }, [activeNotes])

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Music className="h-6 w-6" />
              MIDI Input
            </CardTitle>
            <CardDescription>Connect a MIDI device to see and hear the notes you play</CardDescription>
          </div>
          <Badge
            variant={connectionStatus.includes("Connected") ? "default" : "destructive"}
            className="text-xs px-3 py-1"
          >
            {connectionStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={sendPerformance}
            disabled={midiData.length === 0 || isSendingRef.current || !userId || !sessionId || !referenceId}
            className="mb-4"
          >
            Terminer la performance
          </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {!navigator.requestMIDIAccess && (
                <p className="mt-2 text-sm">
                  Please use a browser that supports Web MIDI API, such as Chrome, Edge, or Opera.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="text-lg font-medium mb-3">Active Notes</h3>
          <div className="flex flex-wrap gap-1 mb-4 min-h-16 p-4 border rounded-md bg-muted/20">
            {Object.keys(activeNote).length === 0 ? (
              <p className="text-muted-foreground text-sm">No active notes. Play your MIDI device...</p>
            ) : (
              Object.keys(activeNote).map((noteNumber) => {
                const note = Number.parseInt(noteNumber)
                return (
                  <Badge
                    key={note}
                    variant="secondary"
                    className="text-sm px-3 py-1 bg-primary text-primary-foreground animate-pulse"
                  >
                    {getNoteName(note)}
                  </Badge>
                )
              })
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Piano Visualization</h3>
          <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-thin">
            <div className="flex h-20 min-w-max">
              {pianoKeys.map((note) => {
                const noteName = getNoteName(note)
                const isBlackKey = noteName.includes("#")
                const isActive = activeNote[note]
                return (
                  <div
                    key={note}
                    className={`
                      ${isBlackKey
                        ? `h-12 w-6 -mx-3 z-10 relative text-white ${isActive ? "bg-primary" : "bg-black"}`
                        : `h-20 w-8  border border-gray-300 ${isActive ? "bg-primary/20" : "bg-white"}`
                      }
                      flex items-end justify-center pb-1 text-[8px] transition-colors
                    `}
                  >
                    {!isBlackKey && noteName.includes("C") && <span>{noteName}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">MIDI History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMidiData}
              disabled={midiData.length === 0}
              className="flex items-center gap-1 bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="border rounded-md overflow-hidden">
            {midiData.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4">No MIDI data recorded yet.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-sm font-medium">Note</th>
                      <th className="text-left p-2 text-sm font-medium">MIDI #</th>
                      <th className="text-left p-2 text-sm font-medium">Velocity</th>
                      <th className="text-left p-2 text-sm font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {midiData.map((entry, index) => {
                      const time = entry?.time ? new Date(entry.time) : new Date();
                      const timeString = time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })

                      return (
                        <tr key={index} className="border-t hover:bg-muted/10">
                          <td className="p-2 text-sm font-medium">{entry.noteName}</td>
                          <td className="p-2 text-sm">{entry.note}</td>
                          <td className="p-2 text-sm">{entry.velocity}</td>
                          <td className="p-2 text-sm text-muted-foreground">{timeString}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
