"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck, CreditCard, Flag, Cross, Eye,
  Clock, FileText, Wrench, Lock, Mail,
  Truck, CalendarCheck, BarChart3, Cloud, Fingerprint, Activity,
  ChevronDown,
} from "lucide-react";

const GLANCE_CARDS = [
  { icon: ShieldCheck, title: "Your Data is Protected" },
  { icon: CreditCard, title: "Secure Payments" },
  { icon: Flag, title: "Responsible Communication" },
  { icon: Cross, title: "Confidential Wellness Info" },
  { icon: Eye, title: "Transparent Practices" },
];

const TABS = [
  { label: "Summary", icon: Clock }, { label: "Collection", icon: FileText },
  { label: "Usage", icon: Wrench }, { label: "Security", icon: Lock }, { label: "Your Rights", icon: Mail },
];

const COLLECTED_INFO = [
  { title: "Personal Identity", description: "Name, email address, and contact information used to create and maintain your account." },
  { title: "Gift Details", description: "Recipient names and personalized messages for wellness gift cards and care packages." },
  { title: "Booking Data", description: "Information regarding preferred session types, schedule availability, and session logs." },
];

const USAGE_CARDS = [
  { icon: Truck, title: "Service Delivery", description: "Processing gift cards, delivering digital assets, and ensuring your provider has the necessary context to help." },
  { icon: CalendarCheck, title: "Appointments", description: "Managing calendars, sending session reminders, and coordinating between users and mental health professionals." },
  { icon: CreditCard, title: "Secure Payments", description: "We use PCI-compliant processors to handle billing information. We never store full credit card numbers on our servers." },
  { icon: BarChart3, title: "UX Improvement", description: "Aggregated, anonymous data helps us understand how the platform is used so we can improve our digital sanctuary." },
];

const SECURITY_BADGES = [
  { icon: ShieldCheck, label: "256-bit Encryption", value: "All data in transit" },
  { icon: Cloud, label: "Secure Storage", value: "Encrypted at rest" },
  { icon: Fingerprint, label: "Access Control", value: "Role-based permissions" },
  { icon: Activity, label: "24/7 Monitoring", value: "Continuous threat detection" },
];

const PRIVACY_RIGHTS = [
  { title: "Access & Export Your Data", content: "You have the right to request a copy of all personal data we hold about you. We will provide this in a portable, machine-readable format within 30 days of your request. To export your data, contact our privacy team at privacy@tarewellness.com." },
  { title: "Correction & Deletion", content: "If any information we hold about you is inaccurate or incomplete, you can request a correction at any time from your account settings. You also have the right to request deletion of your data, subject to legal retention requirements for wellness session records." },
  { title: "Communication Preferences", content: "You control how we communicate with you. Manage your email and notification preferences from your account dashboard. You can opt out of marketing communications at any time without affecting essential service notifications like booking confirmations and session reminders." },
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

  const tabSectionMap: Record<string, string> = { "Summary": "summary", "Collection": "collection", "Usage": "usage", "Security": "security", "Your Rights": "rights" };
  const handleTabClick = (tab: string) => { setActiveTab(tab); document.getElementById(tabSectionMap[tab] || "summary")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full overflow-hidden px-5 pb-10 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#B5E1C3]/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 md:flex-row md:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] shadow-sm backdrop-blur-sm"><Clock className="h-3.5 w-3.5" strokeWidth={2.5} />Last Updated: January 2026</span>
            <h1 className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-5xl lg:text-6xl">Your privacy matters to us</h1>
            <p className="mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-[#4E0030]/85 sm:text-[18px]">We are committed to protecting your personal information and maintaining transparency about how your data is collected, used, and stored.</p>
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
              <div id="summary" className="scroll-mt-32"><p className="font-sans text-sm leading-relaxed text-[#4E0030]/75 sm:text-base">This Privacy Policy describes how Tare Wellness collects, uses, and protects your personal information when you use our platform to send wellness gift cards, book care sessions, and communicate with licensed professionals. By using our services, you agree to the practices described below.</p></div>
              <div id="collection" className="scroll-mt-32">
                <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(78, 0, 48, 0.08)] sm:p-8">
                  <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Information We Collect</h3>
                  <p className="mt-3 font-sans text-sm text-[#4E0030]/70 sm:text-base">We only collect information that is necessary for us to provide you with the best possible experience on our platform. This includes:</p>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {COLLECTED_INFO.map((item) => (
                      <div key={item.title} className="rounded-2xl bg-[#FFF5EE]/50 p-5"><h4 className="font-sans text-sm font-bold text-[#4E0030]">{item.title}</h4><p className="mt-2 font-sans text-xs leading-relaxed text-[#4E0030]/65">{item.description}</p></div>
                    ))}
                  </div>
                </div>
              </div>
              <div id="usage" className="scroll-mt-32">
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">How We Use Information</h3>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {USAGE_CARDS.map((card) => { const Icon = card.icon; return (
                    <div key={card.title} className="flex items-start gap-4 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-[#4E0030]/5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush text-[#4E0030]"><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
                      <div><h4 className="font-sans text-sm font-bold text-[#4E0030]">{card.title}</h4><p className="mt-1.5 font-sans text-xs leading-relaxed text-[#4E0030]/65">{card.description}</p></div>
                    </div>
                  ); })}
                </div>
              </div>
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
              </div>
              <div id="rights" className="scroll-mt-32">
                <div className="rounded-2xl border-2 border-dashed border-[#F10897]/30 bg-[#FFF5EE]/40 p-6 sm:p-8">
                  <h3 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Your Privacy Rights</h3>
                  <p className="mt-2 font-sans text-sm text-[#4E0030]/70">You have full control over your personal data. Here&apos;s what you can do:</p>
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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
