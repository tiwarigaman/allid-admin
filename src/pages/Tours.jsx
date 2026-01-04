// src/pages/Tours.jsx
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  getTours,
  createTour,
  deleteTour,
  updateTour,
  setTourStatus,
  uploadTourFeatureImage,
  uploadTourGalleryImage,
  deleteTourImageByUrl,
} from "../api/tours";
import { getCategoriesByType } from "../api/categories";
// ---------- Helpers for UI ----------
const cardShadow = "0 20px 60px rgba(2, 8, 23, 0.08)";
const cardBorder = "1px solid rgba(15, 23, 42, 0.08)";
// Slug preview (same rule as backend, but without uniqueness check)
function slugPreviewFromTitle(title) {
  const base = (title || "").trim();
  if (!base) return "";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
// Map Firestore tour doc → form state object
function tourDocToForm(tour) {
  const galleryImages =
    Array.isArray(tour.galleryImageUrls) &&
    tour.galleryImageUrls.length > 0
      ? tour.galleryImageUrls
      : [""];
  const highlights =
    Array.isArray(tour.highlights) && tour.highlights.length > 0
      ? tour.highlights
      : [""];
  const included =
    Array.isArray(tour.included) && tour.included.length > 0
      ? tour.included
      : [""];
  const excluded =
    Array.isArray(tour.excluded) && tour.excluded.length > 0
      ? tour.excluded
      : [""];
  const itinerary =
    Array.isArray(tour.itinerary) && tour.itinerary.length > 0
      ? tour.itinerary.map((d) => ({
          dayTitle: d.dayTitle || "",
          description: d.description || "",
        }))
      : [{ dayTitle: "", description: "" }];
  return {
    title: tour.title || "",
    description: tour.description || "",
    location: tour.location || "",
    duration: tour.duration || "",
    maxGroupSize:
      typeof tour.maxGroupSize === "number"
        ? String(tour.maxGroupSize)
        : tour.maxGroupSize || "",
    difficultyLevel: tour.difficultyLevel || "Easy",
    status: tour.status || "draft",
    season: tour.season || "",
    minAge:
      typeof tour.minAge === "number"
        ? String(tour.minAge)
        : tour.minAge || "",
    mapEmbedHtml: tour.mapEmbedHtml || "",
    categoryId: tour.categoryId || "",
    categoryName: tour.categoryName || "",
    featureImageUrl:
      tour.featureImageUrl ||
      (Array.isArray(tour.imageUrls) && tour.imageUrls[0]) ||
      "",
    galleryImages,
    highlights,
    included,
    excluded,
    itinerary,
    // keep slug for viewing
    slug: tour.slug || "",
    // SEO fields
    metaTitle: tour.metaTitle || "",
    metaDescription: tour.metaDescription || "",
    metaKeywords: tour.metaKeywords || "",
  };
}
export default function Tours() {
  const [tab, setTab] = useState(0);
  // list state
  const [tours, setTours] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // create/edit form state
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    duration: "",
    maxGroupSize: "",
    difficultyLevel: "Easy",
    status: "draft",
    season: "",
    minAge: "",
    mapEmbedHtml: "",
    categoryId: "",
    categoryName: "",
    featureImageUrl: "",
    galleryImages: [""],
    highlights: [""],
    included: [""],
    excluded: [""],
    itinerary: [{ dayTitle: "", description: "" }],
    slug: "",
    // SEO fields
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  // categories for dropdown (only tour categories)
  const [tourCategories, setTourCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  // upload state (UX)
  const [uploadingFeature, setUploadingFeature] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState({}); // { index: bool }
  // selected files (for two-step Select + Upload UI)
  const [featureFile, setFeatureFile] = useState(null);
  const [featureFileName, setFeatureFileName] = useState("");
  const [galleryFiles, setGalleryFiles] = useState({}); // { index: File }
  const [galleryFileNames, setGalleryFileNames] = useState({}); // { index: string }
  // track uploaded images for *new* tours so we can delete on Cancel
  const [uploadedImagesToCleanup, setUploadedImagesToCleanup] = useState(
    []
  );
  // ------------- Load tours from API layer -------------
  const loadTours = useCallback(async () => {
    setLoadingTours(true);
    try {
      const data = await getTours();
      setTours(data);
    } catch (err) {
      console.error("Error loading tours:", err);
    } finally {
      setLoadingTours(false);
    }
  }, []);
  useEffect(() => {
    loadTours();
  }, [loadTours]);
  // ------------- Load tour categories for the dropdown -------------
  const loadTourCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const cats = await getCategoriesByType("tour");
      setTourCategories(cats);
    } catch (err) {
      console.error("Error loading tour categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);
  // Whenever we enter the "Create Tour" tab, refresh categories
  useEffect(() => {
    if (tab === 1) {
      loadTourCategories();
    }
  }, [tab, loadTourCategories]);
  // ------------- Filters for list tab -------------
  const filteredTours = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return tours.filter((t) => {
      const matchesQ =
        !q ||
        `${t.title || ""} ${t.location || ""}`
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (t.status || "draft") === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [tours, queryText, statusFilter]);
  // ------------- Form helpers -------------
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateArrayItem = (field, index, value) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };
  const addArrayItem = (field, emptyValue) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], emptyValue],
    }));
  };
  const updateItineraryItem = (index, itemField, value) => {
    setForm((prev) => {
      const arr = [...prev.itinerary];
      arr[index] = { ...arr[index], [itemField]: value };
      return { ...prev, itinerary: arr };
    });
  };
  const addItineraryDay = () => {
    setForm((prev) => ({
      ...prev,
      itinerary: [...prev.itinerary, { dayTitle: "", description: "" }],
    }));
  };
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      location: "",
      duration: "",
      maxGroupSize: "",
      difficultyLevel: "Easy",
      status: "draft",
      season: "",
      minAge: "",
      mapEmbedHtml: "",
      categoryId: "",
      categoryName: "",
      featureImageUrl: "",
      galleryImages: [""],
      highlights: [""],
      included: [""],
      excluded: [""],
      itinerary: [{ dayTitle: "", description: "" }],
      slug: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
    });
    setFeatureFile(null);
    setFeatureFileName("");
    setGalleryFiles({});
    setGalleryFileNames({});
  };
  // ------------- helper: copy to clipboard -------------
  const copyToClipboard = (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          () => {
            window.alert("Image URL copied to clipboard.");
          },
          () => {
            window.prompt("Copy image URL:", text);
          }
        );
      } else {
        window.prompt("Copy image URL:", text);
      }
    } catch (err) {
      console.error("Clipboard error", err);
      window.prompt("Copy image URL:", text);
    }
  };
  // ------------- Image upload helpers (using API layer) -------------
  const handleFeatureFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFeatureFile(file);
    setFeatureFileName(file.name);
  };
  const handleUploadFeatureImage = async () => {
    if (!featureFile) {
      window.alert("Please select an image first.");
      return;
    }
    const maxSizeBytes = 3 * 1024 * 1024;
    if (featureFile.size > maxSizeBytes) {
      window.alert("Please upload an image smaller than 3MB.");
      return;
    }
    setUploadingFeature(true);
    try {
      const { url } = await uploadTourFeatureImage(featureFile);
      updateField("featureImageUrl", url);
      // Only track as temp if we're creating (not editing)
      if (!editingId) {
        setUploadedImagesToCleanup((prev) =>
          prev.includes(url) ? prev : [...prev, url]
        );
      }
      setFeatureFile(null);
      setFeatureFileName("");
    } catch (err) {
      console.error("Error uploading feature image:", err);
      window.alert("Error uploading image. Please try again.");
    } finally {
      setUploadingFeature(false);
    }
  };
  const handleGalleryFileSelect = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setGalleryFiles((prev) => ({ ...prev, [index]: file }));
    setGalleryFileNames((prev) => ({ ...prev, [index]: file.name }));
  };
  const handleUploadGalleryImage = async (index) => {
    const file = galleryFiles[index];
    if (!file) {
      window.alert("Please select an image first.");
      return;
    }
    const maxSizeBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      window.alert("Please upload an image smaller than 3MB.");
      return;
    }
    setUploadingGallery((prev) => ({ ...prev, [index]: true }));
    try {
      const { url } = await uploadTourGalleryImage(file);
      updateArrayItem("galleryImages", index, url);
      // Only track as temp if we're creating (not editing)
      if (!editingId) {
        setUploadedImagesToCleanup((prev) =>
          prev.includes(url) ? prev : [...prev, url]
        );
      }
      setGalleryFiles((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
      setGalleryFileNames((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    } catch (err) {
      console.error("Error uploading gallery image:", err);
      window.alert("Error uploading image. Please try again.");
    } finally {
      setUploadingGallery((prev) => ({ ...prev, [index]: false }));
    }
  };
  // ------------- Delete individual images -------------
  const handleDeleteFeatureImage = async () => {
    const url = form.featureImageUrl;
    if (!url) return;
    const ok = window.confirm(
      "Delete this feature image from storage and clear it?"
    );
    if (!ok) return;
    try {
      await deleteTourImageByUrl(url);
    } catch (err) {
      console.error("Error deleting feature image:", err);
    } finally {
      updateField("featureImageUrl", "");
      setUploadedImagesToCleanup((prev) =>
        prev.filter((u) => u !== url)
      );
      setFeatureFile(null);
      setFeatureFileName("");
    }
  };
  const handleDeleteGalleryImage = async (index) => {
    const url = form.galleryImages[index];
    if (!url) return;
    const ok = window.confirm(
      "Delete this gallery image from storage and clear it?"
    );
    if (!ok) return;
    try {
      await deleteTourImageByUrl(url);
    } catch (err) {
      console.error("Error deleting gallery image:", err);
    } finally {
      setForm((prev) => {
        const arr = [...prev.galleryImages];
        arr[index] = "";
        return { ...prev, galleryImages: arr };
      });
      setUploadedImagesToCleanup((prev) =>
        prev.filter((u) => u !== url)
      );
      setGalleryFiles((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
      setGalleryFileNames((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    }
  };
  // ------------- Save tour via API (create OR edit) -------------
  const handleSaveTour = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location) {
      window.alert("Please fill title, description and location.");
      return;
    }
    if (!form.categoryId) {
      window.alert("Please select a tour category.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTour(editingId, form);
      } else {
        await createTour(form);
      }
      resetForm();
      setEditingId(null);
      setUploadedImagesToCleanup([]);
      setTab(0);
      await loadTours();
    } catch (err) {
      console.error("Error saving tour:", err);
    } finally {
      setSaving(false);
    }
  };
  // ------------- Delete tour via API -------------
  const handleDeleteTour = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this tour?"
    );
    if (!ok) return;
    try {
      await deleteTour(id);
      setTours((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting tour:", err);
    }
  };
  // ------------- Edit tour (fill form & open tab) -------------
  const handleEditTour = (tour) => {
    setEditingId(tour.id);
    setForm(tourDocToForm(tour));
    setUploadedImagesToCleanup([]); // editing existing: no temp uploads tracked yet
    setFeatureFile(null);
    setFeatureFileName("");
    setGalleryFiles({});
    setGalleryFileNames({});
    setTab(1);
  };
  // ------------- View tour (placeholder for user panel) -------------
  const handleViewTour = (tour) => {
    const slug = tour.slug || slugPreviewFromTitle(tour.title) || "(slug-missing)";
    window.alert(
      `TODO: Open public tour detail page at "/tours/${slug}" for "${tour.title}".`
    );
  };
  // ------------- Publish / unpublish (status toggle) -------------
  const handleToggleStatus = async (tour) => {
    const current = tour.status || "draft";
    const next = current === "published" ? "draft" : "published";
    try {
      await setTourStatus(tour.id, next);
      setTours((prev) =>
        prev.map((t) =>
          t.id === tour.id ? { ...t, status: next } : t
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };
  // ------------- Cancel (new vs edit) -------------
  const handleCancel = async () => {
    if (editingId) {
      // Editing existing tour: just confirm discard changes
      const ok = window.confirm(
        "Discard changes to this tour and go back?"
      );
      if (!ok) return;
      resetForm();
      setEditingId(null);
      setUploadedImagesToCleanup([]);
      setTab(0);
      return;
    }
    // Creating a new tour
    const hasUploads = uploadedImagesToCleanup.length > 0;
    const ok = window.confirm(
      hasUploads
        ? "Cancel this new tour? Any uploaded images will be deleted from storage."
        : "Cancel this new tour and discard all changes?"
    );
    if (!ok) return;
    if (hasUploads) {
      const uniqueUrls = Array.from(
        new Set(uploadedImagesToCleanup)
      );
      for (const url of uniqueUrls) {
        try {
          await deleteTourImageByUrl(url);
        } catch (err) {
          console.error("Failed to delete temp image", err);
        }
      }
    }
    resetForm();
    setEditingId(null);
    setUploadedImagesToCleanup([]);
    setTab(0);
  };
  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <Box sx={{ pb: 4 }}>
      {/* Header title (changes a bit by tab) */}
      {tab === 0 ? (
        <>
          <Typography
            sx={{
              fontSize: 32,
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            Tour Management
          </Typography>
          <Typography
            sx={{ mt: 0.6, color: "#64748b", fontWeight: 600 }}
          >
            Manage your travel tours and packages
          </Typography>
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                }}
              >
                {editingId ? "Edit Tour" : "Add New Tour"}
              </Typography>
              <Typography
                sx={{ mt: 0.6, color: "#64748b", fontWeight: 600 }}
              >
                {editingId
                  ? "Update your tour package details"
                  : "Create a new tour package for your customers"}
              </Typography>
            </Box>
            <Button
              startIcon={
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
              }
              onClick={() => {
                setTab(0);
                setEditingId(null);
                resetForm();
                setUploadedImagesToCleanup([]);
              }}
              sx={{
                borderRadius: 999,
                px: 2.5,
                py: 1,
                fontWeight: 800,
                textTransform: "none",
                color: "#0f172a",
                background: "rgba(148,163,184,0.10)",
                "&:hover": { background: "rgba(148,163,184,0.18)" },
              }}
            >
              Back to Tours
            </Button>
          </Box>
        </>
      )}
      {/* Tabs (Tours / Create Tour) */}
      <Box sx={{ mt: 2.25 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            if (v === 0) {
              setEditingId(null);
              resetForm();
              setUploadedImagesToCleanup([]);
            }
            if (v === 1 && !editingId) {
              // entering "Create Tour" fresh
              resetForm();
              setUploadedImagesToCleanup([]);
            }
          }}
          sx={{
            minHeight: 42,
            "& .MuiTab-root": {
              minHeight: 42,
              textTransform: "none",
              fontWeight: 800,
              color: "#64748b",
              px: 2,
            },
            "& .Mui-selected": { color: "#0B63F6 !important" },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: 99,
              background: "#16a34a",
            },
          }}
        >
          <Tab label="Tours" />
          <Tab label="Create Tour" />
        </Tabs>
        <Divider sx={{ mt: 1.25, opacity: 0.6 }} />
      </Box>
      {/* ======================= TAB 0: LIST ======================= */}
      {tab === 0 && (
        <>
          {/* Filters bar */}
          <Paper
            elevation={0}
            sx={{
              mt: 2.25,
              p: { xs: 2, md: 2.5 },
              borderRadius: "18px !important",
              overflow: "visible !important",
              border: cardBorder,
              background: "rgba(255,255,255,0.92)",
              boxShadow: cardShadow,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1.2fr 1fr 0.9fr",
                },
                gap: 2,
                alignItems: "end",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: "#0f172a",
                    mb: 0.8,
                  }}
                >
                  Search Tours
                </Typography>
                <TextField
                  fullWidth
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Search by title or location..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "999px",
                      backgroundColor: "#fff",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{ fontWeight: 900, color: "#0f172a", mb: 0.8 }}
                >
                  Status
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: "999px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                }}
              >
                <Button
                  disabled={!queryText && statusFilter === "all"}
                  onClick={() => {
                    setQueryText("");
                    setStatusFilter("all");
                  }}
                  sx={{
                    borderRadius: "999px",
                    px: 3,
                    py: 1.1,
                    fontWeight: 900,
                    background: "rgba(15, 23, 42, 0.06)",
                    color: "#94a3b8",
                    "&.Mui-disabled": { color: "#cbd5e1" },
                  }}
                >
                  Reset Filters
                </Button>
              </Box>
            </Box>
          </Paper>
          {/* Cards grid */}
          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {loadingTours && (
              <Typography sx={{ color: "#64748b" }}>
                Loading tours…
              </Typography>
            )}
            {!loadingTours && filteredTours.length === 0 && (
              <Typography sx={{ color: "#64748b" }}>
                No tours found. Create your first tour in the
                &nbsp;
                <strong>Create Tour</strong> tab.
              </Typography>
            )}
            {filteredTours.map((t) => {
              const image =
                t.featureImageUrl ||
                (Array.isArray(t.imageUrls) && t.imageUrls[0]) ||
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop";
              const status = t.status || "draft";
              const isPublished = status === "published";
              return (
                <Paper
                  key={t.id}
                  elevation={0}
                  sx={{
                    borderRadius: "18px !important",
                    overflow: "hidden",
                    border: cardBorder,
                    background: "#fff",
                    boxShadow: cardShadow,
                  }}
                >
                  {/* Image */}
                  <Box sx={{ position: "relative" }}>
                    <Box
                      component="img"
                      src={image}
                      alt={t.title}
                      sx={{
                        width: "100%",
                        height: 210,
                        objectFit: "cover",
                      }}
                    />
                    <Chip
                      label={status}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        fontWeight: 900,
                        borderRadius: "999px",
                        textTransform: "capitalize",
                        background: isPublished
                          ? "rgba(34,197,94,0.14)"
                          : "rgba(148,163,184,0.24)",
                        color: isPublished ? "#15803d" : "#475569",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleEditTour(t)}
                        sx={{
                          width: 36,
                          height: 36,
                          background: "rgba(255,255,255,0.90)",
                          border: "1px solid rgba(15,23,42,0.08)",
                          "&:hover": { background: "#fff" },
                        }}
                      >
                        <EditRoundedIcon
                          fontSize="small"
                          sx={{ color: "#2563eb" }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleViewTour(t)}
                        sx={{
                          width: 36,
                          height: 36,
                          background: "rgba(255,255,255,0.90)",
                          border: "1px solid rgba(15,23,42,0.08)",
                          "&:hover": { background: "#fff" },
                        }}
                      >
                        <VisibilityRoundedIcon
                          fontSize="small"
                          sx={{ color: "#16a34a" }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTour(t.id)}
                        sx={{
                          width: 36,
                          height: 36,
                          background: "rgba(255,255,255,0.90)",
                          border: "1px solid rgba(15,23,42,0.08)",
                          "&:hover": { background: "#fff" },
                        }}
                      >
                        <DeleteOutlineRoundedIcon
                          fontSize="small"
                          sx={{ color: "#ef4444" }}
                        />
                      </IconButton>
                    </Box>
                  </Box>
                  {/* Body */}
                  <Box sx={{ p: 2.2 }}>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {t.title}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1.4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          color: "#475569",
                        }}
                      >
                        <LocationOnOutlinedIcon
                          sx={{
                            fontSize: 18,
                            color: "#64748b",
                          }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          {t.location}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          color: "#475569",
                        }}
                      >
                        <ScheduleOutlinedIcon
                          sx={{
                            fontSize: 18,
                            color: "#64748b",
                          }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          {t.duration}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        {t.categoryName ||
                          t.categoryId ||
                          "Uncategorized"}
                      </Typography>
                      <Button
                        variant="text"
                        onClick={() => handleToggleStatus(t)}
                        sx={{
                          fontWeight: 900,
                          textTransform: "none",
                          color: (t.status || "draft") === "published"
                            ? "#f97316"
                            : "#16a34a",
                          "&:hover": {
                            background:
                              (t.status || "draft") === "published"
                                ? "rgba(249,115,22,0.08)"
                                : "rgba(34,197,94,0.08)",
                          },
                        }}
                      >
                        {(t.status || "draft") === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </>
      )}
      {/* ======================= TAB 1: CREATE / EDIT TOUR ======================= */}
      {tab === 1 && (
        <Box
          component="form"
          onSubmit={handleSaveTour}
          sx={{ mt: 2.5 }}
        >
          <Grid container spacing={3} alignItems="flex-start">
            {/* LEFT: main fields */}
            <Grid item xs={12} md={8}>
              {/* Basic information */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  Basic Information
                </Typography>
                <Grid container spacing={2.25}>
                  <Grid item xs={12} md={12 / 5}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Tour Title
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      placeholder="Enter tour title"
                      value={form.title}
                      onChange={(e) =>
                        updateField("title", e.target.value)
                      }
                    />
                    {form.title && (
                      <Typography
                        sx={{
                          mt: 0.75,
                          fontSize: 12,
                          color: "#94a3b8",
                          fontWeight: 500,
                          fontFamily:
                            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        }}
                      >
                        URL slug:{" "}
                        <span style={{ opacity: 0.9 }}>
                          /tours/{slugPreviewFromTitle(form.title)}
                        </span>
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={12 / 5}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Description
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      multiline
                      minRows={1}
                      placeholder="Enter tour description"
                      value={form.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={12 / 5}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Location
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      placeholder="e.g., Delhi, Agra, Jaipur"
                      value={form.location}
                      onChange={(e) =>
                        updateField("location", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={12 / 5}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Duration
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., 6 Days 5 Nights"
                      value={form.duration}
                      onChange={(e) =>
                        updateField("duration", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={12 / 5}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Max Group Size
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="e.g., 15"
                      value={form.maxGroupSize}
                      onChange={(e) =>
                        updateField("maxGroupSize", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Difficulty Level
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={form.difficultyLevel}
                        onChange={(e) =>
                          updateField(
                            "difficultyLevel",
                            e.target.value
                          )
                        }
                      >
                        <MenuItem value="Easy">Easy</MenuItem>
                        <MenuItem value="Moderate">Moderate</MenuItem>
                        <MenuItem value="Hard">Hard</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Season
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., October to February"
                      value={form.season}
                      onChange={(e) =>
                        updateField("season", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Minimum Age
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="e.g., 12"
                      value={form.minAge}
                      onChange={(e) =>
                        updateField("minAge", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Map Embed (iframe)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      placeholder='<iframe src="..."></iframe> or map embed code'
                      value={form.mapEmbedHtml}
                      onChange={(e) =>
                        updateField("mapEmbedHtml", e.target.value)
                      }
                    />
                  </Grid>
                </Grid>
              </Paper>
              {/* Images */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  Images
                </Typography>
                <Grid container spacing={2.25}>
                  <Grid item xs={12} md={6}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Feature Image
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="https://example.com/image.jpg"
                      value={form.featureImageUrl}
                      onChange={(e) =>
                        updateField(
                          "featureImageUrl",
                          e.target.value
                        )
                      }
                      disabled={Boolean(form.featureImageUrl)}
                      helperText={
                        form.featureImageUrl
                          ? "Image URL is locked. Use Delete image to change."
                          : "Paste an image URL or upload from your device."
                      }
                      InputProps={{
                        endAdornment: form.featureImageUrl && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() =>
                                copyToClipboard(form.featureImageUrl)
                              }
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Box sx={{ mt: 1.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          component="label"
                          size="small"
                          sx={{
                            textTransform: "none",
                            fontWeight: 800,
                            borderRadius: 999,
                            px: 2,
                            py: 0.6,
                            background: "rgba(15,23,42,0.04)",
                            "&:hover": {
                              background: "rgba(15,23,42,0.08)",
                            },
                          }}
                        >
                          Select
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={handleFeatureFileSelect}
                          />
                        </Button>
                        <Button
                          size="small"
                          onClick={handleUploadFeatureImage}
                          disabled={!featureFile || uploadingFeature}
                          sx={{
                            textTransform: "none",
                            fontWeight: 800,
                            borderRadius: 999,
                            px: 2,
                            py: 0.6,
                          }}
                        >
                          {uploadingFeature
                            ? "Uploading..."
                            : "Upload"}
                        </Button>
                        {form.featureImageUrl && (
                          <Button
                            size="small"
                            color="error"
                            onClick={handleDeleteFeatureImage}
                            sx={{
                              textTransform: "none",
                              fontWeight: 800,
                              borderRadius: 999,
                              px: 2,
                              py: 0.6,
                            }}
                          >
                            Delete image
                          </Button>
                        )}
                      </Box>
                      {featureFileName && (
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 0.75,
                            display: "block",
                            color: "text.secondary",
                          }}
                        >
                          Selected: {featureFileName}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        mb: 0.6,
                        color: "#0f172a",
                      }}
                    >
                      Gallery Images
                    </Typography>
                    {form.galleryImages.map((url, idx) => (
                      <Box key={idx} sx={{ mt: idx > 0 ? 3 : 0 }}>
                        <TextField
                          fullWidth
                          placeholder="https://example.com/gallery-image.jpg"
                          value={url}
                          onChange={(e) =>
                            updateArrayItem(
                              "galleryImages",
                              idx,
                              e.target.value
                            )
                          }
                          disabled={Boolean(url)}
                          helperText={
                            url
                              ? "Image URL is locked. Use Delete image to change."
                              : "Paste an image URL or upload from your device."
                          }
                          InputProps={{
                            endAdornment: url && (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(url)}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Box sx={{ mt: 1.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              component="label"
                              size="small"
                              sx={{
                                textTransform: "none",
                                fontWeight: 800,
                                borderRadius: 999,
                                px: 2,
                                py: 0.6,
                                background: "rgba(15,23,42,0.04)",
                                "&:hover": {
                                  background: "rgba(15,23,42,0.08)",
                                },
                              }}
                            >
                              Select
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleGalleryFileSelect(idx, e)
                                }
                              />
                            </Button>
                            <Button
                              size="small"
                              onClick={() =>
                                handleUploadGalleryImage(idx)
                              }
                              disabled={
                                !galleryFiles[idx] ||
                                uploadingGallery[idx]
                              }
                              sx={{
                                textTransform: "none",
                                fontWeight: 800,
                                borderRadius: 999,
                                px: 2,
                                py: 0.6,
                              }}
                            >
                              {uploadingGallery[idx]
                                ? "Uploading..."
                                : "Upload"}
                            </Button>
                            {url && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteGalleryImage(idx)
                                }
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 800,
                                  borderRadius: 999,
                                  px: 2,
                                  py: 0.6,
                                }}
                              >
                                Delete image
                              </Button>
                            )}
                          </Box>
                          {galleryFileNames[idx] && (
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.75,
                                display: "block",
                                color: "text.secondary",
                              }}
                            >
                              Selected: {galleryFileNames[idx]}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                    <Button
                      type="button"
                      onClick={() => addArrayItem("galleryImages", "")}
                      sx={{
                        mt: 2,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      + Add Gallery Image
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
              {/* Tour Highlights */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  Tour Highlights
                </Typography>
                {form.highlights.map((h, idx) => (
                  <Box key={idx} sx={{ mb: 1.75 }}>
                    {idx === 0 && (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          mb: 0.6,
                          color: "#0f172a",
                        }}
                      >
                        Highlight
                      </Typography>
                    )}
                    <TextField
                      fullWidth
                      placeholder="Enter tour highlight"
                      value={h}
                      onChange={(e) =>
                        updateArrayItem(
                          "highlights",
                          idx,
                          e.target.value
                        )
                      }
                    />
                  </Box>
                ))}
                <Button
                  type="button"
                  onClick={() => addArrayItem("highlights", "")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  + Add Highlight
                </Button>
              </Paper>
              {/* Itinerary */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  Itinerary
                </Typography>
                {form.itinerary.map((day, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      borderRadius: "16px",
                      border: "1px solid rgba(148,163,184,0.4)",
                      p: 2.25,
                      mb: 2,
                      background: "#f8fafc",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        mb: 1.5,
                        color: "#0f172a",
                      }}
                    >
                      Day {idx + 1}
                    </Typography>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          mb: 0.6,
                          color: "#0f172a",
                        }}
                      >
                        Day Title
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g., Arrival in Bali"
                        value={day.dayTitle}
                        onChange={(e) =>
                          updateItineraryItem(
                            idx,
                            "dayTitle",
                            e.target.value
                          )
                        }
                      />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          mb: 0.6,
                          color: "#0f172a",
                        }}
                      >
                        Description
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Describe the day's activities"
                        value={day.description}
                        onChange={(e) =>
                          updateItineraryItem(
                            idx,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </Box>
                  </Box>
                ))}
                <Button
                  type="button"
                  onClick={addItineraryDay}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  + Add Day
                </Button>
              </Paper>
            </Grid>
            {/* RIGHT: publish / SEO / included / excluded */}
            <Grid item xs={12} md={4} sx={{ position: { md: 'sticky' }, top: { md: 20 }, alignSelf: 'start' }}>
              {/* Publish settings */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  Publish Settings
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      mb: 0.6,
                      color: "#0f172a",
                    }}
                  >
                    Status
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={form.status}
                      onChange={(e) =>
                        updateField("status", e.target.value)
                      }
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ mb: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      mb: 0.6,
                      color: "#0f172a",
                    }}
                  >
                    Category
                  </Typography>
                  <Autocomplete
                    options={tourCategories}
                    loading={loadingCategories}
                    getOptionLabel={(option) => option?.name || ""}
                    value={
                      tourCategories.find(
                        (c) => c.id === form.categoryId
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      updateField("categoryId", newValue?.id || "");
                      updateField(
                        "categoryName",
                        newValue?.name || ""
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        placeholder="Select category"
                      />
                    )}
                  />
                </Box>
              </Paper>
              {/* SEO Settings */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  SEO Settings
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      mb: 0.6,
                      color: "#0f172a",
                    }}
                  >
                    Meta Title
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Optional – defaults to tour title"
                    value={form.metaTitle}
                    onChange={(e) =>
                      updateField("metaTitle", e.target.value)
                    }
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      mb: 0.6,
                      color: "#0f172a",
                    }}
                  >
                    Meta Description
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Short summary for Google & social sharing"
                    value={form.metaDescription}
                    onChange={(e) =>
                      updateField(
                        "metaDescription",
                        e.target.value
                      )
                    }
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      mb: 0.6,
                      color: "#0f172a",
                    }}
                  >
                    Meta Keywords
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., varanasi tour, spiritual trip, ganga aarti"
                    value={form.metaKeywords}
                    onChange={(e) =>
                      updateField("metaKeywords", e.target.value)
                    }
                  />
                </Box>
              </Paper>
              {/* Included */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  What's Included
                </Typography>
                {form.included.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 1.75 }}>
                    {idx === 0 && (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          mb: 0.6,
                          color: "#0f172a",
                        }}
                      >
                        Item
                      </Typography>
                    )}
                    <TextField
                      fullWidth
                      placeholder="e.g., Accommodation"
                      value={item}
                      onChange={(e) =>
                        updateArrayItem(
                          "included",
                          idx,
                          e.target.value
                        )
                      }
                    />
                  </Box>
                ))}
                <Button
                  type="button"
                  onClick={() => addArrayItem("included", "")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  + Add Item
                </Button>
              </Paper>
              {/* Excluded */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "18px",
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backgroundColor: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                    mb: 2,
                  }}
                >
                  What's Excluded
                </Typography>
                {form.excluded.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 1.75 }}>
                    {idx === 0 && (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          mb: 0.6,
                          color: "#0f172a",
                        }}
                      >
                        Item
                      </Typography>
                    )}
                    <TextField
                      fullWidth
                      placeholder="e.g., International flights"
                      value={item}
                      onChange={(e) =>
                        updateArrayItem(
                          "excluded",
                          idx,
                          e.target.value
                        )
                      }
                    />
                  </Box>
                ))}
                <Button
                  type="button"
                  onClick={() => addArrayItem("excluded", "")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  + Add Item
                </Button>
              </Paper>
              {/* Save / Cancel */}
              <Box sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  fullWidth
                  disabled={saving}
                  sx={{
                    mb: 1.5,
                    borderRadius: 999,
                    py: 1.1,
                    fontWeight: 900,
                    textTransform: "none",
                    background: "#fb6376",
                    color: "#fff",
                    "&:hover": {
                      background: "#f97373",
                    },
                  }}
                >
                  {saving
                    ? "Saving…"
                    : editingId
                    ? "Update Tour"
                    : "Save Tour"}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  onClick={handleCancel}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    color: "#64748b",
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}