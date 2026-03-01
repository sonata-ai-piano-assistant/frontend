"use client";
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Search } from "lucide-react"

import { useEffect, useState } from "react"
import { useUser } from "@/context/UserContext"
import { getSessionsByUserId } from "@/lib/api/session"
import Link from "next/link"
import { ISession } from "@/types";

export default function HistoryPage() {
  type Session = ISession &{
    reference: {
      _id: string;
      name: string;
    }
  }
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getSessionsByUserId(user.id)
        .then((data) => {
          // Sort sessions by startedAt descending (most recent first)
          const sorted = [...data]
            .filter((s) => s.endedAt)
            .sort((a, b) => {
              const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
              const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
              return bTime - aTime;
            });
          setSessions(sorted);
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Practice History</h1>
          <p className="text-muted-foreground">Review your past practice sessions and track your progress over time.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
            <CardDescription>A complete history of your practice sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={3}>No sessions found.</TableCell></TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>{session.startedAt ? new Date(session.startedAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{session.reference.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/history/${session._id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}


