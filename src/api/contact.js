// src/api/contact.js
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "contactMessages";

/* ================================
   Small sanitization helpers
   (still enforce with Firestore rules!)
================================ */

function sanitizeText(str = "") {
  return String(str)
    .replace(/<[^>]*>/g, " ") // strip tags like <script>, <b>, etc.
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

function limitLength(str = "", max = 1000) {
  const value = String(str);
  return value.length > max ? value.slice(0, max) : value;
}

function looksLikeEmail(str = "") {
  const value = String(str).trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* ================================
   Public: save contact message
================================ */

/**
 * Used by public Contact page
 * @param {{ name: string, email: string, phone?: string, message: string }} payload
 */
export async function sendContactMessage(payload) {
  const rawName = payload?.name ?? "";
  const rawEmail = payload?.email ?? "";
  const rawPhone = payload?.phone ?? "";
  const rawMessage = payload?.message ?? "";

  const name = limitLength(sanitizeText(rawName), 100);
  const email = limitLength(sanitizeText(rawEmail), 200);
  const phone = limitLength(sanitizeText(rawPhone), 50);
  const message = limitLength(sanitizeText(rawMessage), 2000);

  if (!name || !email || !message) {
    throw new Error("Missing required fields.");
  }

  if (!looksLikeEmail(email)) {
    throw new Error("Invalid email address.");
  }

  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : "";
  const path =
    typeof window !== "undefined" ? window.location.pathname : "";

  const docData = {
    name,
    email,
    phone,
    message,
    createdAt: serverTimestamp(),
    userAgent: limitLength(userAgent, 300),
    path: limitLength(path, 200),

    // admin-only flag, default false
    followUpDone: false,
  };

  const ref = await addDoc(collection(db, COLLECTION), docData);
  return { id: ref.id };
}

/* ================================
   Admin: read + update enquiries
================================ */

/**
 * Admin: fetch ALL contact enquiries (sorted by createdAt desc).
 * Pagination (1,2,3 UI) is done in React using this full list.
 */
export async function getAllContactMessages() {
  const baseRef = collection(db, COLLECTION);

  // If some docs don't have createdAt yet, they'll still be returned.
  const q = query(baseRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data() || {};
    const createdAt =
      data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate()
        : null;

    return {
      id: docSnap.id,
      ...data,
      createdAt,
      createdAtMillis: createdAt ? createdAt.getTime() : 0,
      followUpDone:
        data.followUpDone === true ||
        data.followUpDone === "true" ||
        data.followUpDone === 1 ||
        data.followUpDone === "1",
    };
  });
}

/**
 * Admin: set follow-up status for one enquiry
 * @param {string} id  Firestore doc id
 * @param {boolean} followUpDone
 */
export async function setContactFollowUp(id, followUpDone) {
  if (!id) throw new Error("Missing contact message id.");
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    followUpDone: !!followUpDone,
  });
}
