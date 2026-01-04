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
} from "firebase/firestore";
import { db, storage } from "../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const COLLECTION = "categories";

// ----------------- Helpers: filename & storage -----------------

function sanitizeFileName(name) {
  if (!name) return "image";
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "");
}

/**
 * Upload a category image to Firebase Storage.
 * type: "tour" | "blog"  (folder separation)
 * Path: categories/{type}/{timestamp}-{filename}
 */
export async function uploadCategoryImage(file, type = "tour") {
  if (!file) throw new Error("File is required");

  const safeType = type === "blog" ? "blog" : "tour";
  const safeName = sanitizeFileName(file.name);
  const filePath = `categories/${safeType}/${Date.now()}-${safeName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path: filePath };
}

/**
 * Delete a category image by its download URL.
 * If it's not a Firebase Storage URL, we just clear it on UI side.
 */
export async function deleteCategoryImageByUrl(imageUrl) {
  if (!imageUrl) return;

  try {
    // Only try Storage delete if this looks like a Firebase URL
    if (imageUrl.includes("firebasestorage.googleapis.com")) {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    }
  } catch (err) {
    console.error("Error deleting category image from storage", err);
  }
}

/**
 * Get categories of a given type ("tour" or "blog").
 * We filter in Firestore and sort by createdAt in JS
 * to avoid composite-index issues.
 */
export async function getCategoriesByType(type) {
  const q = query(collection(db, COLLECTION), where("type", "==", type));

  const snap = await getDocs(q);

  const items = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // sort newest first, safely handling missing createdAt
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

export async function createCategory({ name, description, imageUrl, type }) {
  const payload = {
    name: name.trim(),
    description: description?.trim() || "",
    imageUrl: imageUrl?.trim() || "",
    type, // "tour" | "blog"
    isActive: true,
    itemCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, ...payload };
}

export async function updateCategory(id, data) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

export async function setCategoryActive(id, isActive) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { isActive, updatedAt: serverTimestamp() });
}
