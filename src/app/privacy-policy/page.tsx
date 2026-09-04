"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, CreditCard, Flag, Cross, Eye,
  Clock, FileText, Wrench, Lock, Mail,
  Truck, CalendarCheck, BarChart3, Cloud, Fingerprint, Activity,
  ChevronDown, Building2, Database, Globe, Trash2, Download,
} from "lucide-react";

const GLANCE_CARDS = [
  { icon: ShieldCheck, title: "NDPA 2023 Compliant" },
  { icon: CreditCard, title: "Secure Payments" },
  { icon: Flag, title: "Responsible Communication" },
  { icon: Cross, title: "Confidential Wellness Info" },
  { icon: Eye, title: "Transparent Practices" },
];

const TABS = [
  { label: "Summary", icon: Clock }, { label: "Collection", icon: FileText },
  { label: "Usage", icon: Wrench }, { label: "Sharing", icon: Globe },
  { label: "Security", icon: Lock }, { label: "Retention", icon: Database },
  { label: "Rights", icon: Mail }, { label: "Cookies", icon: Eye },
];

const COLLECTED_INFO = [
  {
    title: "Personal Identity",
    description: "Name, email address, and hashed password collected when you create an account. Used for authentication and account management.",
    lawfulBasis: "Contract performance (NDPA Section 27(1)(b)) — necessary to provide the service you requested.",
  },
  {
    title: "Gift Card Details",
    description: "Recipient names, emails, personal notes, and occasion markers when you purchase a gift card. Used to deliver the gift and personalize the recipient's experience.",
    lawfulBasis: "Contract performance — necessary to fulfill your gift card order.",
  },
  {
    title: "Booking Data",
    description: "Session type, date, time, therapist name, and redemption code (if applicable). Used to schedule and confirm wellness sessions.",
    lawfulBasis: "Contract performance — necessary to provide the booking service.",
  },
  {
    title: "Payment Information",
    description: "Buyer name, email, and Paystack transaction reference. We do NOT store full card numbers, CVVs, or bank details — those are handled by Paystack.",
    lawfulBasis: "Contract performance — necessary to process your payment.",
  },
  {
    title: "Usage Analytics",
    description: "Aggregated, anonymized data about how you use our site (pages visited, time on site, etc.). We do not link this data to your identity.",
    lawfulBasis: "Legitimate interest (NDPA Section 27(1)(f)) — to improve our service. You can opt out via your browser's Do Not Track setting.",
  },
];

const USAGE_CARDS = [
  { icon: Truck, title: "Service Delivery", description: "Processing gift card orders, delivering digital gift cards via email, and ensuring your provider has the necessary context to help." },
  { icon: CalendarCheck, title: "Appointments", description: "Managing calendars, sending session reminders, and coordinating between users and wellness professionals." },
  { icon: CreditCard, title: "Secure Payments", description: "Payments processed by Paystack (PCI-DSS compliant). We never store full credit card numbers, CVVs, or bank account details on our servers." },
  { icon: BarChart3, title: "Service Improvement", description: "Aggregated, anonymous data helps us understand how the platform is used so we can improve our digital sanctuary." },
  { icon: Mail, title: "Communications", description: "Sending welcome emails, gift card delivery emails, booking confirmations, and occasional service updates. You can opt out of marketing emails anytime." },
];

const THIRD_PARTY_PROCESSORS = [
  {
    name: "Supabase",
    location: "London, United Kingdom (EU)",
    purpose: "Database hosting — stores user accounts, orders, redemptions, and bookings",
    dataShared: "Name, email (hashed password), order data, booking data",
    lawfulBasis: "Processor acting on our behalf (NDPA Section 27(1)(f))",
  },
  {
    name: "Paystack",
    location: "Lagos, Nigeria",
    purpose: "Payment processing — handles card charges and bank transfers",
    dataShared: "Buyer name, email, transaction amount, card details (we never see them)",
    lawfulBasis: "Contract performance — necessary to process your payment",
  },
  {
    name: "Brevo",
    location: "Paris, France (EU)",
    purpose: "Transactional email delivery — sends welcome emails, gift card emails, booking confirmations",
    dataShared: "Sender email, recipient email, email content",
    lawfulBasis: "Contract performance — necessary to deliver service emails",
  },
  {
    name: "Vercel",
    location: "Global (primarily US/EU)",
    purpose: "Web hosting and CDN — serves the website to your browser",
    dataShared: "IP address, browser type, request logs",
    lawfulBasis: "Legitimate interest — necessary to host the website",
  },
];

