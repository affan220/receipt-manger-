import { Member, MONTHS, OrgSettings } from "./store";

export function formatWhatsappReminder(member: Member, settings: OrgSettings) {
  return `AASALAMWAILKUM ${member.name} YOUR RECEIPT OF ${MONTHS[member.month - 1]} ${member.year} IS ${member.status.toUpperCase()}, OF ${settings.currency}${member.amount.toLocaleString()} PLEASE PAY AS EARLY AS POSSIBLE\nALLAH APKO JAZAI KHAIR DE`;
}

export function memberWhatsappUrl(member: Member, settings: OrgSettings) {
  const phone = member.phone.replace(/[^\d]/g, "");
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(formatWhatsappReminder(member, settings))}`;
}
