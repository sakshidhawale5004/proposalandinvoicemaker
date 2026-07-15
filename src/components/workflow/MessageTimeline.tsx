import { CheckCircle2, Clock, Mail, MessageSquare } from "lucide-react";

type MessageEvent = {
  id: string;
  channel: string;
  direction: string;
  status: string;
  created_at: string;
};

type AuditEvent = {
  id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
};

export function MessageTimeline({
  messages,
  audits,
}: {
  messages: MessageEvent[];
  audits: AuditEvent[];
}) {
  // Combine and sort events
  const events = [
    ...messages.map((m) => ({ ...m, type: "message" as const })),
    ...audits.map((a) => ({ ...a, type: "audit" as const })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground italic p-4 text-center">No activity yet.</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((ev) => {
        const time = new Date(ev.created_at).toLocaleString();
        
        if (ev.type === "message") {
          const Icon = ev.channel === "email" ? Mail : MessageSquare;
          return (
            <div key={ev.id} className="flex gap-3 text-sm">
              <div className="mt-0.5 relative">
                <div className="absolute top-5 bottom-[-16px] left-1/2 -translate-x-1/2 w-px bg-border" />
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 bg-card border border-border rounded-lg p-3 shadow-sm">
                <div className="font-medium capitalize">{ev.direction} {ev.channel}</div>
                <div className="text-muted-foreground text-xs mt-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> {time}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ev.status === 'sent' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                    {ev.status}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        // Audit Event
        return (
          <div key={ev.id} className="flex gap-3 text-sm">
            <div className="mt-0.5 relative">
              <div className="absolute top-5 bottom-[-16px] left-1/2 -translate-x-1/2 w-px bg-border" />
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex-1 py-1">
              <div className="text-foreground">
                Action: <span className="font-semibold">{ev.action}</span>
              </div>
              <div className="text-muted-foreground text-xs mt-0.5">
                {ev.old_status} → {ev.new_status} at {time}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
