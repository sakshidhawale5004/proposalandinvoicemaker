-- Migration for workflow tables

-- 1. Update Clients
ALTER TABLE public.clients
ADD COLUMN whatsapp_number TEXT,
ADD COLUMN whatsapp_consent BOOLEAN DEFAULT false;

-- 2. Templates Table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'proposal' or 'invoice'
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  merge_field_schema JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active', -- 'active' or 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER templates_updated BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Update Proposals
ALTER TABLE public.proposals
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
ADD COLUMN status TEXT DEFAULT 'draft',
ADD COLUMN sent_at TIMESTAMPTZ,
ADD COLUMN last_reminder_at TIMESTAMPTZ,
ADD COLUMN reminder_count INTEGER DEFAULT 0,
ADD COLUMN verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Detailing Table (proposal_details)
CREATE TABLE public.proposal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  scope_fields JSONB DEFAULT '{}'::jsonb,
  schedule_fields JSONB DEFAULT '{}'::jsonb,
  resource_fields JSONB DEFAULT '{}'::jsonb,
  filled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_details TO authenticated;
GRANT ALL ON public.proposal_details TO service_role;
ALTER TABLE public.proposal_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own proposal_details" ON public.proposal_details FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER proposal_details_updated BEFORE UPDATE ON public.proposal_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Update Invoices
ALTER TABLE public.invoices
ADD COLUMN proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
ADD COLUMN template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
ADD COLUMN authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Message Logs
CREATE TABLE public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'proposal' or 'invoice'
  entity_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'email' or 'whatsapp'
  direction TEXT NOT NULL, -- 'outbound' or 'inbound'
  status TEXT NOT NULL, -- 'queued', 'sent', 'delivered', 'failed'
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_logs TO authenticated;
GRANT ALL ON public.message_logs TO service_role;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own message_logs" ON public.message_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER message_logs_updated BEFORE UPDATE ON public.message_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Audit Trails
CREATE TABLE public.audit_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_trails TO authenticated;
GRANT ALL ON public.audit_trails TO service_role;
ALTER TABLE public.audit_trails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own audit_trails" ON public.audit_trails FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
