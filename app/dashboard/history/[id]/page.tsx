"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { BDD_SERVICE_URL } from "@/lib/config/service-urls";
import { getThreadById } from "@/lib/api/assistant";
import { ChatMessage } from "@/components/practice/ai-tutor";
import { ISession, IThreadMessage } from "@/types";

const formatAiResponse = (msg: IThreadMessage) => {
  let content = "";
  if (Array.isArray(msg.content)) {
    content = msg.content
      .map((part) => {
        if (part.text && typeof part.text === "object" && part.text.value) {
          return part.text.value;
        }
        if (typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join(" ");
  } else if (typeof msg.content === "string") {
    content = msg.content;
  }
  // Strip [context: ...] prefix from user messages fetched from backend
  content = content.replace(/^\[context:[\s\S]*?\]\s*/, "");
  return {
    id: msg.id,
    content,
    role: msg.role as "user" | "assistant",
    timestamp: new Date(msg.created_at * 1000),
  };
};

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<ISession | null>(null);
  const [threadMessages, setThreadMessages] = useState<
    { id: string; content: string; role: "user" | "assistant"; timestamp: Date }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const fetchThread = (threadId: string) => {
    setChatLoading(true);
    setChatError(null);
    getThreadById(threadId)
      .then((threadData) => {
        const formatted = threadData.messages
          .map(formatAiResponse)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setThreadMessages(formatted);
      })
      .catch((err) => {
        console.error("Error fetching thread:", err);
        setChatError(err?.message || err?.error || "Failed to load chat messages");
      })
      .finally(() => setChatLoading(false));
  };

  useEffect(() => {
    if (!id) return;
    fetch(`${BDD_SERVICE_URL}/api/sessions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        if (data.threadId) {
          fetchThread(data.threadId);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-full">Loading session...</div>
      </DashboardShell>
    );
  }

  if (!session || (session as any).error) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-lg text-muted-foreground">Session not found.</div>
          <Button asChild>
            <Link href="/dashboard/history">Back to History</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const referenceName =
    typeof session.reference === "object" && session.reference !== null
      ? session.reference.name
      : session.reference || "-";

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{referenceName !== "-" ? referenceName : "Session Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2"><b>Session ID:</b> {session._id}</div>
            <div className="mb-2"><b>Started At:</b> {session.startedAt ? new Date(session.startedAt).toLocaleString() : "-"}</div>
            <div className="mb-2"><b>Ended At:</b> {session.endedAt ? new Date(session.endedAt).toLocaleString() : "-"}</div>
            <div className="mb-2"><b>Status:</b> {session.endedAt ? "Ended" : "Active"}</div>
            <div className="mb-2"><b>Reference:</b> {referenceName}</div>
          </CardContent>
        </Card>

        {session.threadId && (
          <Card>
            <CardHeader>
              <CardTitle>AI Chat History</CardTitle>
            </CardHeader>
            <CardContent>
              {chatLoading ? (
                <div className="text-muted-foreground text-sm">Loading chat messages...</div>
              ) : chatError ? (
                <div className="flex flex-col gap-2">
                  <div className="text-destructive text-sm">Error: {chatError}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchThread(session.threadId!)}
                  >
                    Retry
                  </Button>
                </div>
              ) : threadMessages.length > 0 ? (
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-3">
                    {threadMessages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-muted-foreground text-sm">No messages in this thread.</div>
              )}
            </CardContent>
          </Card>
        )}

        <Button asChild variant="outline">
          <Link href="/dashboard/history">Back to History</Link>
        </Button>
      </div>
    </DashboardShell>
  );
}
