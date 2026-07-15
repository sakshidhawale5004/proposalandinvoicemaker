import { supabase } from "@/integrations/supabase/client";
import { computeTotals, type Invoice, type Proposal } from "./doc-types";

export async function listInvoices() {
  const { data, error } = await supabase.from("invoices").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function listProposals() {
  const { data, error } = await supabase.from("proposals").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getInvoice(id: string) {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getProposal(id: string) {
  const { data, error } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveInvoice(inv: Invoice) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const totals = computeTotals(inv.items);
  const row = {
    id: inv.id,
    user_id: u.user.id,
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
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("invoices").upsert(row);
  if (error) throw error;
}

export async function saveProposal(pr: Proposal) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const totals = computeTotals(pr.items);
  const row = {
    id: pr.id,
    user_id: u.user.id,
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
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("proposals").upsert(row);
  if (error) throw error;
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
}
export async function deleteProposal(id: string) {
  const { error } = await supabase.from("proposals").delete().eq("id", id);
  if (error) throw error;
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