const SECURITY_BADGES = [
  { icon: ShieldCheck, label: "TLS Encryption", value: "All data in transit" },
  { icon: Cloud, label: "Encrypted Storage", value: "At-rest encryption" },
  { icon: Fingerprint, label: "Password Hashing", value: "bcrypt (12 rounds)" },
  { icon: Activity, label: "Audit Logging", value: "Admin access tracked" },
];

const RETENTION_PERIODS = [
  { data: "User accounts", period: "Indefinite until you request deletion", reason: "Account needed for ongoing service access" },
  { data: "Order records", period: "7 years", reason: "Tax + financial record requirements (CAMA 2020)" },
  { data: "Booking records", period: "7 years", reason: "Wellness service history + dispute resolution" },
  { data: "Redemption codes", period: "Until redeemed + 7 years", reason: "Audit trail for gift card usage" },
  { data: "Email delivery logs", period: "30 days", reason: "Troubleshooting + bounce tracking" },
  { data: "Session cookies", period: "30 days (sliding)", reason: "Authentication — automatically expires" },
  { data: "Server logs (Vercel)", period: "30 days", reason: "Security + debugging" },
  { data: "Consent records", period: "1 year", reason: "NDPA consent tracking (renewed annually)" },
];

const PRIVACY_RIGHTS = [
  { title: "Right of Access", content: "You can request a copy of all personal data we hold about you. We will provide this in a portable, machine-readable format (JSON) within 30 days. Use the \"Download My Data\" button in your account settings, or email privacy@tarewellness.com." },
  { title: "Right to Rectification", content: "If any information we hold about you is inaccurate or incomplete, you can correct it from your account settings, or email privacy@tarewellness.com. We will respond within 7 days." },
  { title: "Right to Erasure (Right to Be Forgotten)", content: "You can request deletion of your account and personal data at any time via the \"Delete My Account\" button in your account settings. Some data (e.g., financial records) may be retained for legal compliance — see the Retention section." },
  { title: "Right to Restrict Processing", content: "You can request that we limit how we use your data (e.g., pause marketing emails while keeping your account active). Email privacy@tarewellness.com to make this request." },
  { title: "Right to Data Portability", content: "You can receive your personal data in a structured, machine-readable format (JSON) and transmit it to another service provider. Use \"Download My Data\" in your account settings." },
  { title: "Right to Object", content: "You can object to processing based on legitimate interests (e.g., analytics). Email privacy@tarewellness.com with the reason for your objection. We will stop processing unless we have compelling legitimate grounds." },
  { title: "Right to Withdraw Consent", content: "For processing based on your consent (e.g., marketing emails, non-essential cookies), you can withdraw consent at any time. Clear your browser cookies or use the unsubscribe link in marketing emails. Withdrawing consent does not affect the lawfulness of processing before withdrawal." },
  { title: "Right to Lodge a Complaint", content: "If you believe we have violated your data protection rights, you have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) at complaint@ndpc.gov.ng or via https://ndpc.gov.ng. We encourage you to contact us first at privacy@tarewellness.com so we can resolve the issue." },
];

const COOKIE_TYPES = [
  { name: "Essential Cookies", purpose: "Authentication, cart state, session management", example: "next-auth.session-token, tare-wellness-store", canDisable: false },
  { name: "Functional Cookies", purpose: "Remember your preferences (e.g., cookie consent acknowledgment)", example: "tare-cookie-consent", canDisable: false },
  { name: "Analytics Cookies", purpose: "Anonymous usage data to improve the site", example: "(none currently — we may add Plausible in the future)", canDisable: true },
  { name: "Marketing Cookies", purpose: "Track conversions for advertising campaigns", example: "(none currently)", canDisable: true },
  { name: "Third-Party Cookies", purpose: "Set by Paystack during payment processing", example: "Paystack session cookies", canDisable: false },
];

