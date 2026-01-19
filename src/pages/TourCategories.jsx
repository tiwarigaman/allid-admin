// src/pages/TourCategories.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  LinearProgress, // 👈 added for upload progress
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PublicIcon from "@mui/icons-material/Public";
import HikingIcon from "@mui/icons-material/Hiking";
import CloseIcon from "@mui/icons-material/Close";

import {
  getCategoriesByType,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryActive,
  uploadCategoryImage,
  deleteCategoryImageByUrl,
} from "../api/categories";

// ---------- helper for slug preview ----------
function slugPreviewFromName(name) {
  const base = (name || "").trim();
  if (!base) return "";

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CategoryDialog({
  open,
  mode,
  initialData,
  onClose,
  onSave,
  categoryType = "tour", // "tour" | "blog" (for upload path)
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 👈 prevent double submit

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setImageUrl(initialData.imageUrl || "");
      setSelectedFile(null);
      setSelectedFileName("");
      setUploadingImage(false);
      setDeletingImage(false);
      setSubmitting(false);
    } else if (open && !initialData) {
      setName("");
      setDescription("");
      setImageUrl("");
      setSelectedFile(null);
      setSelectedFileName("");
      setUploadingImage(false);
      setDeletingImage(false);
      setSubmitting(false);
    }
  }, [open, initialData]);

  const title = mode === "edit" ? "Edit Category" : "Add New Category";
  const buttonLabel = mode === "edit" ? "Update Category" : "Add Category";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (submitting) return; // 👈 ignore extra clicks while saving

    setSubmitting(true);
    await onSave({
      name,
      description,
      imageUrl,
    });
    // no need to setSubmitting(false) – dialog usually closes after save
  };

  const slugPreview = slugPreviewFromName(name);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setSelectedFileName(file.name);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      window.alert("Please select an image first.");
      return;
    }

    const maxSizeBytes = 3 * 1024 * 1024; // 3MB
    if (selectedFile.size > maxSizeBytes) {
      window.alert("Please upload an image smaller than 3MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploaded = await uploadCategoryImage(selectedFile, categoryType);

      // 👇 make this robust no matter what the API returns
      let url = "";
      if (typeof uploaded === "string") {
        url = uploaded;
      } else if (uploaded && typeof uploaded === "object") {
        url =
          uploaded.url ||
          uploaded.downloadURL ||
          uploaded.downloadUrl ||
          "";
      }

      if (!url) {
        console.warn(
          "uploadCategoryImage did not return a URL. Result:",
          uploaded
        );
        window.alert(
          "Image uploaded, but no URL was returned. Please check your API response."
        );
      } else {
        // At a time we keep only one -> override URL field
        setImageUrl(url);
      }

      setSelectedFile(null);
      setSelectedFileName("");
    } catch (err) {
      console.error("Error uploading category image:", err);
      window.alert("Error uploading image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;

    const ok = window.confirm(
      "Delete this image and clear it from this category?"
    );
    if (!ok) return;

    setDeletingImage(true);
    try {
      await deleteCategoryImageByUrl(imageUrl);
    } catch (err) {
      console.error("Error deleting category image:", err);
    } finally {
      setImageUrl("");
      setDeletingImage(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {title}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{
            pt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Category Name + slug preview */}
          <Box>
            <TextField
              label="Category Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {slugPreview && (
              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: 12,
                  color: "rgba(148,163,184,1)",
                  fontWeight: 500,
                  fontFamily:
                    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              >
                URL slug:{" "}
                <span style={{ opacity: 0.9 }}>{slugPreview}</span>
              </Typography>
            )}
          </Box>

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Image URL + upload controls */}
          <Box>
            <TextField
              label="Image URL"
              fullWidth
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              helperText="Paste a cover image URL or upload from your device"
            />

            <Box sx={{ mt: 1.5 }}>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
              >
                <Button
                  component="label"
                  size="small"
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 2,
                    py: 0.6,
                    fontWeight: 600,
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
                    onChange={handleFileSelect}
                  />
                </Button>

                <Button
                  size="small"
                  onClick={handleUploadImage}
                  disabled={!selectedFile || uploadingImage}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 2,
                    py: 0.6,
                    fontWeight: 600,
                  }}
                >
                  {uploadingImage ? "Uploading..." : "Upload"}
                </Button>

                {imageUrl && (
                  <Button
                    size="small"
                    color="error"
                    onClick={handleDeleteImage}
                    disabled={deletingImage}
                    sx={{
                      textTransform: "none",
                      px: 2,
                      py: 0.6,
                      fontWeight: 600,
                    }}
                  >
                    {deletingImage ? "Deleting..." : "Delete image"}
                  </Button>
                )}
              </Stack>

              {selectedFileName && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.75,
                    display: "block",
                    color: "text.secondary",
                  }}
                >
                  Selected: {selectedFileName}
                </Typography>
              )}

              {/* 👇 simple progress indicator while uploading */}
              {uploadingImage && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disableElevation
            disabled={submitting} // 👈 stop double-clicks
          >
            {buttonLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function TourCategories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // "create" | "edit"
  const [selectedCategory, setSelectedCategory] = useState(null);
    React.useEffect(() => {
      document.title = "Tour Categories | All India Destination (Admin)";
      return () => {
        document.title = "All India Destination – Explore India Tours";
      };
    }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategoriesByType("tour");
      setCategories(data);
    } catch (err) {
      console.error("Error loading tour categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(term)
    );
  }, [categories, search]);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (category) => {
    setDialogMode("edit");
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleDialogSave = async (formValues) => {
    try {
      if (dialogMode === "create") {
        await createCategory({
          ...formValues,
          type: "tour", // 👈 tour categories
        });
      } else if (dialogMode === "edit" && selectedCategory) {
        await updateCategory(selectedCategory.id, formValues);
      }
      await loadCategories();
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving category", err);
    }
  };

  const handleDelete = async (category) => {
    const ok = window.confirm(
      `Delete category "${category.name}"? This cannot be undone.`
    );
    if (!ok) return;

    try {
      await deleteCategory(category.id);
      await loadCategories();
    } catch (err) {
      console.error("Error deleting category", err);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await setCategoryActive(category.id, !category.isActive);
      await loadCategories();
    } catch (err) {
      console.error("Error toggling category", err);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, mb: 0.5, letterSpacing: "-0.03em" }}
          >
            Tour Categories
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", maxWidth: 520 }}
          >
            Manage tour categories and organize your travel packages.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          disableElevation
          onClick={handleOpenCreate}
          sx={{
            borderRadius: 999,
            px: 3,
            whiteSpace: "nowrap",
            fontWeight: 600,
          }}
        >
          + Add Category
        </Button>
      </Stack>

      {/* Search / Filters */}
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 4,
          bgcolor: "background.paper",
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
          border: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <TextField
            fullWidth
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgba(15,23,42,0.45)" }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
          >
            <Button
              startIcon={<FilterListIcon />}
              sx={{
                bgcolor: "rgba(15,23,42,0.02)",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              Filter
            </Button>
            <Button
              startIcon={<FileDownloadIcon />}
              sx={{
                bgcolor: "rgba(15,23,42,0.02)",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Categories grid */}
      <Grid container spacing={3}>
        {loading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Loading categories...
            </Typography>
          </Grid>
        )}

        {!loading && filteredCategories.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              No tour categories found. Try adding one.
            </Typography>
          </Grid>
        )}

        {!loading &&
          filteredCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card
                sx={{
                  // borderRadius: 4,
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                <CardActionArea disableRipple>
                  {category.imageUrl ? (
                    <CardMedia
                      component="img"
                      height="190"
                      image={category.imageUrl}
                      alt={category.name}
                      sx={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 190,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "linear-gradient(135deg,#E0ECFF,#F5F7FB)",
                      }}
                    >
                      <HikingIcon
                        sx={{ fontSize: 44, color: "rgba(37,99,235,0.8)" }}
                      />
                    </Box>
                  )}

                  {/* Active chip + card actions over image */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={category.isActive ? "active" : "inactive"}
                      size="small"
                      sx={{
                        bgcolor: category.isActive
                          ? "rgba(22,163,74,0.12)"
                          : "rgba(148,163,184,0.16)",
                        color: category.isActive ? "#15803D" : "#64748B",
                        fontWeight: 700,
                        textTransform: "lowercase",
                      }}
                    />
                  </Box>

                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                      sx={{ mb: 1.5 }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          letterSpacing: "-0.02em",
                          fontSize: 18,
                        }}
                      >
                        {category.name}
                      </Typography>

                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenEdit(category);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(category);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 2,
                        minHeight: 44,
                      }}
                    >
                      {category.description || "No description yet."}
                    </Typography>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PublicIcon
                          sx={{
                            fontSize: 18,
                            color: "rgba(15,23,42,0.45)",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: "text.secondary" }}
                        >
                          {category.itemCount || 0} tours
                        </Typography>
                      </Stack>

                      <Button
                        size="small"
                        variant="text"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleActive(category);
                        }}
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "none",
                          color: category.isActive ? "#EF4444" : "#16A34A",
                        }}
                      >
                        {category.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Add / Edit dialog */}
      <CategoryDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedCategory}
        onClose={() => setDialogOpen(false)}
        onSave={handleDialogSave}
        categoryType="tour"
      />
    </Box>
  );
}
