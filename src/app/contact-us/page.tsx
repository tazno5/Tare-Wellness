"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Phone, Send, Check, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOPICS = ["General Inquiry", "Gift Cards", "Therapy Bookings", "Technical Support"];

const SUPPORT_CHANNELS = [
  { icon: Mail, title: "Email Support", primary: "help@mindful.com", secondary: "support@bewelltare.com", description: "We aim to respond within 24 hours.", href: "mailto:help@mindful.com" },
  { icon: MessageCircle, title: "Live Chat", primary: "Available Mon–Fri", secondary: "9am – 6pm EST", description: "Get instant help from our support team.", href: "#", status: "online" as const },
  { icon: Phone, title: "Phone Support", primary: "1-800-MINDFUL", secondary: "Toll-free", description: "For urgent inquiries only.", href: "tel:18006463385" },
];

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (typeof document !== "undefined") {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    setSubmitted(true);
    toast({
      title: "Message sent!",
      description: `We'll respond to ${form.email} within 24 hours.`,
    });
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full overflow-hidden px-5 pb-10 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#B5E1C3]/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 md:flex-row md:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="flex-1 text-center md:text-left">
            <h1 className="font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-[#4E0030] sm:text-5xl lg:text-6xl">We&apos;re Here for You</h1>
            <p className="mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-[#4E0030]/85 sm:text-[18px]">Have a question about gift cards, bookings, or our platform? Our dedicated wellness support team is ready to help. Reach out and we&apos;ll get back to you as soon as possible.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative aspect-[619/491] w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <div aria-hidden className="absolute inset-6 rounded-full bg-[#BCE1F0]/20 blur-2xl" />
            <Image src="/hero-contact.png" alt="Four whimsical creatures sitting together around a cozy campfire" fill priority sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 400px" className="hero-shadow relative animate-float-slow object-contain" />
          </motion.div>
        </div>
      </section>

      <section className="relative w-full px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl bg-white p-6 shadow-[0_15px_50px_rgba(78, 0, 48, 0.12)] sm:p-8">
            <h2 className="font-fraunces text-2xl font-bold text-[#4E0030] sm:text-3xl">Send Us a Message</h2>
            <p className="mt-2 font-sans text-sm text-[#4E0030]/70 sm:text-base">Fill out the form below and we&apos;ll respond within 24 hours.</p>
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-[#FFF5EE] p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F10897] text-white"><Check className="h-7 w-7" strokeWidth={3} /></span>
                <h3 className="font-fraunces text-xl font-bold text-[#4E0030]">Message Sent!</h3>
                <p className="max-w-sm font-sans text-sm text-[#4E0030]/70">Thank you for reaching out, {form.name.split(" ")[0]}. We&apos;ve received your message about &ldquo;{form.topic}&rdquo; and will get back to you at {form.email} within 24 hours.</p>
                <button type="button" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: TOPICS[0], message: "" }); }} className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F10897] px-6 py-3 font-sans text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95">Send Another Message</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div><label htmlFor="name" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">Full Name</label><input id="name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sarah Johnson" className="mt-2 h-12 w-full rounded-2xl border border-maroon/15 bg-white px-4 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30" /></div>
                <div><label htmlFor="email" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">Email Address</label><input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-2xl border border-maroon/15 bg-white px-4 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30" /></div>
                <div><label htmlFor="topic" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">Topic</label><select id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="mt-2 h-12 w-full appearance-none rounded-2xl border border-maroon/15 bg-white px-4 font-sans text-sm text-[#4E0030] focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30">{TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label htmlFor="message" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">Message</label><textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help you today?" className="mt-2 w-full rounded-2xl border border-maroon/15 bg-white px-4 py-3 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30" /></div>
                <button type="submit" disabled={isLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#d4007d] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base">{isLoading ? (<><Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />Sending...</>) : (<><Send className="h-5 w-5" strokeWidth={2.5} />Send Message</>)}</button>
              </form>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-4">
            <h2 className="font-fraunces text-xl font-bold text-[#4E0030] sm:text-2xl">Other Ways to Reach Us</h2>
            {SUPPORT_CHANNELS.map((channel) => { const Icon = channel.icon; return (
              <a key={channel.title} href={channel.href} className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(78, 0, 48, 0.10)] transition-transform duration-200 hover:-translate-y-1 sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush text-[#4E0030]"><Icon className="h-6 w-6" strokeWidth={2.5} /></span>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-sans text-sm font-bold text-[#4E0030]">{channel.title}</h3>{channel.status === "online" && <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /><span className="font-sans text-[9px] font-bold uppercase tracking-wide text-green-700">Online</span></span>}</div>
                  <p className="mt-1 font-sans text-sm font-semibold text-[#F10897]">{channel.primary}</p>
                  {channel.secondary && <p className="font-sans text-xs text-[#4E0030]/60">{channel.secondary}</p>}
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[#4E0030]/65">{channel.description}</p>
                </div>
              </a>
            ); })}
            <div className="rounded-2xl bg-[#4E0030] p-5 text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.20)] sm:p-6">
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} /><h3 className="font-sans text-sm font-bold">Support Hours</h3></div>
              <div className="mt-3 space-y-1.5 font-sans text-xs text-white/80">
                <div className="flex justify-between"><span>Monday – Friday</span><span className="font-semibold text-white">9am – 6pm EST</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="font-semibold text-white">10am – 4pm EST</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="font-semibold text-white/50">Closed</span></div>
              </div>
              <p className="mt-3 border-t border-white/15 pt-3 font-sans text-[11px] text-white/60">Email support is monitored 24/7 — we aim to respond within 24 hours.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
