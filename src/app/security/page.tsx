import { MarketingPage, SecuritySection } from "@/components/marketing/marketing-shell";

export default function SecurityPage() {
  return (
    <MarketingPage
      title="Security"
      description="iCheck is designed around authentication, role boundaries, organization isolation, and auditable attendance records."
    >
      <SecuritySection />
    </MarketingPage>
  );
}
