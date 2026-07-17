import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useBrand } from "@/lib/brand";
import { MessageTimeline } from "@/components/workflow/MessageTimeline";
import { CheckCircle, Clock, FileText, Send, UserCheck, CheckCircle2, FileEdit } from "lucide-react";
import { verifyProposal, sendProposal, submitDetailing, authorizeInvoice } from "@/actions/workflow";

export const Route = createFileRoute("/_authenticated/proposals/$proposalId/panel")({
  component: ProposalPanel,
});

const STAGES = ["draft", "in_review", "verified", "sent", "viewed", "approved", "invoice_authorized"];
const STAGE_LABELS = {
  draft: "Draft",
  in_review: "Review",
  verified: "Verified",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  invoice_authorized: "Invoiced"
};

function ProposalPanel() {
  const { proposalId } = Route.useParams();
  const { brand } = useBrand();
  const [proposal, setProposal] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detailing state
  const [scope, setScope] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    fetchData();
  }, [proposalId]);

  async function fetchData() {
    setLoading(true);
    try {
      const pRes = await apiFetch<{ data: any }>(`proposals.php?id=${proposalId}`);
      if (pRes.data) setProposal(pRes.data);

      // Assuming we have endpoints or we just fetch these in PHP. 
      // For now, we'll leave messages and audits empty since we haven't built dedicated GET endpoints for logs yet.
      setMessages([]);
      setAudits([]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
      await fetchData(); // refresh state
    } catch (e) {
      console.error(e);
      alert("Failed to perform action");
    }
  };

  const getStageIndex = (status: string) => STAGES.indexOf(status);

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading panel...</div>;
  if (!proposal) return <div className="p-12 text-center text-destructive">Proposal not found.</div>;

  const currentStageIndex = getStageIndex(proposal.status);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Workflow Panel</h1>
          <p className="text-muted-foreground mt-1">Manage state transitions for <span className="font-semibold text-foreground">{proposal.number || proposal.title}</span></p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide">
          {STAGE_LABELS[proposal.status as keyof typeof STAGE_LABELS] || proposal.status}
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-[600px]">
          {STAGES.map((stage, idx) => (
            <div key={stage} className="flex-1 flex flex-col items-center relative group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                idx <= currentStageIndex 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {idx < currentStageIndex ? <CheckCircle2 className="w-5 h-5" /> : <div className="text-xs font-black">{idx + 1}</div>}
              </div>
              <div className={`text-xs mt-2 font-medium ${idx <= currentStageIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`absolute top-4 left-[50%] right-[-50%] h-[2px] -z-0 ${
                  idx < currentStageIndex ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Actions Column */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold">Actions</h2>
          
          {/* Stage 1: Review to Verify */}
          <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm transition-opacity ${proposal.status === 'in_review' || proposal.status === 'draft' ? 'opacity-100 ring-2 ring-primary/20' : 'opacity-50'}`}>
            <div className="flex items-center gap-3 font-semibold mb-2">
              <UserCheck className="w-5 h-5 text-primary" /> Internal Verification
            </div>
            <p className="text-sm text-muted-foreground mb-4">Confirm all details before sending to client.</p>
            <button 
              disabled={proposal.status !== 'in_review' && proposal.status !== 'draft'}
              onClick={async () => {
                return handleAction(() => verifyProposal({ data: { proposalId: proposal.id } }));
              }}
              className="w-full bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              Verify Proposal
            </button>
          </div>

          {/* Stage 2: Send & Track */}
          <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm transition-opacity ${proposal.status === 'verified' ? 'opacity-100 ring-2 ring-primary/20' : 'opacity-50'}`}>
            <div className="flex items-center gap-3 font-semibold mb-2">
              <Send className="w-5 h-5 text-primary" /> Send to Client
            </div>
            <p className="text-sm text-muted-foreground mb-4">Dispatches Email and WhatsApp immediately, and schedules reminders.</p>
            <button 
              disabled={proposal.status !== 'verified'}
              onClick={async () => {
                return handleAction(() => sendProposal({ data: { proposalId: proposal.id } }));
              }}
              className="w-full bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              Send Proposal (Email + WA)
            </button>
          </div>

          {/* Simulate Client Approval */}
          <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm transition-opacity ${(proposal.status === 'sent' || proposal.status === 'viewed') ? 'opacity-100 border-dashed border-blue-400 bg-blue-50/50' : 'opacity-50 hidden'}`}>
            <div className="flex items-center gap-3 font-semibold mb-2 text-blue-800">
              <UserCheck className="w-5 h-5" /> Client Simulation
            </div>
            <p className="text-sm text-blue-600/80 mb-4">Simulate the client approving the proposal from their device.</p>
            <button 
              onClick={async () => {
                await apiFetch(`proposals.php?id=${proposal.id}`, { method: "PUT", body: JSON.stringify({ status: "approved" }) });
                fetchData();
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Simulate Approval
            </button>
          </div>

          {/* Stage 3: Detailing & Invoice Auth */}
          <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm transition-opacity ${proposal.status === 'approved' ? 'opacity-100 ring-2 ring-primary/20' : 'opacity-50'}`}>
            <div className="flex items-center gap-3 font-semibold mb-2">
              <FileEdit className="w-5 h-5 text-primary" /> Manual Detailing
            </div>
            <p className="text-sm text-muted-foreground mb-4">Add final scope and schedule details before invoice generation.</p>
            
            <div className="space-y-3 mb-4">
              <textarea 
                placeholder="Final Scope Details" 
                value={scope} onChange={(e) => setScope(e.target.value)}
                className="w-full text-sm p-3 rounded-lg border border-border bg-background min-h-[80px]"
                disabled={proposal.status !== 'approved'}
              />
              <input 
                placeholder="Schedule Details (e.g. 4 Weeks)" 
                value={schedule} onChange={(e) => setSchedule(e.target.value)}
                className="w-full text-sm p-3 rounded-lg border border-border bg-background"
                disabled={proposal.status !== 'approved'}
              />
            </div>

            <div className="flex gap-2">
              <button 
                disabled={proposal.status !== 'approved'}
                onClick={() => handleAction(() => submitDetailing({ data: { proposalId: proposal.id, scope, schedule, resources: {} } }))}
                className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-xl text-sm font-semibold hover:bg-secondary/80 disabled:opacity-50"
              >
                Save Details
              </button>
              <button 
                disabled={proposal.status !== 'approved'}
                onClick={() => handleAction(() => authorizeInvoice({ data: { proposalId: proposal.id } }))}
                className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                Authorize Invoice
              </button>
            </div>
          </div>
        </div>

        {/* History Column */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Activity Timeline
          </h2>
          <MessageTimeline messages={messages} audits={audits} />
        </div>
      </div>
    </div>
  );
}
