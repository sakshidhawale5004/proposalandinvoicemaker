export type LineItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
  discountPct: number;
};

export type Invoice = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: LineItem[];
  notes: string;
  terms: string;
  status: "draft" | "sent" | "paid";
};

export type ProposalSection = {
  id: string;
  heading: string;
  body: string;
};

export type Proposal = {
  id: string;
  number: string;
  title: string;
  issueDate: string;
  validUntil: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  sections: ProposalSection[];
  items: LineItem[];
  terms: string;
  notes: string;
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function computeTotals(items: LineItem[]) {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const it of items) {
    const gross = it.qty * it.rate;
    const disc = gross * (it.discountPct / 100);
    const net = gross - disc;
    const t = net * (it.taxPct / 100);
    subtotal += gross;
    discount += disc;
    tax += t;
  }
  const total = subtotal - discount + tax;
  return { subtotal, discount, tax, total };
}

export function fmt(n: number, sym = "₹") {
  return `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
