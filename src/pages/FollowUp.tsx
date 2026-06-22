import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, MessageCircle, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ReceiptPreviewDialog } from "@/components/ReceiptPreviewDialog";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/app-context";
import { Member, MONTHS } from "@/lib/store";
import { generateReceiptPDF } from "@/lib/receipt";
import { memberWhatsappUrl } from "@/lib/messages";
import { toast } from "sonner";

const statusClasses: Record<Member["status"], string> = {
  paid: "bg-success/15 text-success border-success/30",
  unpaid: "bg-destructive/15 text-destructive border-destructive/30",
  pending: "bg-warning/15 text-warning border-warning/30",
};

function dueAmount(member: Member) {
  return member.amount * Math.max(1, member.months_pending || 1);
}

export default function FollowUp() {
  const { members, settings, setStatus } = useApp();
  const [search, setSearch] = useState("");
  const [previewMember, setPreviewMember] = useState<Member | null>(null);

  const dueMembers = useMemo(() => {
    return members
      .filter((member) => member.status !== "paid")
      .filter((member) => {
        if (!search) return true;
        return `${member.name} ${member.phone}`.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const aPeriod = a.year * 100 + a.month;
        const bPeriod = b.year * 100 + b.month;
        if (aPeriod !== bPeriod) return aPeriod - bPeriod;
        if (a.months_pending !== b.months_pending) return b.months_pending - a.months_pending;
        return a.name.localeCompare(b.name);
      });
  }, [members, search]);

  const summary = useMemo(() => {
    const unpaid = dueMembers.filter((member) => member.status === "unpaid").length;
    const pending = dueMembers.filter((member) => member.status === "pending").length;
    const outstanding = dueMembers.reduce((sum, member) => sum + dueAmount(member), 0);
    return { unpaid, pending, outstanding, total: dueMembers.length };
  }, [dueMembers]);

  const remind = (member: Member) => {
    const url = memberWhatsappUrl(member, settings);
    if (!url) {
      toast.error("No phone number on file");
      return;
    }
    window.open(url, "_blank");
  };

  const generateReceipt = async () => {
    if (!previewMember) return;
    try {
      const no = await generateReceiptPDF(previewMember, settings);
      setPreviewMember(null);
      toast.success(`Receipt ${no} generated`);
    } catch {
      toast.error("Failed to generate receipt");
    }
  };

  return (
    <AppShell title="Follow Up" subtitle="Unpaid and pending members sorted by oldest dues first">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Need Follow Up" value={summary.total} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Unpaid" value={summary.unpaid} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Pending" value={summary.pending} icon={FileText} tone="warning" />
        <StatCard label="Outstanding" value={`${settings.currency}${summary.outstanding.toLocaleString()}`} icon={CheckCircle2} tone="primary" />
      </div>

      <div className="card-surface mb-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search follow-up list..."
            className="pl-9"
          />
        </div>
      </div>

      {dueMembers.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <p className="font-medium">No follow-ups right now.</p>
          <p className="mt-1 text-sm text-muted-foreground">Unpaid and pending members will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {dueMembers.map((member) => (
            <div key={member.id} className="card-surface p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{member.name}</h2>
                    <Badge className={statusClasses[member.status]} variant="outline">{member.status}</Badge>
                    {member.hold && <Badge variant="secondary">Hold</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{member.phone || "No phone"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Period</p>
                    <p className="font-semibold">{MONTHS[member.month - 1]} {member.year}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                    <p className="font-semibold">{Math.max(1, member.months_pending || 1)} month{Math.max(1, member.months_pending || 1) > 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Due</p>
                    <p className="font-display text-lg font-bold">{settings.currency}{dueAmount(member).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:w-[330px]">
                  <Button variant="outline" size="sm" onClick={() => remind(member)}>
                    <MessageCircle className="h-4 w-4" />
                    Remind
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPreviewMember(member)}>
                    <FileText className="h-4 w-4" />
                    Receipt
                  </Button>
                  <Button size="sm" onClick={() => { setStatus(member.id, "paid"); toast.success("Marked as paid"); }}>
                    <CheckCircle2 className="h-4 w-4" />
                    Paid
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewMember && (
        <ReceiptPreviewDialog
          member={previewMember}
          settings={settings}
          open={!!previewMember}
          onOpenChange={(open) => !open && setPreviewMember(null)}
          onConfirm={generateReceipt}
        />
      )}
    </AppShell>
  );
}
