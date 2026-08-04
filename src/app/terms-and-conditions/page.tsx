"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Gift, CalendarCheck, CreditCard, Heart, Laptop, PenLine,
  ShoppingCart, Settings, User, CalendarX, ChevronDown, Scale, Headset, Phone,
} from "lucide-react";

const OVERVIEW_CARDS = [
  { icon: Gift, title: "Gift Card Purchases", description: "Terms governing the purchase, delivery, and expiration of digital wellness gifts." },
  { icon: CalendarCheck, title: "Therapy Session Bookings", description: "Policies for scheduling, rescheduling, and preparing for your sessions." },
  { icon: CreditCard, title: "Payments & Billing", description: "Information on accepted payment methods, subscription billing, and refunds." },
  { icon: Heart, title: "Therapy Services", description: "Scope of practice, therapist qualifications, and limitations of digital care." },
  { icon: Laptop, title: "Platform Usage", description: "Acceptable use policy, account security, and technical requirements." },
  { icon: PenLine, title: "Rights & Responsibilities", description: "Your rights as a client and our legal disclaimers and limitations of liability." },
];

const TABS = ["Acceptance of Terms", "Gift Card Terms", "Purchases & Payments", "Redemption Policies", "Therapy Services", "Booking & Cancellations"];

const ACCORDIONS = [
  { title: "Gift Card Terms", icon: Gift, bullets: ["Mindful Therapy Gift Cards are non-refundable and cannot be redeemed for cash, except where required by law.", "Gift Cards do not expire, and we do not assess any inactivity fees.", "We are not responsible if a Gift Card is lost, stolen, destroyed, or used without your permission."] },
  { title: "Purchases & Payments", icon: ShoppingCart, bullets: ["All payments are processed securely through PCI-compliant payment gateways.", "We accept major credit cards (Visa, Mastercard) and bank transfers.", "Prices are listed in Nigerian Naira and include all applicable taxes.", "No processing fees are charged — the price you see is the price you pay."] },
  { title: "Redemption Policies", icon: Settings, bullets: ["Gift cards are redeemed by entering the unique code at checkout or in your account dashboard.", "Redeemed credit can be applied to any therapist session on our network.", "If a session costs less than the gift card balance, remaining credit stays on the account.", "Gift card credit is non-transferable between accounts."] },
  { title: "Therapy Sessions", icon: User, bullets: ["All therapists in our network are licensed, vetted, and carefully selected professionals.", "Sessions are conducted via secure video call and are completely confidential.", "Tare Wellness is a platform facilitating connections — we do not provide medical advice directly.", "Therapists operate independently and are solely responsible for their clinical decisions."] },
  { title: "Booking & Cancellation", icon: CalendarX, bullets: ["Sessions can be rescheduled up to 24 hours before the scheduled start time at no charge.", "Cancellations made less than 24 hours before may result in forfeiture of the session credit.", "Late arrivals of more than 15 minutes may be treated as a no-show.", "A secure video link becomes active 10 minutes before your scheduled session."] },
];

const SUPPORT_CHANNELS = [
  { icon: Scale, title: "Legal", contact: "legal@mindful.com", href: "mailto:legal@mindful.com" },
  { icon: Headset, title: "Support", contact: "help@mindful.com", href: "mailto:help@mindful.com" },
  { icon: Phone, title: "Phone", contact: "1-800-MINDFUL", href: "tel:18006463385" },
];

