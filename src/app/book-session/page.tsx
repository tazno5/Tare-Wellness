"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Users2,
  HeartHandshake,
  Clock,
  Sun,
  Sunset,
  Moon,
  Check,
  ArrowRight,
  CalendarCheck,
  Stethoscope,
  Gift,
  HelpCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useStore, type BookingDetails } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const SESSION_TYPES: {
  id: BookingDetails["sessionType"];
  title: string;
  duration: string;
  price: number;
  coverage: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "individual",
    title: "Individual",
    duration: "50 min",
    price: 25000,
    coverage: "1 person",
    icon: <User className="h-5 w-5" strokeWidth={2.5} />,
    description: "One-on-one space with a licensed therapist.",
  },
  {
    id: "couples",
    title: "Couples",
    duration: "60 min",
    price: 30000,
    coverage: "2 people",
    icon: <Users className="h-5 w-5" strokeWidth={2.5} />,
    description: "A guided conversation for two.",
  },
  {
    id: "family",
    title: "Family",
    duration: "75 min",
    price: 40000,
    coverage: "Up to 4",
    icon: <Users2 className="h-5 w-5" strokeWidth={2.5} />,
    description: "For families reshaping how they connect.",
  },
  {
    id: "wellness",
    title: "Wellness",
    duration: "30 min",
    price: 15000,
    coverage: "1 person",
    icon: <HeartHandshake className="h-5 w-5" strokeWidth={2.5} />,
    description: "A shorter reset — breath, mindfulness, or check-in.",
  },
];