export default function PrivacyPolicyPage() {
  const [activeTab, setActiveTab] = useState("Summary");
  const [openRight, setOpenRight] = useState<number | null>(0);

  if (typeof document !== "undefined") {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);

  const tabSectionMap: Record<string, string> = {
    "Summary": "summary",
    "Collection": "collection",
    "Usage": "usage",
    "Sharing": "sharing",
    "Security": "security",
    "Retention": "retention",
    "Rights": "rights",
    "Cookies": "cookies",
  };
  const handleTabClick = (tab: string) => { setActiveTab(tab); document.getElementById(tabSectionMap[tab] || "summary")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full overflow-hidden px-5 pb-10 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#B5E1C3]/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 md:flex-row md:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] shadow-sm backdrop-blur-sm"><Clock className="h-3.5 w-3.5" strokeWidth={2.5} />Last Updated: September 2026</span>
            <h1 className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-5xl lg:text-6xl">Your privacy matters to us</h1>
            <p className="mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-[#4E0030]/85 sm:text-[18px]">This Privacy Policy explains how Tare Wellness Enterprise Ltd collects, uses, and protects your personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative aspect-square w-full max-w-xs bg-transparent sm:max-w-sm lg:max-w-md">
            <Image src="/hero-privacy.png" alt="A whimsical blue creature holding a cardboard box labeled PRIVATE" fill priority sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 400px" className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]" />
          </motion.div>
        </div>
      </section>

      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center font-fraunces text-2xl font-extrabold tracking-tight text-[#4E0030] sm:text-3xl lg:text-4xl">Privacy at a Glance</motion.h2>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {GLANCE_CARDS.map((card) => { const Icon = card.icon; return (
              <motion.div key={card.title} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-center shadow-[0_8px_30px_rgba(78, 0, 48, 0.10)] sm:p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush text-[#4E0030]"><Icon className="h-6 w-6" strokeWidth={2.5} /></span>
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#4E0030] sm:text-xs">{card.title}</span>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>

      <section className="relative w-full px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_15px_50px_rgba(78, 0, 48, 0.12)]">
            <div className="border-b border-[#4E0030]/10 px-6 py-6 text-center sm:px-8 sm:py-8">
              <h2 className="font-fraunces text-xl font-bold tracking-tight text-[#4E0030] sm:text-2xl">PRIVACY POLICY</h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                {TABS.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.label; return (
                  <button key={tab.label} type="button" onClick={() => handleTabClick(tab.label)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-sans text-xs font-semibold transition-all duration-200 sm:text-sm ${isActive ? "bg-[#F10897] text-white shadow-sm" : "text-[#4E0030]/60 hover:bg-white/60 hover:text-[#4E0030]"}`}><Icon className="h-3.5 w-3.5" strokeWidth={2.5} />{tab.label}</button>
                ); })}
              </div>
            </div>
            <div className="space-y-12 p-6 sm:p-8 lg:p-10">
              {/* SUMMARY */}
              <div id="summary" className="scroll-mt-32 space-y-4">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Summary</h3>
                <p className="font-sans text-sm leading-relaxed text-[#4E0030]/75 sm:text-base">Tare Wellness Enterprise Ltd (&ldquo;Tare Wellness,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is the data controller responsible for your personal data under the Nigeria Data Protection Act (NDPA) 2023. This Privacy Policy describes how we collect, use, share, and protect your personal data when you use our website and services.</p>
                <p className="font-sans text-sm leading-relaxed text-[#4E0030]/75 sm:text-base">By using Tare Wellness, you consent to the practices described in this policy. If you do not agree with these practices, please do not use our services.</p>

                <div className="rounded-2xl bg-[#FFF5EE]/60 p-5">
                  <h4 className="flex items-center gap-2 font-sans text-sm font-bold text-[#4E0030]"><Building2 className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />Data Controller</h4>
                  <div className="mt-3 space-y-1 font-sans text-xs text-[#4E0030]/75 sm:text-sm">
                    <p><strong>Tare Wellness Enterprise Ltd</strong></p>
                    <p>Privacy Team: <Link href="mailto:privacy@tarewellness.com" className="text-[#F10897] font-semibold hover:underline">privacy@tarewellness.com</Link></p>
                    <p>General inquiries: <Link href="mailto:hello@tarewellness.com" className="text-[#F10897] font-semibold hover:underline">hello@tarewellness.com</Link></p>
                    <p>Response time: Within 30 days for data subject requests (per NDPA Section 34)</p>
                  </div>
                </div>
              </div>

              {/* COLLECTION */}
              <div id="collection" className="scroll-mt-32">
                <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(78, 0, 48, 0.08)] sm:p-8">
                  <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Information We Collect</h3>
                  <p className="mt-3 font-sans text-sm text-[#4E0030]/70 sm:text-base">We only collect personal data necessary for providing our service. For each category, we cite the lawful basis as required by NDPA Section 27.</p>
                  <div className="mt-6 space-y-4">
                    {COLLECTED_INFO.map((item) => (
                      <div key={item.title} className="rounded-2xl bg-[#FFF5EE]/50 p-5">
                        <h4 className="font-sans text-sm font-bold text-[#4E0030]">{item.title}</h4>
                        <p className="mt-2 font-sans text-xs leading-relaxed text-[#4E0030]/65 sm:text-sm">{item.description}</p>
                        <p className="mt-2 font-sans text-[11px] italic leading-relaxed text-[#F10897] sm:text-xs"><strong>Lawful basis:</strong> {item.lawfulBasis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* USAGE */}
              <div id="usage" className="scroll-mt-32">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">How We Use Your Information</h3>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {USAGE_CARDS.map((card) => { const Icon = card.icon; return (
                    <div key={card.title} className="flex items-start gap-4 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-[#4E0030]/5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush text-[#4E0030]"><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
                      <div><h4 className="font-sans text-sm font-bold text-[#4E0030]">{card.title}</h4><p className="mt-1.5 font-sans text-xs leading-relaxed text-[#4E0030]/65">{card.description}</p></div>
                    </div>
                  ); })}
                </div>
              </div>

              {/* SHARING (third-party processors + cross-border transfers) */}
              <div id="sharing" className="scroll-mt-32">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Data Sharing &amp; Cross-Border Transfers</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#4E0030]/75 sm:text-base">We do not sell your personal data. We share it with the following third-party processors to deliver our services. Some processors are located outside Nigeria — NDPA Section 41 requires us to disclose this and ensure adequate safeguards.</p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-maroon/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#4E0030] text-white">
                        <tr>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Processor</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Location</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Purpose</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em] hidden md:table-cell">Lawful Basis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {THIRD_PARTY_PROCESSORS.map((p, i) => (
                          <tr key={p.name} className={i % 2 === 0 ? "bg-white" : "bg-[#FFF5EE]/30"}>
                            <td className="px-4 py-3 align-top">
                              <p className="font-sans text-sm font-bold text-[#4E0030]">{p.name}</p>
                              <p className="mt-1 font-sans text-[10px] text-[#4E0030]/60 md:hidden"><em>{p.lawfulBasis}</em></p>
                            </td>
                            <td className="px-4 py-3 align-top font-sans text-xs text-[#4E0030]/75">{p.location}</td>
                            <td className="px-4 py-3 align-top font-sans text-xs text-[#4E0030]/75">{p.purpose}<br /><span className="text-[10px] text-[#4E0030]/55"><strong>Shared:</strong> {p.dataShared}</span></td>
                            <td className="px-4 py-3 align-top font-sans text-xs italic text-[#4E0030]/65 hidden md:table-cell">{p.lawfulBasis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-4 font-sans text-xs text-[#4E0030]/60 sm:text-sm">For transfers outside Nigeria, we rely on standard contractual clauses and the processor&apos;s own compliance with applicable data protection laws (e.g., GDPR for EU-based processors). You have the right to be informed about the safeguards in place — contact privacy@tarewellness.com for details.</p>
              </div>

              {/* SECURITY */}
              <div id="security" className="scroll-mt-32">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Data Security</h3>
                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {SECURITY_BADGES.map((badge) => { const Icon = badge.icon; return (
                    <div key={badge.label} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-[0_4px_20px_rgba(78, 0, 48, 0.08)]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F10897] text-white"><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
                      <span className="font-sans text-xs font-bold text-[#4E0030]">{badge.label}</span><span className="font-sans text-[10px] text-[#4E0030]/55">{badge.value}</span>
                    </div>
                  ); })}
                </div>
                <p className="mt-4 font-sans text-xs leading-relaxed text-[#4E0030]/65 sm:text-sm">In the event of a personal data breach, we will notify the Nigeria Data Protection Commission (NDPC) and affected data subjects within 72 hours of becoming aware of the breach, as required by NDPA Section 17.</p>
              </div>

              {/* RETENTION */}
              <div id="retention" className="scroll-mt-32">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Data Retention</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#4E0030]/75 sm:text-base">We retain personal data only as long as necessary for the purposes described in this policy, or as required by Nigerian law (e.g., financial record retention under the Companies and Allied Matters Act 2020).</p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-maroon/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#4E0030] text-white">
                        <tr>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Data Type</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Retention Period</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em] hidden md:table-cell">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RETENTION_PERIODS.map((r, i) => (
                          <tr key={r.data} className={i % 2 === 0 ? "bg-white" : "bg-[#FFF5EE]/30"}>
                            <td className="px-4 py-3 font-sans text-xs font-bold text-[#4E0030] sm:text-sm">{r.data}</td>
                            <td className="px-4 py-3 font-sans text-xs text-[#4E0030]/75 sm:text-sm">{r.period}</td>
                            <td className="px-4 py-3 font-sans text-xs italic text-[#4E0030]/60 hidden md:table-cell">{r.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-4 font-sans text-xs text-[#4E0030]/65 sm:text-sm">When retention periods expire, we securely delete or anonymize the data. You can request early deletion of your data subject to legal retention requirements — see Your Rights below.</p>
              </div>

              {/* RIGHTS */}
              <div id="rights" className="scroll-mt-32">
                <div className="rounded-2xl border-2 border-dashed border-[#F10897]/30 bg-[#FFF5EE]/40 p-6 sm:p-8">
                  <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Your Data Protection Rights (NDPA 2023)</h3>
                  <p className="mt-2 font-sans text-sm text-[#4E0030]/70">Under the Nigeria Data Protection Act 2023, you have the following rights regarding your personal data. To exercise any of these rights, use the buttons in your <Link href="/account" className="text-[#F10897] font-semibold hover:underline">account settings</Link> or email privacy@tarewellness.com.</p>
                  <div className="mt-6 space-y-3">
                    {PRIVACY_RIGHTS.map((right, i) => { const isOpen = openRight === i; return (
                      <div key={right.title} className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_15px_rgba(78, 0, 48, 0.06)]">
                        <button type="button" onClick={() => setOpenRight(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                          <span className="font-sans text-sm font-bold text-[#4E0030] sm:text-base">{right.title}</span>
                          <ChevronDown className={`h-5 w-5 shrink-0 text-[#4E0030] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
                        </button>
                        {isOpen && <p className="px-5 pb-4 font-sans text-sm leading-relaxed text-[#4E0030]/70">{right.content}</p>}
                      </div>
                    ); })}
                  </div>
                </div>
              </div>

              {/* COOKIES */}
              <div id="cookies" className="scroll-mt-32">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Cookies &amp; Tracking Technologies</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#4E0030]/75 sm:text-base">We use cookies and similar technologies to operate the site, remember your preferences, and understand how you use our services. We use a cookie consent banner to obtain your acknowledgment before setting non-essential cookies, as required by NDPA Section 28.</p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-maroon/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#4E0030] text-white">
                        <tr>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Cookie Type</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Purpose</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em] hidden md:table-cell">Example</th>
                          <th className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.12em]">Can Disable?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COOKIE_TYPES.map((c, i) => (
                          <tr key={c.name} className={i % 2 === 0 ? "bg-white" : "bg-[#FFF5EE]/30"}>
                            <td className="px-4 py-3 font-sans text-xs font-bold text-[#4E0030] sm:text-sm">{c.name}</td>
                            <td className="px-4 py-3 font-sans text-xs text-[#4E0030]/75">{c.purpose}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-[#4E0030]/55 hidden md:table-cell">{c.example}</td>
                            <td className="px-4 py-3 font-sans text-xs font-semibold text-[#4E0030]">{c.canDisable ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-4 font-sans text-xs leading-relaxed text-[#4E0030]/65 sm:text-sm">To withdraw cookie consent, clear the <code className="rounded bg-[#FFF5EE] px-1 py-0.5 font-mono text-[11px]">tare-cookie-consent</code> cookie in your browser settings — the consent banner will reappear on your next visit. You can also configure your browser to block all cookies, but this may affect site functionality (e.g., you may not be able to log in).</p>
              </div>

              {/* CONTACT */}
              <div className="rounded-2xl bg-[#4E0030] p-6 text-center text-white sm:p-8">
                <h3 className="font-fraunces text-xl font-bold sm:text-2xl">Questions about your privacy?</h3>
                <p className="mt-3 font-sans text-sm text-white/80 sm:text-base">Contact our privacy team — we respond within 30 days, usually much faster.</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href="mailto:privacy@tarewellness.com" className="inline-flex items-center gap-2 rounded-full bg-[#F10897] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:scale-[1.02] hover:bg-[#d4007d] sm:text-sm"><Mail className="h-4 w-4" strokeWidth={2.5} />privacy@tarewellness.com</Link>
                  <Link href="/contact-us" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:scale-[1.02] hover:bg-white/10 sm:text-sm">Contact Form</Link>
                </div>
                <p className="mt-5 font-sans text-[11px] text-white/50">To lodge a complaint with the Nigeria Data Protection Commission: complaint@ndpc.gov.ng · https://ndpc.gov.ng</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
