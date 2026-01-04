import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function Categories() {
  const [name, setName] = useState("");
  const [type, setType] = useState("tour");
  const [categories, setCategories] = useState([]);

  const categoriesRef = collection(db, "categories");

  const fetchCategories = async () => {
    const snap = await getDocs(categoriesRef);
    setCategories(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();

    if (!name) return;

    await addDoc(categoriesRef, {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      type,
      order: categories.length + 1,
      status: "active",
      createdAt: serverTimestamp(),
    });

    setName("");
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete category?")) return;
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
  };

  return (
    <div>
      <h2>Categories</h2>

      {/* Add category */}
      <form onSubmit={addCategory}>
        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="tour">Tour</option>
          <option value="blog">Blog</option>
        </select>

        <button type="submit">Add</button>
      </form>

      <hr />

      {/* List */}
      <ul>
        {categories.map((cat) => (
          <li key={cat.id}>
            {cat.name} ({cat.type})
            <button onClick={() => deleteCategory(cat.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
