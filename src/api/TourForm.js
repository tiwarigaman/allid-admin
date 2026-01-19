// src/api/TourForm.js
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "tourForm"; // root collection name

// --- Small sanitization helpers (same idea as contact.js) ---

function sanitizeText(str = "") {
  return String(str)
    .replace(/<[^>]*>/g, " ") // strip tags like <script>, <b>, etc.
    .replace(/\s+/g, " ") // collapse multiple spaces/newlines
    .trim();
}

function limitLength(str = "", max = 1000) {
  const value = String(str);
  return value.length > max ? value.slice(0, max) : value;
}

// Very light email check (UX only, not security)
function looksLikeEmail(str = "") {
  const value = String(str).trim();
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * USER-SIDE API: store tour enquiry form into Firestore
 *
 * Collection: "tourForm"
 *
 * @param {{
 *   arrivalDate?: string,
 *   days?: string,
 *   adults?: string,
 *   children?: string,
 *   accommodation?: string,
 *   info?: string,
 *   name: string,
 *   email: string,
 *   country?: string,
 *   phone: string
 * }} payload
 */
export async function submitTourForm(payload = {}) {
  const arrivalDate = limitLength(sanitizeText(payload.arrivalDate ?? ""), 50);
  const days = limitLength(sanitizeText(payload.days ?? ""), 20);
  const adults = limitLength(sanitizeText(payload.adults ?? ""), 10);
  const children = limitLength(sanitizeText(payload.children ?? ""), 10);
  const accommodation = limitLength(
    sanitizeText(payload.accommodation ?? ""),
    50
  );
  const info = limitLength(sanitizeText(payload.info ?? ""), 2000);
  const name = limitLength(sanitizeText(payload.name ?? ""), 100);
  const email = limitLength(sanitizeText(payload.email ?? ""), 200);
  const country = limitLength(sanitizeText(payload.country ?? ""), 80);
  const phone = limitLength(sanitizeText(payload.phone ?? ""), 50);

  // basic required fields
  if (!name || !email || !phone) {
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
    arrivalDate,
    days,
    adults,
    children,
    accommodation,
    info,
    country,
    createdAt: serverTimestamp(),
    userAgent: limitLength(userAgent, 300),
    path: limitLength(path, 200),

    // admin helpers
    status: "new",
    followUpDone: false,
    tripCompleted: false,
  };

  const ref = await addDoc(collection(db, COLLECTION), docData);
  return { id: ref.id };
}

/**
 * ADMIN-SIDE API: fetch all tour form enquiries
 * Sorted newest first, with createdAt converted to Date + millis
 */
export async function getAllTourForms() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() || {};
    const createdAt =
      data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate()
        : null;
    const createdAtMillis = createdAt ? createdAt.getTime() : 0;

    return {
      id: d.id,
      ...data,
      createdAt,
      createdAtMillis,
    };
  });
}

/**
 * ADMIN-SIDE API: mark follow-up taken / not taken
 */
export async function setTourFormFollowUp(id, followUpDone) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    followUpDone: !!followUpDone,
    status: !!followUpDone ? "followed" : "new",
    updatedAt: serverTimestamp(),
  });
}

/**
 * ADMIN-SIDE API: mark trip completed / not completed
 */
export async function setTourFormCompleted(id, completed) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    tripCompleted: !!completed,
    status: !!completed ? "completed" : "followed",
    updatedAt: serverTimestamp(),
  });
}
