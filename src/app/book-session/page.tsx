"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  Gift,
  X,
  HelpCircle,
  Loader2,
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
    title: "One-on-One",
    duration: "50 min",
    price: 20000,
    coverage: "1 person",
    icon: <User className="h-5 w-5" strokeWidth={2.5} />,
    description: "Just you and someone who listens.",
  },
  {
    id: "couples",
    title: "Together",
    duration: "60 min",
    price: 30000,
    coverage: "2 people",
    icon: <Users className="h-5 w-5" strokeWidth={2.5} />,
    description: "For two. Side by side.",
  },
  {
    id: "family",
    title: "Family Circle",
    duration: "75 min",
    price: 40000,
    coverage: "Up to 4",
    icon: <Users2 className="h-5 w-5" strokeWidth={2.5} />,
    description: "The whole house, one honest talk.",
  },
  {
    id: "wellness",
    title: "Quick Check-In",
    duration: "30 min",
    price: 15000,
    coverage: "1 person",
    icon: <HeartHandshake className="h-5 w-5" strokeWidth={2.5} />,
    description: "A short reset.",
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
    a: "Both options are available. After confirming your booking, your wellness specialist will reach out with details and a secure video link if you choose online.",
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

export default function BookSessionPageWrapper() {
  return (
    <Suspense fallback={
      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#F10897]" strokeWidth={2.5} />
      </main>
    }>
      <BookSessionPage />
    </Suspense>
  );
}

function BookSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { booking, setBooking, user } = useStore();

  // ============ GIFT CARDS — server-side source of truth ============
  // Client requirement: users can ONLY book sessions against a gift card.
  // Direct session purchase is disabled. We fetch the user's gift cards
  // (with sessionsRemaining > 0) from /api/redemptions and let the user
  // pick which one to book against. If they have no gift cards, we gate
  // the entire booking flow and show a CTA to buy or redeem one.
  //
  // The math is UNIVERSAL across all gift card tiers — the same UI + API
  // logic works for 1-session, 2-session, 3-session, or any future tier:
  //   sessionsRemaining comes straight from the DB (set when admin confirms payment)
  //   each booking decrements sessionsRemaining by 1 (handled in /api/bookings)
  //   the Session Ledger below shows Available / This Booking / Remaining dynamically.
  type GiftCard = {
    id: string;
    code: string;
    cardTitle: string;
    cardSessions: number;
    creditAmount: number;
    sessionsRemaining: number;
    sessionsUsed: number;
  };
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [giftCardsLoading, setGiftCardsLoading] = useState(true);
  const [selectedGiftCardId, setSelectedGiftCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setGiftCardsLoading(true);
    fetch("/api/redemptions")
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((data) => {
        const cards: GiftCard[] = data.cards ?? [];
        setGiftCards(cards);
        // Auto-select the first available card so the user doesn't have to
        setSelectedGiftCardId((prev) => prev ?? cards[0]?.id ?? null);
      })
      .catch(() => setGiftCards([]))
      .finally(() => setGiftCardsLoading(false));
  }, [user]);

  const selectedGiftCard = giftCards.find((g) => g.id === selectedGiftCardId) ?? null;

  // Auto-select gift card from ?code= URL param (from the "Book Next Session"
  // button on /account). If the user clicks that button with a specific card,
  // we land here with ?code=XXXX-XXXX-XXXX-XXXX and auto-select the matching
  // card from the fetched list. We DON'T call /api/redeem because the card is
  // already attached to the user's account (it came from /api/redemptions).
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (!codeParam || giftCards.length === 0) return;
    const normalized = codeParam.replace(/-/g, "").toUpperCase();
    const match = giftCards.find(
      (c) => c.code.replace(/-/g, "").toUpperCase() === normalized,
    );
    if (match) {
      setSelectedGiftCardId(match.id);
      toast({
        title: "Gift card selected",
        description: `${match.cardTitle} · ${match.sessionsRemaining} session${match.sessionsRemaining === 1 ? "" : "s"} remaining.`,
      });
    }
  }, [searchParams, giftCards]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Fetch counselor schedule from admin settings (configurable via /admin → Settings)
  const [counselorSchedule, setCounselorSchedule] = useState<Record<string, string[]>>({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
  });

  useEffect(() => {
    fetch("/api/settings/bank-details")
      .then((r) => r.json())
      .then((data) => {
        if (data.counselorSchedule) {
          setCounselorSchedule(data.counselorSchedule);
        }
      })
      .catch(() => {});
  }, []);

  // ============ MONTH-LEVEL PRE-FETCH OF BOOKED SLOTS ============
  // Instead of fetching booked times one-date-at-a-time when the user
  // clicks a date (which caused a flash of "all available" before the
  // fetch completed), we pre-fetch the ENTIRE visible month's booked
  // times when the calendar month changes. This gives us the data
  // BEFORE the user clicks any date, so:
  //   1. The calendar can show fully-booked dates as disabled/struck-
  //      through at face value (before the user clicks them).
  //   2. When the user clicks a date, the time slots immediately show
  //      the correct strikethroughs (no flash — the data is already
  //      in memory from the month pre-fetch).
  //
  // The API returns { monthBookedTimes: { "YYYY-MM-DD": string[] } } —
  // a map of date→bookedTimes for every day in the month that has at
  // least one booking. Days with zero bookings are omitted (smaller
  // response).
  const [monthBookedTimes, setMonthBookedTimes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!user) return;
    const yyyy = viewMonth.getFullYear();
    const mm = String(viewMonth.getMonth() + 1).padStart(2, "0");
    const monthParam = `${yyyy}-${mm}`;

    fetch(`/api/bookings/slots?month=${monthParam}`)
      .then((r) => (r.ok ? r.json() : { monthBookedTimes: {} }))
      .then((data) =>
        setMonthBookedTimes(
          data.monthBookedTimes && typeof data.monthBookedTimes === "object"
            ? data.monthBookedTimes
            : {},
        ),
      )
      .catch(() => setMonthBookedTimes({}));
  }, [viewMonth, user]);

  // Get the day name for the selected date
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const selectedDayName = selectedDate ? DAY_NAMES[selectedDate.getDay()] : null;
  const availableSlots = selectedDayName ? (counselorSchedule[selectedDayName] || []) : [];

  // Helper: format a Date as "YYYY-MM-DD" (local timezone, matches the
  // key format used in the monthBookedTimes map from the API).
  const formatDateKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: is a given time slot already booked on the SELECTED date?
  // Uses the month pre-fetch data — no separate per-date fetch needed.
  const bookedTimesForSelected = selectedDate
    ? monthBookedTimes[formatDateKey(selectedDate)] ?? []
    : [];
  const isTimeSlotBooked = (time: string) => bookedTimesForSelected.includes(time);

  // Helper: is a given calendar date FULLY BOOKED?
  // True when ALL available time slots for that day (from the counselor
  // schedule) are in the bookedTimes for that date. Used to visually
  // disable the date in the calendar BEFORE the user clicks it.
  const isDateFullyBooked = (d: Date): boolean => {
    const dayName = DAY_NAMES[d.getDay()];
    const daySlots = counselorSchedule[dayName] ?? [];
    if (daySlots.length === 0) return false; // no schedule for this day = not "fully booked", just unavailable
    const booked = monthBookedTimes[formatDateKey(d)] ?? [];
    // Fully booked when every available slot is in the booked list
    return daySlots.every((slot) => booked.includes(slot));
  };

  // Set gradient — render + useEffect
  useMemo(() => {
    if (typeof document === "undefined") return;
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
    return () => {
      document.body.style.removeProperty("--page-gradient-from");
      document.body.style.removeProperty("--page-gradient-to");
    };
  }, []);

  // Auth gate: hard-redirect logged-out users to /login with a callbackUrl
  // so they return here after signing in. The inline fallback UI below still
  // renders during the brief redirect window for users with slow JS or
  // reduced-motion preferences.
  useEffect(() => {
    if (!user) {
      router.replace("/login?callbackUrl=/book-session");
    }
  }, [user, router]);

  // On any selection change, write booking details to the store
  useEffect(() => {
    const session = SESSION_TYPES.find((s) => s.id === sessionType)!;
    setBooking({
      sessionType,
      sessionTitle: session.title,
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

  // Time display: show selected time, or 'Select a time' if none chosen
  const formattedTime = selectedTime || "Select a time";

  const session = SESSION_TYPES.find((s) => s.id === sessionType)!;
  // ============ AUTHORITATIVE SESSION-BALANCE MATH ============
  // Use BOTH `sessionsRemaining` AND the derived `cardSessions - sessionsUsed`
  // as a defensive cross-check. They should always agree, but in cases where
  // the gift cards list hasn't been refetched yet (e.g. user navigated back to
  // /book-session after booking the final session on a card, browser served
  // a cached state, etc.), one source might lag the other. By computing both
  // AND using the MINIMUM, we ensure the UI never shows more available
  // sessions than actually exist.
  //
  //   availableBalance = min(sessionsRemaining, cardSessions - sessionsUsed)
  //
  // Examples (verifies universal behavior across all tiers):
  //   1-session card, fresh:        available=1
  //   1-session card, fully used:   available=0 (sessionsRemaining=0 OR used=1=total)
  //   2-session card, 1 used:       available=1 (sessionsRemaining=1, 2-1=1)
  //   2-session card, 2 used:       available=0 (sessionsRemaining=0, 2-2=0)
  //   3-session card, 2 used:       available=1 (sessionsRemaining=1, 3-2=1)
  //
  // `isFullyRedeemed` is true when this card has zero sessions left to book
  // against — used to gate the Confirm button + render the "Gift Card Fully
  // Redeemed" warning in the summary card.
  const selectedCardSessionsRemaining = selectedGiftCard?.sessionsRemaining ?? 0;
  const selectedCardSessionsUsed = selectedGiftCard?.sessionsUsed ?? 0;
  const selectedCardTotal = selectedGiftCard?.cardSessions ?? 0;
  const derivedAvailable = Math.max(0, selectedCardTotal - selectedCardSessionsUsed);
  const availableBalance = Math.max(
    0,
    Math.min(selectedCardSessionsRemaining, derivedAvailable),
  );
  const isFullyRedeemed =
    !!selectedGiftCard && availableBalance <= 0;
  // Total displayed to the user is "Covered by gift card" when sessions are
  // still available, otherwise the full ₦ price (so they know they need to
  // buy another card).
  const total = availableBalance > 0 ? 0 : session.price;

  const [confirming, setConfirming] = useState(false);

  // A booking requires: a date, a time, AND a gift card with at least
  // 1 session remaining. No gift card → no booking (client requirement).
  // This gate is universal — works for all gift card tiers because we only
  // require `availableBalance > 0`, not a specific tier threshold.
  // `isFullyRedeemed` is a redundant defensive check that catches the edge
  // case where `sessionsRemaining` says >0 but `cardSessions - sessionsUsed`
  // says 0 (or vice versa) — the UI must NOT let the user submit in that
  // state because the backend will reject it.
  const canConfirm =
    !!selectedDate &&
    !!selectedTime &&
    !!selectedGiftCard &&
    availableBalance > 0 &&
    !isFullyRedeemed &&
    // Block confirm if the user's selected time slot was already booked
    // (e.g. another user grabbed it between when this user picked it and
    // when they clicked Confirm). The backend would reject this anyway
    // with a "therapist conflict" 409, but this defensive check surfaces
    // the issue earlier + prevents the wasted API round-trip.
    !isTimeSlotBooked(selectedTime);

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Defensive guard — should never fire because the button is disabled,
    // but if a user manages to click while ineligible we give a clear message.
    if (!canConfirm) {
      if (!selectedGiftCard) {
        toast({
          title: "Gift card required",
          description: "You need a gift card to book a session. Buy one or redeem a code first.",
          variant: "destructive",
        });
        return;
      }
      if (isFullyRedeemed || availableBalance <= 0) {
        toast({
          title: "Gift card fully redeemed",
          description: `This gift card has no sessions left. Total: ${selectedCardTotal}, Used: ${selectedCardSessionsUsed}. Buy another card to book more sessions.`,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Almost there",
        description: "Pick a date and time before confirming.",
      });
      return;
    }
    setConfirming(true);
    toast({
      title: "Booking your session...",
      description: "Securing your appointment — this won't take a moment.",
    });

    // Store the booking details for the confirmation page (always do this so the page works)
    setBooking({
      sessionType,
      sessionTitle: session.title,
      sessionPrice: session.price,
      selectedDate: selectedDate.toISOString(),
      selectedTime,
      therapist: "Your Provider",
    });

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          sessionTitle: session.title,
          sessionPrice: session.price,
          scheduledDate: selectedDate.toISOString(),
          scheduledTime: selectedTime,
          therapistName: "Your Provider",
          // Send the SERVER-VALIDATED gift card code (not the store's),
          // so the booking API can verify it belongs to the user and
          // decrement sessionsRemaining atomically.
          redemptionCode: selectedGiftCard?.code,
        }),
      });

      if (!res.ok) {
        // API returned an error — surface it to the user
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Booking failed. Please try again.");
      }

      const bookingResponse = await res.json().catch(() => null);

      toast({
        title: "Booking confirmed!",
        description: `Your session is booked for ${selectedDate.toLocaleDateString()}.`,
      });

      // ============ OPTIMISTIC LOCAL STATE UPDATE ============
      // The backend has decremented sessionsRemaining + incremented sessionsUsed.
      // The next page load will refetch /api/redemptions and get the fresh values,
      // but if the user hits browser-back to /book-session before the refetch runs,
      // they would see STALE data (old sessionsRemaining) and could try to book
      // again — which the backend would reject with "No sessions remaining".
      //
      // To prevent that scenario, we OPTIMISTICALLY update the gift cards list
      // in local state right now. The selected card's sessionsRemaining drops by 1
      // and sessionsUsed goes up by 1 — matching what the backend just did. If
      // the user navigates back, the UI already reflects the new balance.
      if (selectedGiftCard) {
        setGiftCards((prev) =>
          prev.map((c) =>
            c.id === selectedGiftCard.id
              ? {
                  ...c,
                  sessionsRemaining: Math.max(0, c.sessionsRemaining - 1),
                  sessionsUsed: c.sessionsUsed + 1,
                }
              : c,
          ),
        );
      }

      // Persist the booking number returned by the API so the confirmation
      // page can display the real BK-2026-XXXXXXXX instead of a hardcoded value.
      if (bookingResponse?.bookingNumber) {
        setBooking({
          sessionType,
          sessionTitle: session.title,
          sessionPrice: session.price,
          selectedDate: selectedDate.toISOString(),
          selectedTime,
          therapist: "Your Provider",
          bookingNumber: bookingResponse.bookingNumber,
        });
      }

      router.push("/booking-confirmation");
    } catch (error) {
      // Show the error — do NOT silently navigate to confirmation
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#C7B2E2]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl"
      />

      {/* ============ AUTH GATE ============ */}
      {!user ? (
        <section className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(78,0,48,0.10)]">
            <HeartHandshake className="h-6 w-6 text-[#F10897]" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 font-fraunces text-2xl font-bold text-[#4E0030]">
            Sign in to book your session
          </h2>
          <p className="mt-2 max-w-sm font-sans text-sm text-[#4E0030]/70">
            You&apos;ll need an account to book a session. It only takes a moment.
          </p>
          <Link
            href="/login?callbackUrl=/book-session"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78,0,48,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
          >
            <User className="h-4 w-4" strokeWidth={2.5} />
            Sign In / Sign Up
          </Link>
        </section>
      ) : (
      <>

      {/* ============ GIFT-CARD GATE ============ */}
      {/* Client requirement: bookings must be backed by a gift card. If the
          user has no gift cards with sessionsRemaining > 0, gate the entire
          booking flow and offer to buy or redeem a code. This gate is
          universal — works regardless of how many sessions the user's card
          has (1, 2, 3, or any future tier), because we just need at least
          one session available to allow booking. */}
      {!giftCardsLoading && giftCards.length === 0 ? (
        <section className="relative flex flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:py-20">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(78,0,48,0.10)]">
            <Gift className="h-6 w-6 text-[#F10897]" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 font-fraunces text-2xl font-bold text-[#4E0030]">
            You need a gift card to book a session
          </h2>
          <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-[#4E0030]/75">
            Sessions are booked with gift card credit. Buy a gift card for
            yourself (or someone you love) and the sessions unlock automatically
            once payment is confirmed.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/gift-cards"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78,0,48,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
            >
              <Gift className="h-4 w-4" strokeWidth={2.5} />
              Buy a Gift Card
            </Link>
            <Link
              href="/redeem"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-[#F10897] shadow-[0_8px_24px_rgba(78,0,48,0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#E8B6D5]/15 active:scale-95"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              Redeem a Code
            </Link>
          </div>
          <p className="mt-5 max-w-sm font-sans text-[12px] text-[#4E0030]/55">
            Already bought one? If you paid by bank transfer, your sessions
            unlock the moment your payment is confirmed.
          </p>
        </section>
      ) : (
      <>

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]"
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
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-5xl lg:text-6xl"
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
            professional who fits.
          </motion.p>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 aspect-[534/500] w-full max-w-[336px] bg-transparent sm:max-w-[392px] lg:max-w-[448px]"
          >
          <Image
              src="/hero-book-session.png"
              alt="A whimsical creature sitting peacefully with a calendar and a glowing star overhead"
              fill
              priority
              sizes="(max-width: 640px) 84vw, (max-width: 1024px) 392px, 448px"
              className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
            />
          </motion.div>
        </div>
      </section>

      {/* ============ BOOKING GRID ============ */}
      <section id="booking-form" className="relative w-full scroll-mt-28 px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:gap-8">
          {/* LEFT: selections */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            {/* ============ GIFT CARD SELECTOR ============ */}
            {/* Client requirement: every booking is backed by a gift card.
                The user picks which of their gift cards to book against.
                The selector is universal — it works for 1-session, 2-session,
                3-session, or any future tier, because the card data comes
                straight from the DB (sessionsRemaining, sessionsUsed, etc.). */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                  Your Gift Card
                </h2>
                {selectedGiftCard && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] ${
                      isFullyRedeemed
                        ? "bg-[#F10897]/15 text-[#F10897] ring-1 ring-[#F10897]/40"
                        : "bg-blush text-[#F10897]"
                    }`}
                  >
                    {isFullyRedeemed ? (
                      <Gift className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {availableBalance} session{availableBalance === 1 ? "" : "s"} left
                  </span>
                )}
              </div>

              {giftCardsLoading ? (
                <div className="mt-4 flex items-center gap-2 text-maroon/60">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  <span className="font-sans text-sm">Loading your gift cards…</span>
                </div>
              ) : giftCards.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-maroon/15 bg-blush/30 p-4 text-center">
                  <p className="font-sans text-sm text-maroon/80">
                    No active gift card found.
                  </p>
                  <Link
                    href="/gift-cards"
                    className="mt-2 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#F10897] hover:underline"
                  >
                    Buy a gift card
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {giftCards.map((card) => {
                    const active = selectedGiftCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedGiftCardId(card.id)}
                        aria-pressed={active}
                        className={`group flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all duration-200 ${
                          active
                            ? "border-[#F10897] bg-blush/40 shadow-[0_8px_24px_rgba(241,8,151,0.15)]"
                            : "border-maroon/10 bg-white hover:border-maroon/25"
                        }`}
                      >
                        <div
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            active ? "bg-[#F10897] text-white" : "bg-blush text-[#F10897]"
                          }`}
                        >
                          <Gift className="h-4 w-4" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-fraunces text-sm font-bold text-maroon">
                              {card.cardTitle}
                            </h3>
                            {active && (
                              <Check className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />
                            )}
                          </div>
                          <p className="mt-0.5 font-sans text-[11px] text-maroon/65">
                            Code: <span className="font-mono">{card.code}</span>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {(() => {
                              // Per-card authoritative balance — same defensive
                              // cross-check as the summary card. We use min()
                              // of both sources so the UI never shows more
                              // available sessions than actually exist.
                              const cardAvail = Math.max(
                                0,
                                Math.min(
                                  card.sessionsRemaining,
                                  (card.cardSessions ?? 0) - card.sessionsUsed,
                                ),
                              );
                              const cardExhausted =
                                cardAvail <= 0 && card.sessionsUsed > 0;
                              return (
                                <>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] ${
                                      cardExhausted
                                        ? "bg-[#4E0030]/10 text-[#4E0030]/60 ring-1 ring-[#4E0030]/15"
                                        : "bg-blush text-[#F10897]"
                                    }`}
                                  >
                                    {cardExhausted ? "Fully redeemed" : `${cardAvail} left`}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-[#4E0030]/10 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-maroon">
                                    {card.sessionsUsed} used
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.article>

            {/* Session type */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
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
                            : "bg-blush text-[#F10897]"
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-[#F10897]">
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
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#F10897] shadow-sm transition-all hover:bg-[#E8B6D5]/15 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#F10897] shadow-sm transition-all hover:bg-[#E8B6D5]/15 active:scale-90"
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
                    // Check if this date is fully booked (all available
                    // slots taken). Uses the month pre-fetch data so the
                    // calendar shows it at face value — BEFORE the user
                    // clicks. Also check if the counselor has NO schedule
                    // for this day (dayName has empty slots) — that means
                    // the day is unavailable (not "fully booked" per se,
                    // but the user still can't book on it).
                    const dayName = DAY_NAMES[day.getDay()];
                    const dayHasSchedule = (counselorSchedule[dayName] ?? []).length > 0;
                    const fullyBooked = !past && dayHasSchedule && isDateFullyBooked(day);
                    const noSchedule = !past && !dayHasSchedule;
                    // Any date that's in the past, fully booked, or has no
                    // counselor schedule at all is treated as "unavailable"
                    // and gets the muted + non-interactive Tailwind spec
                    // from the user request:
                    //   opacity-30 text-gray-400 cursor-not-allowed
                    //   pointer-events-none hover:bg-transparent
                    // The native `disabled` attribute is set so the button
                    // can't be focused or clicked.
                    const isDisabled = past || fullyBooked || noSchedule;
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedDate(day)}
                        aria-label={day.toDateString()}
                        aria-pressed={!!selected}
                        title={
                          fullyBooked
                            ? "Fully booked — no available times"
                            : noSchedule
                              ? "No sessions available on this day"
                              : past
                                ? "Past date"
                                : undefined
                        }
                        className={`relative flex aspect-square items-center justify-center rounded-xl font-sans text-sm font-semibold transition-all ${
                          selected
                            ? "bg-[#F10897] text-white shadow-[0_4px_12px_rgba(241,8,151,0.4)]"
                            : isDisabled
                              ? "opacity-30 text-gray-400 cursor-not-allowed pointer-events-none hover:bg-transparent"
                              : "text-maroon hover:bg-blush active:scale-95"
                        }`}
                      >
                        {day.getDate()}
                        {isToday && !selected && !isDisabled && (
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
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                Pick a Time
              </h2>

              <div className="mt-4 space-y-4">
                {!selectedDate ? (
                  <p className="font-sans text-sm text-maroon/60 py-4 text-center">
                    Pick a date above to see available time slots.
                  </p>
                ) : availableSlots.length === 0 ? (
                  <div className="rounded-2xl bg-[#FFE0C2]/30 p-4 text-center">
                    <p className="font-sans text-sm font-bold text-[#cc6600]">
                      No sessions available on this day
                    </p>
                    <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
                      The counselor is not available on {selectedDayName}s. Please pick a different date.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blush text-[#F10897]">
                        <Clock className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                      <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon">
                        Available Times ({selectedDayName})
                      </span>
                    </div>
                    {/* ============ INDUSTRY-STANDARD OMISSION METHOD ============
                        Instead of rendering booked slots with disabled
                        styling, we FILTER the counselor's schedule array
                        BEFORE rendering. Booked time slots are completely
                        removed from the UI — the user only sees the slots
                        that are actually available to book.

                        Why omission (not disabled):
                          - Industry standard for booking UIs (Calendly,
                            Cal.com, OpenTable all omit, not disable).
                          - Reduces cognitive load — the user doesn't have
                            to mentally filter out struck-through options.
                          - Prevents the "all slots are taken" gut-punch
                            where the time picker is full of disabled slots
                            with no clear path forward.

                        Implementation: compute `openSlots` by filtering
                        `availableSlots` against `bookedTimesForSelected`
                        (the pre-fetched booked times for the selected date).
                        If `openSlots` is empty, render the empty-state
                        fallback message instead of an empty container. */}
                    {(() => {
                      const openSlots = availableSlots.filter(
                        (t) => !isTimeSlotBooked(t),
                      );
                      if (openSlots.length === 0) {
                        return (
                          <p className="mt-4 rounded-2xl bg-[#FFE0C2]/30 p-4 text-center font-sans text-sm text-maroon/60">
                            No available times for this date. Please select another.
                          </p>
                        );
                      }
                      return (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {openSlots.map((t) => {
                            const active = selectedTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTime(t)}
                                aria-pressed={active}
                                className={`rounded-full px-3 py-2 font-sans text-xs font-bold transition-all ${
                                  active
                                    ? "bg-[#4E0030] text-white shadow-[0_4px_12px_rgba(78, 0, 48, 0.25)]"
                                    : "bg-blush/60 text-maroon hover:bg-blush active:scale-95"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.article>

            {/* FAQ */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
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
              className="sticky top-28 rounded-3xl bg-[#4E0030] p-5 text-white shadow-[0_14px_40px_rgba(78, 0, 48, 0.30)] sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-blush">
                Booking Summary
              </h2>

              <div className="mt-4 space-y-3 font-sans text-sm">
                <SummaryRow
                  icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Service"
                  value={session.title}
                />
                <SummaryRow
                  icon={<CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Date"
                  value={formattedDate}
                />
                <SummaryRow
                  icon={<Clock className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Time"
                  value={formattedTime}
                />
                <SummaryRow
                  icon={<HeartHandshake className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  label="Your Provider"
                  value="[chosen by you]"
                />
              </div>

              <div className="mt-4 space-y-2 border-t border-white/15 pt-4 font-sans text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blush/80">Session Price</span>
                  <span className="font-bold tabular-nums text-white">
                    ₦{session.price.toLocaleString()}
                  </span>
                </div>
                {selectedGiftCard ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-blush/80">
                      <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {selectedGiftCard.cardTitle}
                    </span>
                    <span className="font-bold tabular-nums text-[#F10897]">
                      1 session used
                    </span>
                  </div>
                ) : null}
              </div>

              {/* ============ SESSION LEDGER ============ */}
              {/* Universal 3-column ledger that works for ALL gift card tiers
                  (1-session, 2-session, 3-session, or any future tier).
                  Math is dynamic — derived from the AUTHORITATIVE `availableBalance`
                  computed at the top of this component:
                    availableBalance = min(sessionsRemaining, cardSessions - sessionsUsed)
                  Both sources are checked defensively so the UI never shows more
                  available sessions than actually exist (prevents stale-state
                  over-booking that the backend would reject).
                    Available   = availableBalance (authoritative)
                    This Booking = 1 (always 1 session per booking)
                    Remaining   = max(0, availableBalance - 1)
                  Examples:
                    1-session card, fresh:       Available 1 | This 1 | Remaining 0
                    1-session card, fully used: Available 0 | This 1 | Remaining 0
                    2-session card, 1 used:     Available 1 | This 1 | Remaining 0
                    2-session card, 2 used:     Available 0 | This 1 | Remaining 0
                    3-session card, 2 used:     Available 1 | This 1 | Remaining 0
              */}
              {selectedGiftCard && (
                <div
                  className={`mt-4 rounded-2xl p-4 ring-1 transition-colors ${
                    isFullyRedeemed
                      ? "bg-[#F10897]/10 ring-[#F10897]/40"
                      : "bg-white/5 ring-white/10"
                  }`}
                >
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-blush/70">
                    Session Ledger
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div
                      className={`rounded-xl px-2 py-3 transition-colors ${
                        isFullyRedeemed ? "bg-[#F10897]/15" : "bg-white/10"
                      }`}
                    >
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-blush/60">
                        Available
                      </p>
                      <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-white">
                        {availableBalance}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F10897]/20 px-2 py-3">
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#F10897]">
                        This Booking
                      </p>
                      <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-white">
                        1
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-2 py-3">
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-blush/60">
                        Remaining
                      </p>
                      <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-white">
                        {Math.max(0, availableBalance - 1)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-center font-sans text-[10px] text-blush/60">
                    {selectedGiftCard.cardTitle} · Code{" "}
                    <span className="font-mono">{selectedGiftCard.code}</span>
                  </p>
                </div>
              )}

              {/* "Gift Card Fully Redeemed" warning block — replaces the
                  "Covered by gift card" message when the selected card has
                  0 sessions left. Bold + high-contrast so the user immediately
                  understands they cannot proceed with this card. */}
              {isFullyRedeemed && selectedGiftCard && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border-2 border-[#F10897]/60 bg-[#F10897]/15 p-4 text-center"
                >
                  <p className="inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#F10897]">
                    <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Gift Card Fully Redeemed
                  </p>
                  <p className="mt-1.5 font-sans text-[11px] text-white/85">
                    You&apos;ve used all {selectedCardTotal} session{selectedCardTotal === 1 ? "" : "s"} on this card
                    ({selectedCardSessionsUsed} of {selectedCardTotal} redeemed).
                    Buy another gift card to book more sessions.
                  </p>
                  <Link
                    href="/gift-cards"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F10897] px-4 py-2 font-sans text-xs font-semibold text-white transition-all hover:bg-[#d4007d] active:scale-95"
                  >
                    <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Buy Another Gift Card
                  </Link>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
                <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-blush/80">
                  Total
                </span>
                <span className="font-fraunces text-2xl font-extrabold text-white">
                  {isFullyRedeemed
                    ? `₦${session.price.toLocaleString()}`
                    : total === 0
                      ? "Covered by gift card"
                      : `₦${total.toLocaleString()}`}
                </span>
              </div>

              {/* Status pill — only show the "covers full session" checkmark
                  when the card is NOT fully redeemed. When fully redeemed,
                  the warning block above replaces this. */}
              {selectedGiftCard && !isFullyRedeemed ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  Gift card covers full session
                </p>
              ) : !selectedGiftCard ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  <Gift className="h-3 w-3" strokeWidth={2.5} />
                  Select a gift card to continue
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={!canConfirm || confirming}
                aria-disabled={!canConfirm || confirming}
                className={`group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-sans text-sm font-semibold transition-all duration-200 ${
                  confirming
                    ? "cursor-wait bg-white/15 text-white/50"
                    : canConfirm
                      ? "bg-[#F10897] text-white shadow-[0_10px_30px_rgba(241,8,151,0.35)] hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
                      : isFullyRedeemed
                        ? "cursor-not-allowed bg-white/10 text-white/40 ring-1 ring-white/15 opacity-60"
                        : "cursor-not-allowed bg-white/25 text-white/90 border border-white/40 hover:bg-white/35 opacity-70"
                }`}
              >
                {confirming ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Booking...</>
                ) : isFullyRedeemed ? (
                  <><Gift className="h-4 w-4" strokeWidth={2.5} />Card Fully Redeemed</>
                ) : (
                  <>Confirm My Session<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} /></>
                )}
              </button>

              {!canConfirm && !confirming && (
                <p className="mt-2 text-center font-sans text-[11px] text-blush/80">
                  {!selectedGiftCard
                    ? "Select a gift card to continue"
                    : isFullyRedeemed
                      ? "This card is fully redeemed — buy another to continue"
                      : "Pick a date and time to confirm"}
                </p>
              )}

              <p className="mt-3 text-center font-sans text-[11px] text-blush/70">
                Plans change. Reschedule up to 24 hours before, free.
              </p>
            </motion.article>
          </motion.div>
        </div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <p className="font-sans text-sm text-maroon/70">
            Ready to schedule or need another gift card?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/gift-cards"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F10897] px-6 py-3 font-sans text-sm font-semibold text-white shadow-[0_8px_24px_rgba(78,0,48,0.18)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
            >
              <Gift className="h-4 w-4" strokeWidth={2.5} />
              Buy a Gift Card
            </Link>
            <Link
              href="#booking-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-6 py-3 font-sans text-sm font-semibold text-[#F10897] shadow-[0_8px_24px_rgba(78, 0, 48, 0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#E8B6D5]/15 active:scale-95"
            >
              <CalendarCheck className="h-4 w-4" strokeWidth={2.5} />
              Book Next Session
            </Link>
          </div>
        </div>
      </section>
      </>
      )}
      </>
      )}
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
