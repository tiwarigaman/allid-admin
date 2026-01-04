import React from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

const cardShadow = "0 18px 44px rgba(15, 23, 42, 0.08)";
const softBorder = "1px solid rgba(15, 23, 42, 0.06)";

const cardSX = {
  borderRadius: "24px",
  border: softBorder,
  boxShadow: cardShadow,
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
};

function StatCard({ title, value, delta, icon, iconBg }) {
  return (
    <Paper sx={{ ...cardSX, p: { xs: 2, md: 2.4 }, minHeight: 120 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontSize: 13.1, fontWeight: 700, color: "rgba(15,23,42,0.52)" }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.9,
              fontSize: 32,
              fontWeight: 850,
              letterSpacing: "-0.03em",
              color: "#0F172A",
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 1,
              mt: 0.9,
            }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 900, color: "#16A34A" }}
            >
              {delta}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 650,
                color: "rgba(15,23,42,0.52)",
              }}
            >
              vs last month
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "999px",
            bgcolor: iconBg,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            boxShadow: "0 18px 30px rgba(15,23,42,0.14)",
            flex: "0 0 auto",
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

function QuickAction({ bg, iconBg, icon, title, sub }) {
  return (
    <Box
      sx={{
        borderRadius: "22px",
        bgcolor: bg,
        px: 2,
        py: 1.45,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "999px",
          bgcolor: iconBg,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          flex: "0 0 auto",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 14.4, fontWeight: 850, color: "#0F172A" }}
          noWrap
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: 13.2,
            fontWeight: 650,
            color: "rgba(15,23,42,0.52)",
            mt: 0.2,
          }}
          noWrap
        >
          {sub}
        </Typography>
      </Box>

      <IconButton sx={{ color: "rgba(15,23,42,0.52)" }}>
        <ChevronRightRoundedIcon />
      </IconButton>
    </Box>
  );
}

const PublishedChip = () => (
  <Chip
    label="published"
    size="small"
    sx={{
      height: 26,
      px: 0.7,
      fontSize: 12.2,
      borderRadius: "999px",
      bgcolor: "rgba(22,163,74,0.14)",
      color: "#15803D",
      fontWeight: 850,
    }}
  />
);

function ListRow({ icon, title, sub, showChip = false }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.6, py: 1.25 }}>
      <Avatar
        variant="rounded"
        sx={{
          width: 46,
          height: 46,
          borderRadius: "16px",
          bgcolor: "rgba(15,23,42,0.08)",
          color: "rgba(15,23,42,0.55)",
          flex: "0 0 auto",
        }}
      >
        {icon}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 14.4, fontWeight: 850, color: "#0F172A" }}
          noWrap
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: 13.2,
            fontWeight: 650,
            color: "rgba(15,23,42,0.52)",
            mt: 0.15,
          }}
          noWrap
        >
          {sub}
        </Typography>
      </Box>

      {showChip && <PublishedChip />}
    </Box>
  );
}

