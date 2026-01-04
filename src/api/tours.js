// src/api/tours.js
import { db, storage } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const TOURS_COLLECTION = "tours";

// ---------- Helpers: slug for SEO ----------

// Slug from *title only*
// "Spiritual Varanasi Journey" -> "spiritual-varanasi-journey"
function slugifyTitle(rawTitle) {
  const title = (rawTitle || "").trim();
  const base = title || "tour";

  let slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> "-"
    .replace(/^-+|-+$/g, ""); // trim "-" from start/end

  // keep it reasonably short
  slug = slug.slice(0, 80);

  return slug || "tour";
}

// Make slug unique in "tours":
// if "spiritual-varanasi-journey" exists -> try "-2", "-3", ...
async function generateUniqueSlug(title) {
  const base = slugifyTitle(title);
  let candidate = base;
  let counter = 2;

  // keep it simple and safe: try up to 20 variants
  for (let i = 0; i < 20; i++) {
    const q = query(
      collection(db, TOURS_COLLECTION),
      where("slug", "==", candidate)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return candidate;
    }

    candidate = `${base}-${counter++}`;
  }

  // worst-case fallback (super unlikely)
  return `${base}-${Date.now()}`;
}

// ---------- Helpers: storage paths & filenames ----------

function sanitizeFileName(name) {
  if (!name) return "image";
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "");
}

/**
 * Upload feature image for a tour.
 * Path: tours/feature/{timestamp}-{filename}
 *
 * NOTE: second arg (titleOrSlug) kept for compatibility, but not used now.
 */
export async function uploadTourFeatureImage(file, _titleOrSlug) {
  if (!file) throw new Error("File is required");

  const safeName = sanitizeFileName(file.name);
  const filePath = `tours/feature/${Date.now()}-${safeName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path: filePath };
}

/**
 * Upload gallery image for a tour.
 * Path: tours/gallery/{timestamp}-{filename}
 *
 * NOTE: extra args kept for compatibility, but not used.
 */
export async function uploadTourGalleryImage(
  file,
  _titleOrSlug,
  _index
) {
  if (!file) throw new Error("File is required");

  const safeName = sanitizeFileName(file.name);
  const filePath = `tours/gallery/${Date.now()}-${safeName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path: filePath };
}

/**
 * Delete any tour image by its download URL.
 * Works for URLs from Firebase Storage. If it's not a storage URL,
 * we just catch error and log.
 */
export async function deleteTourImageByUrl(downloadUrl) {
  if (!downloadUrl) return;
  try {
    // v9: ref(storage, full https URL) works
    const storageRef = ref(storage, downloadUrl);
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Error deleting image from storage", err);
  }
}

// ---------- MAPPING: FORM -> FIRESTORE DOC ----------

// Map the form object coming from the UI into a Firestore tour document
function mapFormToTourDoc(form) {
  const galleryUrls = (form.galleryImages || []).filter(
    (url) => url && url.trim() !== ""
  );

  const imageUrls = [form.featureImageUrl, ...galleryUrls].filter(Boolean);

  return {
    // Required base fields
    title: (form.title || "").trim(),
    description: (form.description || "").trim(),
    price: 0, // extend later if you add pricing

    // Category
    categoryId: (form.categoryId || "").trim(),
    categoryName: (form.categoryName || "").trim(),

    // Images
    imageUrls,
    featureImageUrl: (form.featureImageUrl || "").trim(),
    galleryImageUrls: galleryUrls,

    // Location / meta
    location: (form.location || "").trim(),
    status: form.status || "draft",
    duration: (form.duration || "").trim(),
    maxGroupSize: form.maxGroupSize ? Number(form.maxGroupSize) : null,
    difficultyLevel: form.difficultyLevel || "Easy",
    season: (form.season || "").trim(),
    minAge: form.minAge ? Number(form.minAge) : null,

    // Map embed (iframe or URL string)
    mapEmbedHtml: (form.mapEmbedHtml || "").trim(),

    // ---------- SEO meta ----------
    // metaTitle: if admin filled, use that; otherwise fall back to title
    metaTitle: (form.metaTitle || form.title || "").trim(),
    // metaDescription: if admin filled, else fallback to description
    metaDescription: (form.metaDescription || form.description || "").trim(),
    // metaKeywords: comma-separated keywords
    metaKeywords: (form.metaKeywords || "").trim(),
    // ogImage for social share = feature image
    ogImage: (form.featureImageUrl || "").trim(),

    // Lists
    highlights: (form.highlights || [])
      .map((h) => h.trim())
      .filter(Boolean),
    included: (form.included || [])
      .map((i) => i.trim())
      .filter(Boolean),
    excluded: (form.excluded || [])
      .map((i) => i.trim())
      .filter(Boolean),

    // Itinerary
    itinerary: (form.itinerary || [])
      .filter(
        (d) =>
          d &&
          (d.dayTitle?.trim() !== "" ||
            d.description?.trim() !== "")
      )
      .map((d, idx) => ({
        dayNumber: idx + 1,
        dayTitle: (d.dayTitle || "").trim(),
        description: (d.description || "").trim(),
      })),
  };
}

// ---------- PUBLIC API (FIRESTORE CRUD) ----------

// Get all tours ordered by creation time (newest first)
export async function getTours() {
  const refCol = collection(db, TOURS_COLLECTION);
  const q = query(refCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// Create new tour
export async function createTour(form) {
  const refCol = collection(db, TOURS_COLLECTION);

  const payload = mapFormToTourDoc(form);
  const slug = await generateUniqueSlug(form.title);

  const docRef = await addDoc(refCol, {
    ...payload,
    slug,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

// Update an existing tour
// (we keep existing slug; stable URLs are better for SEO)
export async function updateTour(id, form) {
  const refDoc = doc(db, TOURS_COLLECTION, id);
  const payload = mapFormToTourDoc(form);

  await updateDoc(refDoc, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// Delete tour
export async function deleteTour(id) {
  const refDoc = doc(db, TOURS_COLLECTION, id);
  await deleteDoc(refDoc);
}

// Publish / unpublish (status toggle helper)
export async function setTourStatus(id, status) {
  const refDoc = doc(db, TOURS_COLLECTION, id);
  await updateDoc(refDoc, {
    status,
    updatedAt: serverTimestamp(),
  });
}
