import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Pause, StopCircle, Play } from "lucide-react";

type CustomMidiPlayerType = {
  midi: Midi | null;
};

export const CustomMidiPlayer = ({ midi }: CustomMidiPlayerType) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Format ms to mm:ss
  function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

useEffect(() => {
    if (midi) {
        setDuration(midi?.duration ? midi.duration * 1000 : 40);

    }
  }, [midi]);

  const startProgressTracking = () => {
    startTimeRef.current = Date.now() - currentTime;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= duration) {
        setCurrentTime(duration);
        handleStop();
      } else {
        setCurrentTime(elapsed);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePlay = async () => {
    if (isPlaying || !midi) return;
    await Tone.start();

    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth().toDestination();
    }

    if (!partRef.current) {
      partRef.current = new Tone.Part(
        (time, note) => {
          synthRef.current!.triggerAttackRelease(
            note.name,
            note.duration,
            time,
            note.velocity
          );
        },
        midi.tracks.flatMap((track) =>
          track.notes.map((note) => ({
            time: note.time,
            name: note.name,
            duration: note.duration,
            velocity: note.velocity,
          }))
        )
      );
    }
    
    const seekTime = currentTime / 1000;
    partRef.current.start(0, seekTime);
    Tone.getTransport().start("+0", seekTime);
    setIsPlaying(true);
    startProgressTracking();
  };

  const handlePause = () => {
    Tone.getTransport().pause();
    stopProgressTracking();
    setIsPlaying(false);
  };

  const handleStop = () => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    stopProgressTracking();
    partRef.current?.dispose();
    synthRef.current?.dispose();
    partRef.current = null;
    synthRef.current = null;
    setCurrentTime(0);
    setIsPlaying(false);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setCurrentTime(newTime);
    
    if (isPlaying) {
      Tone.getTransport().stop();
      stopProgressTracking();
      
      const seekTime = newTime / 1000;
      partRef.current?.start(0, seekTime);
      Tone.getTransport().start("+0", seekTime);
      startProgressTracking();
    }
  };


  return (
    <div className="flex flex-col gap-2 items-center w-full max-w-md mx-auto p-4 bg-muted/30 rounded-lg shadow">
      <div className="flex items-center gap-2 w-full justify-center">
        <Button
          variant="outline"
          size="icon"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={() => {
            if (isPlaying) {
              handlePause();
            } else {
              handlePlay();
            }
          }}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Stop"
          onClick={handleStop}
        >
          <StopCircle />
        </Button>
        <span className="ml-4 text-xs text-muted-foreground min-w-[60px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        className="w-full accent-primary"
      />
    </div>
    //  <div>
    //   <button onClick={handlePlay} disabled={isPlaying}>Play</button>
    //   <button onClick={handleStop} disabled={!isPlaying}>Stop</button>
    // </div>
  );
};
