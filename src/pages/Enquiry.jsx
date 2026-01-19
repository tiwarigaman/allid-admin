// src/pages/Enquiry.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

import { getAllContactMessages, setContactFollowUp } from "../api/contact";
import {
  getAllTourForms,
  setTourFormFollowUp,
  setTourFormCompleted,
} from "../api/TourForm";

const CARD_BORDER = "1px solid rgba(15,23,42,0.08)";

function formatDateTime(date) {
  if (!date) return "—";
  try {
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(date);
  }
}

export default function Enquiry() {
  const [tab, setTab] = useState(0);

  // ===== CONTACT ENQUIRIES =====
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [followFilter, setFollowFilter] = useState("all"); // "all" | "pending" | "done"

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ===== TOUR FORM ENQUIRIES =====
  const [tourForms, setTourForms] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);

  const [tourSearch, setTourSearch] = useState("");
  const [tourFromDate, setTourFromDate] = useState("");
  const [tourToDate, setTourToDate] = useState("");
  const [tourStatusFilter, setTourStatusFilter] = useState("all"); // "all" | "pending" | "followed" | "completed"

  const [tourPage, setTourPage] = useState(1);
  const tourPageSize = 10;

  const [viewTour, setViewTour] = useState(null); // selected tour enquiry for dialog

  // ===== LOADERS =====

  // load all contact messages for admin
  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getAllContactMessages();
      setContacts(data);
    } catch (err) {
      console.error("Error loading contact messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // load all tour form enquiries
  const loadTourForms = async () => {
    setLoadingTours(true);
    try {
      const data = await getAllTourForms();
      setTourForms(data);
    } catch (err) {
      console.error("Error loading tour form enquiries:", err);
    } finally {
      setLoadingTours(false);
    }
  };

  useEffect(() => {
    if (tab === 0) {
      loadContacts();
    } else if (tab === 1) {
      loadTourForms();
    }
  }, [tab]);

  // whenever CONTACT filters change, go back to page 1
  useEffect(() => {
    setPage(1);
  }, [search, fromDate, toDate, followFilter]);

  // whenever TOUR filters change, go back to page 1
  useEffect(() => {
    setTourPage(1);
  }, [tourSearch, tourFromDate, tourToDate, tourStatusFilter]);

  // ===== CONTACT: filter + sort in memory =====
  const filteredContacts = useMemo(() => {
    let list = [...contacts];

    // search by email + phone
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const email = (item.email || "").toLowerCase();
        const phone = (item.phone || "").toLowerCase();
        return email.includes(q) || phone.includes(q);
      });
    }

    // date range filters (createdAtMillis)
    if (fromDate) {
      const fromMs = new Date(fromDate + "T00:00:00").getTime();
      list = list.filter((item) => item.createdAtMillis >= fromMs);
    }

    if (toDate) {
      const toMs = new Date(toDate + "T23:59:59").getTime();
      list = list.filter((item) => item.createdAtMillis <= toMs);
    }

    // follow-up filter
    if (followFilter !== "all") {
      const wantDone = followFilter === "done";
      list = list.filter((item) => !!item.followUpDone === wantDone);
    }

    // ensure sorted by createdAt desc
    list.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
    return list;
  }, [contacts, search, fromDate, toDate, followFilter]);

  // CONTACT pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredContacts.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedContacts = filteredContacts.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleToggleFollowUp = async (item) => {
    const next = !item.followUpDone;
    try {
      await setContactFollowUp(item.id, next);
      setContacts((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, followUpDone: next } : c
        )
      );
    } catch (err) {
      console.error("Error updating follow-up status:", err);
      window.alert("Failed to update follow-up status. Please try again.");
    }
  };

  // ===== TOUR FORMS: filter + sort in memory =====
  const filteredTourForms = useMemo(() => {
    let list = [...tourForms];

    // search by name + email + phone
    const q = tourSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const email = (item.email || "").toLowerCase();
        const phone = (item.phone || "").toLowerCase();
        const name = (item.name || "").toLowerCase();
        return (
          email.includes(q) || phone.includes(q) || name.includes(q)
        );
      });
    }

    // date range filters (createdAtMillis)
    if (tourFromDate) {
      const fromMs = new Date(tourFromDate + "T00:00:00").getTime();
      list = list.filter((item) => item.createdAtMillis >= fromMs);
    }

    if (tourToDate) {
      const toMs = new Date(tourToDate + "T23:59:59").getTime();
      list = list.filter((item) => item.createdAtMillis <= toMs);
    }

    // status filter
    if (tourStatusFilter !== "all") {
      list = list.filter((item) => {
        const followed = !!item.followUpDone;
        const completed = !!item.tripCompleted;

        if (tourStatusFilter === "pending") {
          return !followed && !completed;
        }
        if (tourStatusFilter === "followed") {
          return followed && !completed;
        }
        if (tourStatusFilter === "completed") {
          return completed;
        }
        return true;
      });
    }

    list.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
    return list;
  }, [tourForms, tourSearch, tourFromDate, tourToDate, tourStatusFilter]);

  // TOUR pagination logic
  const tourTotalPages = Math.max(
    1,
    Math.ceil(filteredTourForms.length / tourPageSize)
  );
  const tourCurrentPage = Math.min(tourPage, tourTotalPages);
  const tourStartIndex = (tourCurrentPage - 1) * tourPageSize;
  const pagedTourForms = filteredTourForms.slice(
    tourStartIndex,
    tourStartIndex + tourPageSize
  );

  const handleToggleTourFollowUp = async (item) => {
    const next = !item.followUpDone;
    try {
      await setTourFormFollowUp(item.id, next);
      setTourForms((prev) =>
        prev.map((t) =>
          t.id === item.id ? { ...t, followUpDone: next } : t
        )
      );
    } catch (err) {
      console.error("Error updating tour follow-up:", err);
      window.alert("Failed to update follow-up status. Please try again.");
    }
  };

  const handleToggleTripCompleted = async (item) => {
    const next = !item.tripCompleted;
    try {
      await setTourFormCompleted(item.id, next);
      setTourForms((prev) =>
        prev.map((t) =>
          t.id === item.id ? { ...t, tripCompleted: next } : t
        )
      );
    } catch (err) {
      console.error("Error updating trip status:", err);
      window.alert("Failed to update trip status. Please try again.");
    }
  };

  const handleOpenViewTour = (item) => setViewTour(item);
  const handleCloseViewTour = () => setViewTour(null);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Typography
        sx={{
          fontSize: 32,
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-0.03em",
        }}
      >
        Enquiries
      </Typography>
      <Typography sx={{ mt: 0.6, color: "#64748b", fontWeight: 600 }}>
        View and manage contact and tour enquiries
      </Typography>

      {/* Tabs */}
      <Box sx={{ mt: 2.25 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 42,
            "& .MuiTab-root": {
              minHeight: 42,
              textTransform: "none",
              fontWeight: 600,
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
          <Tab label="Contact" />
          <Tab label="Tour Form" />
        </Tabs>
        <Divider sx={{ mt: 1.25, opacity: 0.6 }} />
      </Box>

      {/* ================= TAB 0: CONTACT ENQUIRIES ================= */}
      {tab === 0 && (
        <>
          {/* Filters bar */}
          <Paper
            elevation={0}
            sx={{
              mt: 2.25,
              p: { xs: 2, md: 2.5 },
              borderRadius: "18px !important",
              border: CARD_BORDER,
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 20px 60px rgba(2, 8, 23, 0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              {/* Search */}
              <Box sx={{ flex: 2 }}>
                <Typography
                  sx={{ fontWeight: 700, color: "#0f172a", mb: 0.8 }}
                >
                  Search
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Search by email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#94a3b8" }} />
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

              {/* Date range */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ flex: 2 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: "#0f172a", mb: 0.8 }}
                  >
                    From
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: "#94a3b8" }} />
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
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: "#0f172a", mb: 0.8 }}
                  >
                    To
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: "#94a3b8" }} />
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
              </Stack>

              {/* Follow-up filter */}
              <Stack
                direction="row"
                spacing={1}
                justifyContent="flex-end"
                sx={{ flex: 1 }}
              >
                <Button
                  size="small"
                  variant={followFilter === "all" ? "contained" : "text"}
                  onClick={() => setFollowFilter("all")}
                  startIcon={<HourglassEmptyIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      followFilter === "all"
                        ? "#e5edff"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  All
                </Button>
                <Button
                  size="small"
                  variant={followFilter === "pending" ? "contained" : "text"}
                  onClick={() => setFollowFilter("pending")}
                  startIcon={<HourglassEmptyIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      followFilter === "pending"
                        ? "rgba(248, 196, 113, 0.25)"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  Pending
                </Button>
                <Button
                  size="small"
                  variant={followFilter === "done" ? "contained" : "text"}
                  onClick={() => setFollowFilter("done")}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      followFilter === "done"
                        ? "rgba(34,197,94,0.18)"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  Done
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* List */}
          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {loading && (
              <Typography sx={{ color: "#64748b" }}>
                Loading enquiries…
              </Typography>
            )}

            {!loading && filteredContacts.length === 0 && (
              <Typography sx={{ color: "#64748b" }}>
                No enquiries found for the selected filters.
              </Typography>
            )}

            {!loading &&
              pagedContacts.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: "16px",
                    border: CARD_BORDER,
                    backgroundColor: "#fff",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    {/* Name + email + phone */}
                    <Box sx={{ flex: 2, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: 16,
                          color: "#0f172a",
                        }}
                      >
                        {item.name || "Unnamed"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ mt: 0.5, flexWrap: "wrap" }}
                      >
                        {item.email && (
                          <Typography
                            sx={{
                              fontSize: 13.5,
                              color: "rgba(15,23,42,0.75)",
                            }}
                          >
                            {item.email}
                          </Typography>
                        )}
                        {item.phone && (
                          <Typography
                            sx={{
                              fontSize: 13.5,
                              color: "rgba(15,23,42,0.75)",
                            }}
                          >
                            • {item.phone}
                          </Typography>
                        )}
                      </Stack>

                      {/* Message preview */}
                      {item.message && (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 13,
                            color: "rgba(15,23,42,0.75)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.message}
                        </Typography>
                      )}
                    </Box>

                    {/* Created date + path */}
                    <Box
                      sx={{
                        flex: 1.3,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "rgba(15,23,42,0.55)",
                        }}
                      >
                        Received
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "rgba(15,23,42,0.85)",
                        }}
                      >
                        {formatDateTime(item.createdAt)}
                      </Typography>

                      {item.path && (
                        <Typography
                          sx={{
                            mt: 0.6,
                            fontSize: 12,
                            color: "rgba(15,23,42,0.65)",
                          }}
                        >
                          Path:{" "}
                          <Box component="span" sx={{ fontFamily: "monospace" }}>
                            {item.path}
                          </Box>
                        </Typography>
                      )}
                    </Box>

                    {/* Follow-up status + toggle */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: { xs: "flex-start", md: "flex-end" },
                        gap: 1,
                      }}
                    >
                      <Chip
                        icon={
                          item.followUpDone ? (
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <HourglassEmptyIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        label={
                          item.followUpDone
                            ? "Follow-up done"
                            : "Pending follow-up"
                        }
                        sx={{
                          fontWeight: 600,
                          bgcolor: item.followUpDone
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(248,196,113,0.18)",
                          color: item.followUpDone ? "#15803d" : "#92400e",
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!item.followUpDone}
                            onChange={() => handleToggleFollowUp(item)}
                            size="small"
                          />
                        }
                        label="Follow-up taken"
                        sx={{
                          mt: 0.5,
                          "& .MuiFormControlLabel-label": {
                            fontSize: 12.5,
                            color: "rgba(15,23,42,0.80)",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              ))}

            {/* Pagination */}
            {!loading && filteredContacts.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  sx={{
                    "& .MuiPagination-ul": { gap: 0.5 },
                  }}
                />
              </Box>
            )}
          </Box>
        </>
      )}

      {/* ================= TAB 1: TOUR FORM ENQUIRIES ================= */}
      {tab === 1 && (
        <>
          {/* Filters bar */}
          <Paper
            elevation={0}
            sx={{
              mt: 2.25,
              p: { xs: 2, md: 2.5 },
              borderRadius: "18px !important",
              border: CARD_BORDER,
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 20px 60px rgba(2, 8, 23, 0.08)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              {/* Search */}
              <Box sx={{ flex: 2 }}>
                <Typography
                  sx={{ fontWeight: 700, color: "#0f172a", mb: 0.8 }}
                >
                  Search
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Search by name, email or phone..."
                  value={tourSearch}
                  onChange={(e) => setTourSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#94a3b8" }} />
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

              {/* Date range */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ flex: 2 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: "#0f172a", mb: 0.8 }}
                  >
                    From
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={tourFromDate}
                    onChange={(e) => setTourFromDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: "#94a3b8" }} />
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
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: "#0f172a", mb: 0.8 }}
                  >
                    To
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={tourToDate}
                    onChange={(e) => setTourToDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: "#94a3b8" }} />
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
              </Stack>

              {/* Status filter */}
              <Stack
                direction="row"
                spacing={1}
                justifyContent="flex-end"
                sx={{ flex: 1 }}
              >
                <Button
                  size="small"
                  variant={tourStatusFilter === "all" ? "contained" : "text"}
                  onClick={() => setTourStatusFilter("all")}
                  startIcon={<HourglassEmptyIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      tourStatusFilter === "all"
                        ? "#e5edff"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  All
                </Button>
                <Button
                  size="small"
                  variant={
                    tourStatusFilter === "pending" ? "contained" : "text"
                  }
                  onClick={() => setTourStatusFilter("pending")}
                  startIcon={<HourglassEmptyIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      tourStatusFilter === "pending"
                        ? "rgba(248,196,113,0.25)"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  Pending
                </Button>
                <Button
                  size="small"
                  variant={
                    tourStatusFilter === "followed" ? "contained" : "text"
                  }
                  onClick={() => setTourStatusFilter("followed")}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      tourStatusFilter === "followed"
                        ? "rgba(34,197,94,0.18)"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  Follow-up
                </Button>
                <Button
                  size="small"
                  variant={
                    tourStatusFilter === "completed" ? "contained" : "text"
                  }
                  onClick={() => setTourStatusFilter("completed")}
                  startIcon={<FlightTakeoffIcon />}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor:
                      tourStatusFilter === "completed"
                        ? "rgba(59,130,246,0.18)"
                        : "rgba(15,23,42,0.02)",
                  }}
                >
                  Completed
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* List */}
          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {loadingTours && (
              <Typography sx={{ color: "#64748b" }}>
                Loading tour enquiries…
              </Typography>
            )}

            {!loadingTours && filteredTourForms.length === 0 && (
              <Typography sx={{ color: "#64748b" }}>
                No tour enquiries found for the selected filters.
              </Typography>
            )}

            {!loadingTours &&
              pagedTourForms.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: "16px",
                    border: CARD_BORDER,
                    backgroundColor: "#fff",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    {/* Name + email + phone */}
                    <Box sx={{ flex: 2, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.25 }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: 16,
                            color: "#0f172a",
                          }}
                        >
                          {item.name || "Unnamed"}
                        </Typography>
                        {item.country && (
                          <Chip
                            size="small"
                            label={item.country}
                            sx={{
                              fontSize: 11,
                              height: 22,
                              bgcolor: "rgba(59,130,246,0.08)",
                              color: "#1d4ed8",
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ mt: 0.25, flexWrap: "wrap" }}
                      >
                        {item.email && (
                          <Typography
                            sx={{
                              fontSize: 13.5,
                              color: "rgba(15,23,42,0.75)",
                            }}
                          >
                            {item.email}
                          </Typography>
                        )}
                        {item.phone && (
                          <Typography
                            sx={{
                              fontSize: 13.5,
                              color: "rgba(15,23,42,0.75)",
                            }}
                          >
                            • {item.phone}
                          </Typography>
                        )}
                      </Stack>

                      {/* Quick info line */}
                      <Typography
                        sx={{
                          mt: 0.8,
                          fontSize: 12.5,
                          color: "rgba(15,23,42,0.80)",
                        }}
                      >
                        Arrival:{" "}
                        <strong>{item.arrivalDate || "Not specified"}</strong>{" "}
                        • Days: <strong>{item.days || "—"}</strong> • Adults:{" "}
                        <strong>{item.adults || "—"}</strong> • Children:{" "}
                        <strong>{item.children || "—"}</strong>
                      </Typography>

                      {/* Info preview */}
                      {item.info && (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: 13,
                            color: "rgba(15,23,42,0.75)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.info}
                        </Typography>
                      )}
                    </Box>

                    {/* Created date */}
                    <Box sx={{ flex: 1.3, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "rgba(15,23,42,0.55)",
                        }}
                      >
                        Received
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "rgba(15,23,42,0.85)",
                        }}
                      >
                        {formatDateTime(item.createdAt)}
                      </Typography>

                      {item.path && (
                        <Typography
                          sx={{
                            mt: 0.6,
                            fontSize: 12,
                            color: "rgba(15,23,42,0.65)",
                          }}
                        >
                          Path:{" "}
                          <Box component="span" sx={{ fontFamily: "monospace" }}>
                            {item.path}
                          </Box>
                        </Typography>
                      )}
                    </Box>

                    {/* Status + toggles + view button */}
                    <Box
                      sx={{
                        flex: 1.4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: { xs: "flex-start", md: "flex-end" },
                        gap: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}
                      >
                        {/* Follow-up chip */}
                        <Chip
                          size="small"
                          icon={
                            item.followUpDone ? (
                              <CheckCircleIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <HourglassEmptyIcon sx={{ fontSize: 16 }} />
                            )
                          }
                          label={
                            item.followUpDone
                              ? "Follow-up done"
                              : "Pending follow-up"
                          }
                          sx={{
                            fontWeight: 600,
                            bgcolor: item.followUpDone
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(248,196,113,0.18)",
                            color: item.followUpDone ? "#15803d" : "#92400e",
                          }}
                        />

                        {/* Trip completed chip */}
                        <Chip
                          size="small"
                          icon={
                            item.tripCompleted ? (
                              <FlightTakeoffIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <HourglassEmptyIcon sx={{ fontSize: 16 }} />
                            )
                          }
                          label={
                            item.tripCompleted
                              ? "Trip completed"
                              : "Trip in progress"
                          }
                          sx={{
                            fontWeight: 600,
                            bgcolor: item.tripCompleted
                              ? "rgba(59,130,246,0.18)"
                              : "rgba(148,163,184,0.18)",
                            color: item.tripCompleted ? "#1d4ed8" : "#475569",
                          }}
                        />
                      </Stack>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!item.followUpDone}
                            onChange={() => handleToggleTourFollowUp(item)}
                            size="small"
                          />
                        }
                        label="Follow-up taken"
                        sx={{
                          mt: 0.5,
                          "& .MuiFormControlLabel-label": {
                            fontSize: 12.5,
                            color: "rgba(15,23,42,0.80)",
                          },
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!item.tripCompleted}
                            onChange={() => handleToggleTripCompleted(item)}
                            size="small"
                          />
                        }
                        label="Trip completed"
                        sx={{
                          mt: -0.5,
                          "& .MuiFormControlLabel-label": {
                            fontSize: 12.5,
                            color: "rgba(15,23,42,0.80)",
                          },
                        }}
                      />

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenViewTour(item)}
                        sx={{
                          mt: 0.5,
                          textTransform: "none",
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        View details
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              ))}

            {/* Pagination */}
            {!loadingTours && filteredTourForms.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Pagination
                  count={tourTotalPages}
                  page={tourCurrentPage}
                  onChange={(_, value) => setTourPage(value)}
                  color="primary"
                  shape="rounded"
                  sx={{
                    "& .MuiPagination-ul": { gap: 0.5 },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* View dialog */}
          <Dialog
            open={!!viewTour}
            onClose={handleCloseViewTour}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle sx={{ fontWeight: 700, color: "#0f172a" }}>
              Tour Enquiry Details
            </DialogTitle>
            <DialogContent dividers>
              {viewTour && (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 600, color: "#0f172a" }}>
                    Contact
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Name:</strong> {viewTour.name || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Email:</strong> {viewTour.email || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Phone:</strong> {viewTour.phone || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Country:</strong> {viewTour.country || "—"}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography sx={{ fontWeight: 600, color: "#0f172a" }}>
                    Trip Details
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Arrival Date:</strong>{" "}
                    {viewTour.arrivalDate || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>No. of Days:</strong> {viewTour.days || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Adults:</strong> {viewTour.adults || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Children:</strong> {viewTour.children || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Accommodation:</strong>{" "}
                    {viewTour.accommodation || "—"}
                  </Typography>

                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Additional Information:</strong>
                    <br />
                    {viewTour.info || "—"}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography sx={{ fontWeight: 600, color: "#0f172a" }}>
                    Meta
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    <strong>Created:</strong>{" "}
                    {formatDateTime(viewTour.createdAt)}
                  </Typography>
                  {viewTour.path && (
                    <Typography sx={{ fontSize: 14 }}>
                      <strong>Path:</strong>{" "}
                      <Box
                        component="span"
                        sx={{ fontFamily: "monospace", fontSize: 13 }}
                      >
                        {viewTour.path}
                      </Box>
                    </Typography>
                  )}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewTour} sx={{ textTransform: "none" }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