const TIME_SLOTS: {
  id: string;
  label: string;
  range: string;
  icon: React.ReactNode;
  times: string[];
}[] = [
  {
    id: "morning",
    label: "Morning",
    range: "9:00 AM – 11:30 AM",
    icon: <Sun className="h-4 w-4" strokeWidth={2.5} />,
    times: ["9:00 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
  },
  {
    id: "afternoon",
    label: "Afternoon",
    range: "12:00 PM – 4:30 PM",
    icon: <Sunset className="h-4 w-4" strokeWidth={2.5} />,
    times: ["12:00 PM", "1:00 PM", "2:30 PM", "3:00 PM", "4:00 PM"],
  },
  {
    id: "evening",
    label: "Evening",
    range: "5:00 PM – 8:30 PM",
    icon: <Moon className="h-4 w-4" strokeWidth={2.5} />,
    times: ["5:00 PM", "6:00 PM", "6:30 PM", "7:00 PM", "8:00 PM"],
  },
];

const FAQS = [
  {
    q: "Can I reschedule my session?",
    a: "Yes — up to 24 hours before your appointment, with no penalty. Just visit your booking confirmation page or reply to your confirmation email.",
  },
  {
    q: "What if I need to cancel?",
    a: "Life happens. You can cancel up to 24 hours in advance and your gift credit returns to your balance, ready to rebook whenever suits you.",
  },
  {
    q: "Are sessions online or in person?",
    a: "Both options are available. After confirming your booking, your therapist will reach out with details and a secure video link if you choose online.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BookSessionPage() {
  const { toast } = useToast();
  const { booking, setBooking, redemption } = useStore();

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    booking.selectedDate ? new Date(booking.selectedDate) : null,
  );
  const [sessionType, setSessionType] = useState<BookingDetails["sessionType"]>(
    booking.sessionType,
  );
  const [selectedTime, setSelectedTime] = useState<string>(booking.selectedTime);

  // Set gradient — render + useEffect
  useMemo(() => {
    if (typeof document === "undefined") return;
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  }, []);
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
    return () => {
      document.body.style.removeProperty("--page-gradient-from");
      document.body.style.removeProperty("--page-gradient-to");
    };
  }, []);

  // On any selection change, write booking details to the store
  useEffect(() => {
    const session = SESSION_TYPES.find((s) => s.id === sessionType)!;
    setBooking({
      sessionType,
      sessionTitle: session.title === "Individual" ? "Individual Therapy" : `${session.title} Session`,
      sessionPrice: session.price,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
      selectedTime,
      therapist: booking.therapist,
    });
  }, [sessionType, selectedDate, selectedTime, setBooking, booking.therapist]);

  // Calendar grid for current view month
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    // Pad trailing to fill a 6-row grid (42 cells)
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isPast = (d: Date) => {
    const cmp = new Date(d);
    cmp.setHours(0, 0, 0, 0);
    return cmp < today;
  };

  const handlePrevMonth = () => {
    // Don't navigate before the current month
    const now = new Date();
    if (
      viewMonth.getFullYear() === now.getFullYear() &&
      viewMonth.getMonth() === now.getMonth()
    ) {
      return;
    }
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Select a date";

  // Time range from selected slot
  const selectedSlot = TIME_SLOTS.find((s) => s.times.includes(selectedTime));
  const timeRange = selectedSlot?.range ?? selectedTime;

  const session = SESSION_TYPES.find((s) => s.id === sessionType)!;
  const giftCardApplied = redemption.redeemed ? redemption.creditBalance : 0;
  const total = Math.max(0, session.price - giftCardApplied);

  const canConfirm = !!selectedDate && !!selectedTime;

  const handleConfirmClick = (e: React.MouseEvent) => {
    if (!canConfirm) {
      e.preventDefault();
      toast({
        title: "Almost there",
        description: "Pick a date and time before confirming.",
      });
    }
  };

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl"
      />

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(61,0,46,0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Book Your Session
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl"
          >
            Let&apos;s find the right session for you!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            Pick a type, choose a time, and we&apos;ll match you with a
            therapist who fits.
          </motion.p>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 aspect-[534/500] w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[320px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-white/30 blur-2xl"
            />
            <Image
              src="/hero-book-session.png"
              alt="A whimsical creature sitting peacefully with a calendar and a glowing star overhead"
              fill
              priority
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 280px, 320px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* ============ BOOKING GRID ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:gap-8">
          {/* LEFT: selections */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            {/* Session type */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                  Session Type
                </h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SESSION_TYPES.map((s) => {
                  const active = sessionType === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSessionType(s.id)}
                      aria-pressed={active}
                      className={`group flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-[#F10897] bg-blush/40 shadow-[0_8px_24px_rgba(241,8,151,0.15)]"
                          : "border-maroon/10 bg-white hover:border-maroon/25"
                      }`}
                    >
                      <div
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          active
                            ? "bg-[#F10897] text-white"
                            : "bg-blush text-maroon"
                        }`}
                      >
                        {s.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-fraunces text-base font-bold text-maroon">
                            {s.title}
                          </h3>
                          {active && (
                            <Check className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />
                          )}
                        </div>
                        <p className="mt-0.5 font-sans text-[11px] text-maroon/70">
                          {s.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-maroon">
                            <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />
                            {s.duration}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#4E0030]/10 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-maroon">
                            {s.coverage}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.article>

            {/* Calendar */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                  Pick a Date
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blush text-maroon transition-all hover:bg-blush-dark active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={
                      viewMonth.getFullYear() === today.getFullYear() &&
                      viewMonth.getMonth() === today.getMonth()
                    }
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <span className="min-w-[130px] text-center font-fraunces text-sm font-bold text-maroon">
                    {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blush text-maroon transition-all hover:bg-blush-dark active:scale-90"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="mt-4">
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-maroon/50"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (!day) {
                      return <div key={`empty-${i}`} className="aspect-square" />;
                    }
                    const past = isPast(day);
                    const selected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={past}
                        onClick={() => setSelectedDate(day)}
                        aria-label={day.toDateString()}
                        aria-pressed={!!selected}
                        className={`relative flex aspect-square items-center justify-center rounded-xl font-sans text-sm font-semibold transition-all ${
                          selected
                            ? "bg-[#F10897] text-white shadow-[0_4px_12px_rgba(241,8,151,0.4)]"
                            : past
                              ? "cursor-not-allowed text-maroon/25"
                              : "text-maroon hover:bg-blush active:scale-95"
                        }`}
                      >
                        {day.getDate()}
                        {isToday && !selected && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#F10897]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-4 inline-flex items-center gap-1.5 font-sans text-[11px] text-maroon/60">
                <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                Selected: <span className="font-bold text-maroon">{formattedDate}</span>
              </p>
            </motion.article>

            {/* Time slots */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                Pick a Time
              </h2>

              <div className="mt-4 space-y-4">
                {TIME_SLOTS.map((slot) => (
                  <div key={slot.id}>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blush text-maroon">
                        {slot.icon}
                      </span>
                      <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon">
                        {slot.label}
                      </span>
                      <span className="font-sans text-[11px] text-maroon/50">
                        {slot.range}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {slot.times.map((t) => {
                        const active = selectedTime === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTime(t)}
                            aria-pressed={active}
                            className={`rounded-full px-3 py-2 font-sans text-xs font-bold transition-all ${
                              active
                                ? "bg-[#4E0030] text-white shadow-[0_4px_12px_rgba(61,0,46,0.25)]"
                                : "bg-blush/60 text-maroon hover:bg-blush active:scale-95"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>

            {/* FAQ */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-maroon" strokeWidth={2.5} />
                <h2 className="font-fraunces text-xl font-bold text-maroon sm:text-2xl">
                  Frequently Asked
                </h2>
              </div>
              <Accordion type="single" collapsible className="mt-3">
                {FAQS.map((faq, i) => (
                  <AccordionItem
                    key={faq.q}
                    value={`item-${i}`}
                    className="border-maroon/10"
                  >
                    <AccordionTrigger className="font-sans text-sm font-bold text-maroon hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-sans text-sm leading-relaxed text-maroon/75">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.article>
          </motion.div>

          {/* RIGHT: Booking Summary — sticky */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.article
              variants={itemUp}
              className="sticky top-28 rounded-3xl bg-[#4E0030] p-5 text-white shadow-[0_14px_40px_rgba(61,0,46,0.30)] sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-blush">
                Booking Summary
              </h2>

              <div className="mt-4 space-y-3 font-sans text-sm">
                <SummaryRow
                  icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Service"
                  value={booking.sessionTitle}
                />
                <SummaryRow
                  icon={<CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Date"
                  value={formattedDate}
                />
                <SummaryRow
                  icon={<Clock className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Time"
                  value={timeRange}
                />
                <SummaryRow
                  icon={<Stethoscope className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Therapist"
                  value={booking.therapist}
                />
              </div>

              <div className="mt-4 space-y-2 border-t border-white/15 pt-4 font-sans text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blush/80">Session Price</span>
                  <span className="font-bold tabular-nums text-white">
                    ₦{session.price.toLocaleString()}
                  </span>
                </div>
                {giftCardApplied > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-blush/80">
                      <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Gift card applied
                    </span>
                    <span className="font-bold tabular-nums text-[#F10897]">
                      -₦{giftCardApplied.toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
                <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-blush/80">
                  Total
                </span>
                <span className="font-fraunces text-2xl font-extrabold text-white">
                  ₦{total.toLocaleString()}
                </span>
              </div>

              {giftCardApplied > 0 ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  Gift card covers full session
                </p>
              ) : (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  <Gift className="h-3 w-3" strokeWidth={2.5} />
                  Redeem a gift card to cover the cost
                </p>
              )}

              <Link
                href="/booking-confirmation"
                onClick={handleConfirmClick}
                className={`group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-sans text-sm font-semibold transition-all duration-200 ${
                  canConfirm
                    ? "bg-[#F10897] text-white shadow-[0_10px_30px_rgba(241,8,151,0.35)] hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
                    : "cursor-not-allowed bg-white/15 text-white/50"
                }`}
                aria-disabled={!canConfirm}
              >
                Confirm Booking
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </Link>

              <p className="mt-3 text-center font-sans text-[11px] text-blush/70">
                No charge until your therapist confirms.
              </p>
            </motion.article>
          </motion.div>
        </div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <p className="font-sans text-sm text-maroon/70">
            Need to redeem a code first?
          </p>
          <Link
            href="/redeem"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blush px-7 py-3.5 font-sans text-sm font-semibold text-maroon shadow-[0_8px_24px_rgba(61,0,46,0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-blush-dark active:scale-95"
          >
            <Gift className="h-4 w-4" strokeWidth={2.5} />
            Redeem a Gift Card
          </Link>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-blush/80">
        {icon}
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]">
          {label}
        </span>
      </span>
      <span className="max-w-[60%] text-right font-bold text-white">
        {value}
      </span>
    </div>
  );
}
