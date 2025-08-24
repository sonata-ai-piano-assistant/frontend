"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { useEffect, useState } from "react";
import { getPerformancesByUser } from "@/lib/api/performance";
import { ArrowRight, Clock, Music, PlayCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { capitalize } from "@/lib/utils";
import { IPerformance } from "@/types";

export default function DashboardPage() {
  const { user } = useUser();
  const [performances, setPerformances] = useState<IPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const displayUsername = user?.firstname ? capitalize(user?.firstname) : user?.username
  useEffect(() => {
    if (user?.id) {
      getPerformancesByUser(user.id)
        .then((data) => setPerformances(data))
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  // Calculate stats
  const totalPracticeTime = performances.reduce((acc, perf) => {
    if (perf.startedAt && perf.endedAt) {
      const start = new Date(perf.startedAt).getTime();
      const end = new Date(perf.endedAt).getTime();
      return acc + Math.max(0, end - start);
    }
    return acc;
  }, 0);
  const totalPracticeHours = (totalPracticeTime / (1000 * 60 * 60)).toFixed(1);
  const streak = 1; // TODO: Calculate real streak
  const songsLearned = new Set(performances.map((p) => p.section)).size;
  const currentLevel = "Beginner";

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {displayUsername}!
          </h1>
          <p className="text-muted-foreground">
            Here is your personalized dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Practice Streak
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {streak} day{streak !== 1 ? "s" : ""}
              </div>
              <p className="text-xs text-muted-foreground">
                Keep your streak going!
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Practice Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPracticeHours} hours
              </div>
              <p className="text-xs text-muted-foreground">
                Across all sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Sections Practiced
              </CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{songsLearned}</div>
              <p className="text-xs text-muted-foreground">Unique sections</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Current Level
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentLevel}</div>
              <p className="text-xs text-muted-foreground">
                Based on your progress
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>
                Your progress over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressChart performances={performances} />
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your last 5 practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : performances.length === 0 ? (
                <div>No sessions yet.</div>
              ) : (
                <ul className="space-y-2">
                  {performances.slice(0, 5).map((perf, idx) => (
                    <li
                      key={perf._id || idx}
                      className="flex flex-col border rounded p-2"
                    >
                      <span className="font-medium">
                        Section: {perf.section}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(perf.startedAt).toLocaleString()}
                      </span>
                      {perf.feedback?.score && (
                        <span className="text-xs">
                          Score: {perf.feedback.score}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Start AI Practice Session</CardTitle>
              <CardDescription>
                Get real-time feedback and guidance from your AI piano tutor
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                Our AI will analyze your playing and provide personalized tips
                to help you improve.
              </p>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button asChild>
                <Link href="/dashboard/practice/ai-session">
                  Start Session <PlayCircle className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
