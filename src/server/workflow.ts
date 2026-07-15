import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// In a real app we'd verify auth on the server, but for simplicity with client-side Supabase auth + server functions:
// We expect the client to pass the user ID or we use a service role if we are strictly on the server.
// For now, these functions just take the required IDs and act.

export const verifyProposal = createServerFn({ method: "POST" })
  .validator((data: { proposalId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const { proposalId, userId } = data;
    const { data: updated, error } = await supabase
      .from("proposals")
      .update({ status: "verified", verified_by: userId })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Log audit trail
    await supabase.from("audit_trails").insert({
      user_id: userId,
      entity_type: "proposal",
      entity_id: proposalId,
      old_status: "in_review",
      new_status: "verified",
      action: "verify",
    });

    return updated;
  });

export const sendProposal = createServerFn({ method: "POST" })
  .validator((data: { proposalId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const { proposalId, userId } = data;
    
    // 1. Mark as sent
    const { data: updated, error } = await supabase
      .from("proposals")
      .update({ 
        status: "sent", 
        sent_at: new Date().toISOString(),
        last_reminder_at: new Date().toISOString(),
        reminder_count: 0
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 2. Mock sending Email & WhatsApp
    console.log(`Sending Email and WhatsApp for proposal ${proposalId}...`);

    // 3. Log to message_logs
    await supabase.from("message_logs").insert([
      {
        user_id: userId,
        entity_type: "proposal",
        entity_id: proposalId,
        channel: "email",
        direction: "outbound",
        status: "sent"
      },
      {
        user_id: userId,
        entity_type: "proposal",
        entity_id: proposalId,
        channel: "whatsapp",
        direction: "outbound",
        status: "sent"
      }
    ]);

    // 4. Audit trail
    await supabase.from("audit_trails").insert({
      user_id: userId,
      entity_type: "proposal",
      entity_id: proposalId,
      old_status: "verified",
      new_status: "sent",
      action: "send",
    });

    return updated;
  });

export const submitDetailing = createServerFn({ method: "POST" })
  .validator((data: { proposalId: string; userId: string; scope: any; schedule: any; resources: any }) => data)
  .handler(async ({ data }) => {
    const { proposalId, userId, scope, schedule, resources } = data;
    
    const { data: details, error } = await supabase
      .from("proposal_details")
      .insert({
        proposal_id: proposalId,
        user_id: userId,
        scope_fields: scope,
        schedule_fields: schedule,
        resource_fields: resources,
        filled_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return details;
  });

export const authorizeInvoice = createServerFn({ method: "POST" })
  .validator((data: { proposalId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const { proposalId, userId } = data;

    // Fetch proposal to create invoice from it
    const { data: proposal, error: propErr } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (propErr || !proposal) throw new Error(propErr?.message || "Proposal not found");

    // Generate draft invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        proposal_id: proposalId,
        template_id: proposal.template_id,
        number: `INV-${Date.now()}`,
        status: "draft",
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        client_address: proposal.client_address,
        total: proposal.total,
        authorized_by: userId,
      })
      .select()
      .single();

    if (invErr) throw new Error(invErr.message);

    // Audit trail
    await supabase.from("audit_trails").insert({
      user_id: userId,
      entity_type: "proposal",
      entity_id: proposalId,
      new_status: "invoice_authorized",
      action: "authorize_invoice",
    });

    return invoice;
  });
