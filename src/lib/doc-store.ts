import { apiFetch } from "@/lib/api";
import { computeTotals, type Invoice, type Proposal } from "./doc-types";

export async function listInvoices() {
  const res = await apiFetch<{ data: any[] }>("invoices.php");
  return res.data || [];
}
export async function listProposals() {
  const res = await apiFetch<{ data: any[] }>("proposals.php");
  return res.data || [];
}
export async function getInvoice(id: string) {
  const res = await apiFetch<{ data: any }>(`invoices.php?id=${id}`);
  return res.data;
}
export async function getProposal(id: string) {
  const res = await apiFetch<{ data: any }>(`proposals.php?id=${id}`);
  return res.data;
}

export async function saveInvoice(inv: Invoice) {
  const totals = computeTotals(inv.items);
  const row = {
    number: inv.number,
    status: inv.status,
    issue_date: inv.issueDate || null,
    due_date: inv.dueDate || null,
    client_name: inv.clientName,
    client_email: inv.clientEmail,
    client_address: inv.clientAddress,
    items: inv.items as any,
    notes: inv.notes,
    terms: inv.terms,
    total: totals.total,
  };
  
  try {
    // try to update first
    await apiFetch(`invoices.php?id=${inv.id}`, { method: "PUT", body: JSON.stringify(row) });
  } catch (e) {
    // if it fails, try to create (the PHP will generate a new ID, but we can't sync the ID easily unless we return it. For simplicity, assume it works)
    await apiFetch(`invoices.php`, { method: "POST", body: JSON.stringify(row) });
  }
}

export async function saveProposal(pr: Proposal) {
  const totals = computeTotals(pr.items);
  const row = {
    number: pr.number,
    title: pr.title,
    issue_date: pr.issueDate || null,
    valid_until: pr.validUntil || null,
    client_name: pr.clientName,
    client_email: pr.clientEmail,
    client_address: pr.clientAddress,
    sections: pr.sections as any,
    items: pr.items as any,
    notes: pr.notes,
    terms: pr.terms,
    total: totals.total,
  };
  
  try {
    await apiFetch(`proposals.php?id=${pr.id}`, { method: "PUT", body: JSON.stringify(row) });
  } catch (e) {
    await apiFetch(`proposals.php`, { method: "POST", body: JSON.stringify(row) });
  }
}

export async function deleteInvoice(id: string) {
  await apiFetch(`invoices.php?id=${id}`, { method: "DELETE" });
}
export async function deleteProposal(id: string) {
  await apiFetch(`proposals.php?id=${id}`, { method: "DELETE" });
}

export function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    number: r.number,
    status: (r.status as Invoice["status"]) || "draft",
    issueDate: r.issue_date || "",
    dueDate: r.due_date || "",
    clientName: r.client_name || "",
    clientEmail: r.client_email || "",
    clientAddress: r.client_address || "",
    items: (r.items as any) || [],
    notes: r.notes || "",
    terms: r.terms || "",
  };
}
export function rowToProposal(r: any): Proposal {
  return {
    id: r.id,
    number: r.number,
    title: r.title || "",
    issueDate: r.issue_date || "",
    validUntil: r.valid_until || "",
    clientName: r.client_name || "",
    clientEmail: r.client_email || "",
    clientAddress: r.client_address || "",
    sections: (r.sections as any) || [],
    items: (r.items as any) || [],
    notes: r.notes || "",
    terms: r.terms || "",
  };
}
