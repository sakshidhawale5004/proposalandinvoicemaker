import { apiFetch } from "@/lib/api";

export async function verifyProposal(args: { data: { proposalId: string; userId?: string } }) {
  await apiFetch(`workflow.php?action=verify_proposal`, {
    method: "POST",
    body: JSON.stringify({ proposalId: args.data.proposalId })
  });
}

export async function sendProposal(args: { data: { proposalId: string; userId?: string } }) {
  await apiFetch(`workflow.php?action=send_proposal`, {
    method: "POST",
    body: JSON.stringify({ proposalId: args.data.proposalId })
  });
}

export async function submitDetailing(args: { data: { proposalId: string; userId?: string; scope: any; schedule: any; resources: any } }) {
  await apiFetch(`workflow.php?action=submit_detailing`, {
    method: "POST",
    body: JSON.stringify({ 
      proposalId: args.data.proposalId, 
      scope: args.data.scope, 
      schedule: args.data.schedule 
    })
  });
}

export async function authorizeInvoice(args: { data: { proposalId: string; userId?: string } }) {
  const res = await apiFetch<{ invoiceId: string }>(`workflow.php?action=authorize_invoice`, {
    method: "POST",
    body: JSON.stringify({ proposalId: args.data.proposalId })
  });
  return res;
}
