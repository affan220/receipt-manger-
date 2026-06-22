import { FileText, Printer } from "lucide-react";
import { Member, MONTHS, OrgSettings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  member: Member;
  settings: OrgSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ReceiptPreviewDialog({ member, settings, open, onOpenChange, onConfirm }: Props) {
  const amount = `${settings.currency}${member.amount.toLocaleString()}`;
  const period = `${MONTHS[member.month - 1]} ${member.year}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Receipt preview
          </DialogTitle>
          <DialogDescription>Check the receipt details before creating the PDF.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="border-b border-border pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold">{settings.name}</h3>
                <p className="text-sm text-muted-foreground">{settings.tagline}</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                {member.status}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{settings.address}</p>
            <p className="text-xs text-muted-foreground">{settings.phone} | {settings.email}</p>
          </div>

          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Received from</p>
              <p className="mt-1 font-semibold">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.phone || "No phone"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Period</p>
              <p className="mt-1 font-semibold">{period}</p>
              <p className="text-sm text-muted-foreground">Receipt prefix: {settings.receiptPrefix}</p>
            </div>
          </div>

          <div className="rounded-lg bg-primary/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Amount</p>
            <p className="font-display text-3xl font-bold text-primary">{amount}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>
            <Printer className="h-4 w-4" />
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