export default function TermsAndConditionsPage() {
  const [activeTab, setActiveTab] = useState("Acceptance of Terms");
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  if (typeof document !== "undefined") {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    const id = tab === "Acceptance of Terms" ? "acceptance" : "gift-card-specifics";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full overflow-hidden px-5 pb-10 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 md:flex-row md:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-sans text-xs font-semibold text-[#2C292E] shadow-sm backdrop-blur-sm"><Clock className="h-3.5 w-3.5" strokeWidth={2.5} />Last Updated: January 2026</span>
            <h1 className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-[#2C292E] sm:text-5xl lg:text-6xl">Terms Designed with <span className="text-white drop-shadow-sm">Clarity and Transparency</span></h1>
            <p className="mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-[#2C292E]/85 sm:text-[18px]">We believe in clear boundaries and understandable agreements. These terms outline our commitment to you and your responsibilities when using our boutique wellness platform.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative aspect-square w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <div aria-hidden className="absolute inset-6 rounded-full bg-white/30 blur-2xl" />
            <Image src="/hero-terms.png" alt="A whimsical blue creature sitting at a desk reading a legal contract by lamplight" fill priority sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 400px" className="hero-shadow relative animate-float-slow object-contain" />
          </motion.div>
        </div>
      </section>

      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center font-fraunces text-2xl font-extrabold tracking-tight text-[#2C292E] sm:text-3xl lg:text-4xl">Quick Overview</motion.h2>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OVERVIEW_CARDS.map((card) => { const Icon = card.icon; return (
              <motion.div key={card.title} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(44, 41, 46, 0.10)] sm:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush text-[#2C292E]"><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
                <div><h3 className="font-sans text-sm font-bold text-[#2C292E] sm:text-base">{card.title}</h3><p className="mt-1.5 font-sans text-xs leading-relaxed text-[#2C292E]/65">{card.description}</p></div>
              </motion.div>
            ); })}
          </motion.div>
        </div>
      </section>

      <section className="relative w-full px-5 pb-8 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl bg-white p-6 text-center shadow-[0_10px_40px_rgba(44, 41, 46, 0.08)] sm:p-8">
            <h2 className="font-fraunces text-xl font-bold tracking-tight text-[#F10897] sm:text-2xl">Contents</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {TABS.map((tab) => (
                <button key={tab} type="button" onClick={() => handleTabClick(tab)} className={`rounded-full px-3.5 py-2 font-sans text-xs font-semibold transition-all duration-200 sm:text-sm ${activeTab === tab ? "bg-[#2C292E] text-white shadow-sm" : "text-[#2C292E]/60 hover:bg-white/60 hover:text-[#2C292E]"}`}>{tab}</button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="acceptance" className="scroll-mt-32 relative w-full px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl bg-white p-6 shadow-[0_10px_40px_rgba(44, 41, 46, 0.10)] sm:p-8">
            <div className="flex items-center gap-3 border-l-4 border-[#F10897] pl-4"><h3 className="font-fraunces text-xl font-bold text-[#2C292E] sm:text-2xl">Acceptance of Terms</h3></div>
            <div className="mt-4 space-y-4 pl-4">
              <p className="font-sans text-sm leading-relaxed text-[#2C292E]/75 sm:text-base">By accessing this website, purchasing a gift card, or booking a therapy session through Tare Wellness, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our platform or services.</p>
              <p className="font-sans text-sm leading-relaxed text-[#2C292E]/75 sm:text-base">Your acceptance is expressly limited to these terms. The company reserves the right to update, modify, or amend these terms at any time. Continued use of the platform after any changes constitutes acceptance of the revised terms.</p>
              <p className="font-sans text-sm leading-relaxed text-[#2C292E]/75 sm:text-base">These terms apply to all users, including gift card purchasers, recipients, and therapy session attendees. By using our services, you acknowledge that you have read, understood, and agree to be bound by all terms outlined below.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="gift-card-specifics" className="scroll-mt-32 relative w-full px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
        <div className="mx-auto w-full max-w-5xl">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="font-fraunces text-2xl font-extrabold tracking-tight text-[#2C292E] sm:text-3xl">Gift Card Specifics</motion.h2>
          <div className="mt-6 space-y-3">
            {ACCORDIONS.map((item, i) => { const Icon = item.icon; const isOpen = openAccordion === i; return (
              <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.05 }} className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(44, 41, 46, 0.08)]">
                <button type="button" onClick={() => setOpenAccordion(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-[#2C292E]"><Icon className="h-4.5 w-4.5" strokeWidth={2.5} /></span><span className="font-sans text-sm font-bold text-[#2C292E] sm:text-base">{item.title}</span></div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#2C292E] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                      <ul className="px-5 pb-5 pl-[4.5rem] space-y-2.5 sm:px-6 sm:pl-[5rem]">
                        {item.bullets.map((bullet, j) => (<li key={j} className="flex items-start gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F10897]" /><span className="font-sans text-sm leading-relaxed text-[#2C292E]/75">{bullet}</span></li>))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>

      <section className="relative w-full px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="mx-auto w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl bg-[#FFF5EE]/60 p-6 text-center shadow-[0_10px_40px_rgba(44, 41, 46, 0.10)] sm:p-8">
            <h2 className="font-fraunces text-2xl font-extrabold tracking-tight text-[#2C292E] sm:text-3xl">Questions about our terms?</h2>
            <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-[#2C292E]/70 sm:text-base">We are here to help clarify any confusion. Transparency is key to our care model.</p>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SUPPORT_CHANNELS.map((channel) => { const Icon = channel.icon; return (
                <a key={channel.title} href={channel.href} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-[0_4px_20px_rgba(44, 41, 46, 0.06)] transition-transform duration-200 hover:-translate-y-1">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush text-[#2C292E]"><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
                  <h3 className="font-sans text-sm font-bold text-[#2C292E]">{channel.title}</h3><p className="font-sans text-xs font-semibold text-[#F10897]">{channel.contact}</p>
                </a>
              ); })}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
