// src/api/categories.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const COLLECTION = "categories";
const storage = getStorage();

/* =======================================
   🔹 SLUG HELPERS
   ======================================= */

// "North India Pilgrimage" -> "north-india-pilgrimage"
function slugifyCategoryName(rawName) {
  const base = (rawName || "").trim();
  if (!base) return "category";

  let slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric -> "-"
    .replace(/^-+|-+$/g, ""); // trim "-"

  // keep reasonable length
  slug = slug.slice(0, 80);

  return slug || "category";
}

// Make slug unique across all categories (tour + blog)
// if "north-india" exists -> "north-india-2", "north-india-3", ...
async function generateUniqueCategorySlug(name) {
  const base = slugifyCategoryName(name);
  let candidate = base;
  let counter = 2;

  // simple safety loop
  for (let i = 0; i < 20; i++) {
    const qSlug = query(
      collection(db, COLLECTION),
      where("slug", "==", candidate)
    );
    const snap = await getDocs(qSlug);

    if (snap.empty) {
      return candidate;
    }

    candidate = `${base}-${counter++}`;
  }

  // worst-case fallback
  return `${base}-${Date.now()}`;
}

/* =======================================
   🔹 FIRESTORE: CRUD + LIST
   ======================================= */

/**
 * Get categories of a given type ("tour" or "blog").
 * Sorted by createdAt desc (newest first).
 */
export async function getCategoriesByType(type) {
  const qRef = query(collection(db, COLLECTION), where("type", "==", type));
  const snap = await getDocs(qRef);

  const items = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // newest first, safely handle missing createdAt
  items.sort((a, b) => {
    const ta =
      typeof a.createdAt?.toMillis === "function"
        ? a.createdAt.toMillis()
        : 0;
    const tb =
      typeof b.createdAt?.toMillis === "function"
        ? b.createdAt.toMillis()
        : 0;
    return tb - ta;
  });

  return items;
}

/**
 * Create category (tour or blog).
 * - generates a unique slug from name
 */
export async function createCategory({ name, description, imageUrl, type }) {
  const cleanName = (name || "").trim();
  const slug = await generateUniqueCategorySlug(cleanName || "category");

  const payload = {
    name: cleanName,
    slug, // ✅ stored in Firestore
    description: description?.trim() || "",
    imageUrl: imageUrl?.trim() || "",
    type, // "tour" | "blog"
    isActive: true,
    itemCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const refDoc = await addDoc(collection(db, COLLECTION), payload);
  return { id: refDoc.id, ...payload };
}

/**
 * Update category.
 * - If category has NO slug yet (old data), we create one from new/old name.
 * - If slug already exists, we keep it (URL stable).
 */
export async function updateCategory(id, data) {
  const refDoc = doc(db, COLLECTION, id);

  // load existing to see if slug is missing
  let slugToUse;
  try {
    const snap = await getDoc(refDoc);
    if (snap.exists()) {
      const existing = snap.data();
      slugToUse = existing.slug;
      if (!slugToUse) {
        const nameSource =
          (data.name && data.name.trim()) ||
          (existing.name && existing.name.trim()) ||
          "category";
        slugToUse = await generateUniqueCategorySlug(nameSource);
      }
    }
  } catch (err) {
    console.error("Error reading category before update (slug)", err);
  }

  const finalData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (slugToUse) {
    finalData.slug = slugToUse;
  }

  await updateDoc(refDoc, finalData);
}

export async function deleteCategory(id) {
  const refDoc = doc(db, COLLECTION, id);
  await deleteDoc(refDoc);
}

export async function setCategoryActive(id, isActive) {
  const refDoc = doc(db, COLLECTION, id);
  await updateDoc(refDoc, {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

/* =======================================
   🔹 STORAGE: IMAGE UPLOAD / DELETE
   ======================================= */

/**
 * Upload a category image (tour / blog).
 * - type: "tour" | "blog" → used in folder path
 * - returns public download URL
 *
 * Path example:
 *   categories/tour/1700000000000-image-name.webp
 */
export async function uploadCategoryImage(file, type = "tour") {
  if (!file) throw new Error("No file provided");

  const safeType = type || "tour";

  const originalName = file.name || "image";
  const ext = originalName.includes(".")
    ? originalName.split(".").pop()
    : "jpg";

  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-");

  const fileName = `${Date.now()}-${safeName}`;
  const path = `categories/${safeType}/${fileName}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return url;
}

// Extract "categories/..." path from the Firebase download URL
function extractPathFromStorageUrl(url) {
  try {
    const u = new URL(url);
    // /v0/b/<bucket>/o/categories%2Ftour%2Ffile.webp
    const segments = u.pathname.split("/o/");
    if (segments.length < 2) return null;
    const encodedPath = segments[1]; // "categories%2Ftour%2Ffile.webp"
    const path = decodeURIComponent(encodedPath);
    return path;
  } catch (err) {
    console.error("Invalid storage URL:", url, err);
    return null;
  }
}

/**
 * Delete a category image given its download URL.
 * Safe to call even if url is empty or invalid.
 */
export async function deleteCategoryImageByUrl(url) {
  if (!url) return;

  try {
    const path = extractPathFromStorageUrl(url);
    if (!path) return;

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Error deleting category image from storage:", err);
  }
}
