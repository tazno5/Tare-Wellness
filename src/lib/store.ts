import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = { cardId: string; title: string; price: number; sessions: number; gradient: string; qty: number; };
export type RecipientData = { uid: string; cardId: string; name: string; email: string; occasion: string; deliveryMode: "now" | "schedule"; note: string; confirmed: boolean; };
export type BookingDetails = { sessionType: string; sessionTitle: string; sessionPrice: number; selectedDate: string | null; selectedTime: string; therapist: string; };
export type RedemptionState = { code: string; creditBalance: number; redeemed: boolean; };
export type User = { id: string; name: string; email: string; } | null;

type StoreState = {
  cart: CartItem[]; totalQty: number; totalPrice: number;
  recipients: RecipientData[]; redemption: RedemptionState; booking: BookingDetails;
  user: User;
  setCart: (items: CartItem[]) => void; updateQty: (cardId: string, qty: number) => void;
  incrementQty: (cardId: string) => void; decrementQty: (cardId: string) => void; clearCart: () => void;
  setRecipients: (r: RecipientData[]) => void; updateRecipient: (uid: string, patch: Partial<RecipientData>) => void;
  confirmRecipient: (uid: string) => void; deleteRecipient: (uid: string) => void; clearRecipients: () => void;
  setRedemption: (s: RedemptionState) => void; clearRedemption: () => void;
  setBooking: (d: BookingDetails) => void; clearBooking: () => void; resetAll: () => void;
  login: (user: User) => void; logout: () => void;
};

const computeTotals = (cart: CartItem[]) => ({ totalQty: cart.reduce((s, c) => s + c.qty, 0), totalPrice: cart.reduce((s, c) => s + c.price * c.qty, 0) });
const defaultBooking: BookingDetails = { sessionType: "individual", sessionTitle: "Individual Therapy", sessionPrice: 25000, selectedDate: null, selectedTime: "10:30 AM", therapist: "Dr. Sarah Thompson" };
const defaultRedemption: RedemptionState = { code: "", creditBalance: 0, redeemed: false };

export const useStore = create<StoreState>()(persist((set, get) => ({
  cart: [], totalQty: 0, totalPrice: 0, recipients: [], redemption: defaultRedemption, booking: defaultBooking, user: null,
  setCart: (items) => { const t = computeTotals(items); set({ cart: items, ...t }); },
  updateQty: (cardId, qty) => { const cart = get().cart.map(c => c.cardId === cardId ? { ...c, qty: Math.max(0, qty) } : c).filter(c => c.qty > 0); const t = computeTotals(cart); set({ cart, ...t }); },
  incrementQty: (cardId) => { const existing = get().cart.find(c => c.cardId === cardId); if (existing) { const cart = get().cart.map(c => c.cardId === cardId ? { ...c, qty: c.qty + 1 } : c); const t = computeTotals(cart); set({ cart, ...t }); } },
  decrementQty: (cardId) => { const cart = get().cart.map(c => c.cardId === cardId ? { ...c, qty: Math.max(0, c.qty - 1) } : c).filter(c => c.qty > 0); const t = computeTotals(cart); set({ cart, ...t }); },
  clearCart: () => set({ cart: [], totalQty: 0, totalPrice: 0 }),
  setRecipients: (recipients) => set({ recipients }),
  updateRecipient: (uid, patch) => set({ recipients: get().recipients.map(r => r.uid === uid ? { ...r, ...patch } : r) }),
  confirmRecipient: (uid) => set({ recipients: get().recipients.map(r => r.uid === uid ? { ...r, confirmed: true } : r) }),
  deleteRecipient: (uid) => set({ recipients: get().recipients.filter(r => r.uid !== uid) }),
  clearRecipients: () => set({ recipients: [] }),
  setRedemption: (state) => set({ redemption: state }),
  clearRedemption: () => set({ redemption: defaultRedemption }),
  setBooking: (details) => set({ booking: details }),
  clearBooking: () => set({ booking: defaultBooking }),
  resetAll: () => set({ cart: [], totalQty: 0, totalPrice: 0, recipients: [], redemption: defaultRedemption, booking: defaultBooking }),
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}), { name: "tare-wellness-store", partialize: (s) => ({ cart: s.cart, totalQty: s.totalQty, totalPrice: s.totalPrice, recipients: s.recipients, redemption: s.redemption, booking: s.booking, user: s.user }) }));