export default function Dashboard() {
  const [range, setRange] = React.useState("7");

  const tours = [
    { title: "Golden Triangle Adventure", sub: "Delhi, Agra, Jaipur" },
    { title: "Kerala Backwaters Cruise", sub: "Alleppey, Kumarakom" },
    { title: "Himalayan Trek Adventure", sub: "Manali, Rohtang Pass" },
    { title: "Rajasthan Desert Safari", sub: "Jaisalmer, Jodhpur" },
    { title: "Goa Beach Paradise", sub: "North & South Goa" },
  ];

  const blogs = [
    {
      title: "10 Hidden Gems of Rajasthan You Must Visit",
      sub: "15/01/2024",
    },
    {
      title: "Kerala Backwaters: A Complete Travel Guide",
      sub: "10/01/2024",
    },
    {
      title: "Himalayan Trekking: Essential Tips for Beginners",
      sub: "05/01/2024",
    },
    {
      title: "Goa Beyond Beaches: Cultural Experiences",
      sub: "28/12/2023",
    },
    {
      title: "Best Time to Visit Different Regions of India",
      sub: "20/12/2023",
    },
  ];

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: { xs: 2, md: 2.4 },
        }}
      >
        <Box sx={{ minWidth: 240 }}>
          <Typography
            sx={{
              fontSize: { xs: 24, sm: 28, md: 32 },
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0F172A",
              lineHeight: 1.12,
            }}
          >
            Dashboard Overview
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              fontSize: 14.4,
              fontWeight: 650,
              color: "rgba(15,23,42,0.52)",
            }}
          >
            Welcome back! Here's what's happening with your travel business.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.2, mt: 0.8, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{
              height: 44,
              borderRadius: "999px",
              fontWeight: 850,
              color: "#2563EB",
              borderColor: "rgba(37,99,235,0.40)",
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
              px: 2.1,
              "&:hover": {
                borderColor: "rgba(37,99,235,0.60)",
                background: "rgba(255,255,255,0.95)",
              },
            }}
          >
            Export Data
          </Button>

          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            sx={{
              height: 44,
              borderRadius: "999px",
              fontWeight: 850,
              bgcolor: "#16A34A",
              px: 2.1,
              "&:hover": { bgcolor: "#15803D" },
              boxShadow: "0 18px 40px rgba(22,163,74,0.18)",
            }}
          >
            Add New Tour
          </Button>
        </Box>
      </Box>

      {/* Stat cards */}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.6, md: 2 },
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          mb: { xs: 1.8, md: 2.2 },
        }}
      >
        <StatCard
          title="Total Tours"
          value="6"
          delta="+12%"
          icon={<MapOutlinedIcon />}
          iconBg="#1E88E5"
        />
        <StatCard
          title="Published Tours"
          value="6"
          delta="+8%"
          icon={<VisibilityOutlinedIcon />}
          iconBg="#15803D"
        />
        <StatCard
          title="Total Blogs"
          value="6"
          delta="+15%"
          icon={<ArticleOutlinedIcon />}
          iconBg="#7C3AED"
        />
        <StatCard
          title="Enquiries"
          value="24"
          delta="+5%"
          icon={<MailOutlineOutlinedIcon />}
          iconBg="#F97316"
        />
      </Box>

      {/* Revenue + Quick actions */}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.6, md: 2 },
          gridTemplateColumns: { xs: "1fr", lg: "1.55fr 1fr" },
          alignItems: "stretch",
          mb: { xs: 1.8, md: 2.2 },
        }}
      >
        <Paper sx={{ ...cardSX, p: { xs: 2, md: 2.4 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              sx={{ fontSize: 17.4, fontWeight: 900, color: "#0F172A" }}
            >
              Revenue Overview
            </Typography>

            <Select
              size="small"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              sx={{
                height: 40,
                borderRadius: "999px",
                fontWeight: 850,
                minWidth: 150,
                background: "rgba(255,255,255,0.88)",
                "& .MuiSelect-select": { py: 0.8 },
              }}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
            </Select>
          </Box>

          <Box
            sx={{
              mt: 2,
              height: { xs: 260, md: 320 },
              borderRadius: "22px",
              border: "1px solid rgba(34,197,94,0.18)",
              background:
                "radial-gradient(520px 380px at 50% 35%, rgba(34,197,94,0.22), transparent 65%), linear-gradient(180deg, rgba(34,197,94,0.10), rgba(34,197,94,0.05))",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "inline-flex",
                  gap: 0.7,
                  alignItems: "flex-end",
                  mb: 1.2,
                }}
              >
                <Box
                  sx={{
                    width: 5,
                    height: 14,
                    bgcolor: "#16A34A",
                    borderRadius: 4,
                  }}
                />
                <Box
                  sx={{
                    width: 5,
                    height: 24,
                    bgcolor: "#16A34A",
                    borderRadius: 4,
                  }}
                />
                <Box
                  sx={{
                    width: 5,
                    height: 18,
                    bgcolor: "#16A34A",
                    borderRadius: 4,
                  }}
                />
              </Box>

              <Typography
                sx={{ fontWeight: 900, fontSize: 16.8, color: "#0F172A" }}
              >
                Revenue chart visualization
              </Typography>
              <Typography
                sx={{
                  mt: 0.7,
                  fontWeight: 650,
                  color: "rgba(15,23,42,0.52)",
                  fontSize: 14.1,
                }}
              >
                Chart component would be integrated here
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ ...cardSX, p: { xs: 2, md: 2.4 } }}>
          <Typography
            sx={{ fontSize: 17.4, fontWeight: 900, color: "#0F172A", mb: 1.6 }}
          >
            Quick Actions
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <QuickAction
              bg="rgba(22,163,74,0.10)"
              iconBg="#16A34A"
              icon={<AddOutlinedIcon />}
              title="Add New Tour"
              sub="Create a new tour package"
            />
            <QuickAction
              bg="rgba(37,99,235,0.10)"
              iconBg="#2563EB"
              icon={<ArticleOutlinedIcon />}
              title="Write Blog"
              sub="Create new blog post"
            />
            <QuickAction
              bg="rgba(249,115,22,0.10)"
              iconBg="#F97316"
              icon={<MailOutlineOutlinedIcon />}
              title="View Enquiries"
              sub="Check customer messages"
            />
          </Box>
        </Paper>
      </Box>

      {/* Recent lists */}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.6, md: 2 },
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
      >
        <Paper sx={{ ...cardSX, p: { xs: 2, md: 2.4 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.1,
            }}
          >
            <Typography
              sx={{ fontSize: 17.4, fontWeight: 900, color: "#0F172A" }}
            >
              Recent Tours
            </Typography>
            <Button sx={{ height: 34, fontWeight: 900, color: "#16A34A" }}>
              View All
            </Button>
          </Box>

          {tours.map((t, idx) => (
            <React.Fragment key={t.title}>
              <ListRow
                icon={<MapOutlinedIcon fontSize="small" />}
                title={t.title}
                sub={t.sub}
                showChip
              />
              {idx !== tours.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Paper>

        <Paper sx={{ ...cardSX, p: { xs: 2, md: 2.4 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.1,
            }}
          >
            <Typography
              sx={{ fontSize: 17.4, fontWeight: 900, color: "#0F172A" }}
            >
              Recent Blogs
            </Typography>
            <Button sx={{ height: 34, fontWeight: 900, color: "#16A34A" }}>
              View All
            </Button>
          </Box>

          {blogs.map((b, idx) => (
            <React.Fragment key={b.title}>
              <ListRow
                icon={<ArticleOutlinedIcon fontSize="small" />}
                title={b.title}
                sub={b.sub}
                showChip
              />
              {idx !== blogs.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}
