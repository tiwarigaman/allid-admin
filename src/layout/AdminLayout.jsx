import React, { useMemo, useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

const drawerWidth = 280;

const navLinkSx = (active) => ({
  borderRadius: "14px",
  mx: 1.5,
  my: 0.6,
  py: 1.3,
  px: 1.4,
  gap: 1.2,
  color: active ? "#fff" : "#0f172a",
  background: active
    ? "linear-gradient(180deg,#2F76FF 0%, #0B63F6 100%)"
    : "transparent",
  boxShadow: active ? "0 18px 36px rgba(11,99,246,0.25)" : "none",
  "&:hover": {
    background: active
      ? "linear-gradient(180deg,#2F76FF 0%, #0B63F6 100%)"
      : "rgba(15, 23, 42, 0.04)",
  },
});

function SidebarContent({ onNavigate }) {
  const location = useLocation();
  const [openCat, setOpenCat] = useState(true);

  const isActive = (path) => location.pathname.startsWith(path);

  return (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    {/* Brand ... */}
<Box
        sx={{
          px: 2.25,
          pt: 2.25,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: "#1677ff",
            fontWeight: 800,
            boxShadow: "0 16px 30px rgba(22,119,255,0.25)",
          }}
        >
          T
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 18,
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            Travel Admin
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.2 }}>
            Management Panel
          </Typography>
        </Box>
      </Box>
    {/* Nav items */}
    <List sx={{ px: 0, pt: 1.25 }}>
      {/* Dashboard */}
      <ListItemButton
        component={NavLink}
        to="/dashboard"
        onClick={onNavigate}
        sx={navLinkSx(isActive("/dashboard"))}
      >
        <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
          <DashboardOutlinedIcon />
        </ListItemIcon>
        <ListItemText
          primary="Dashboard"
          primaryTypographyProps={{ fontWeight: 700 }}
        />
      </ListItemButton>

      {/* Tours */}
      <ListItemButton
        component={NavLink}
        to="/tours"
        onClick={onNavigate}
        sx={navLinkSx(isActive("/tours"))}
      >
        <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
          <MapOutlinedIcon />
        </ListItemIcon>
        <ListItemText
          primary="Tours"
          primaryTypographyProps={{ fontWeight: 700 }}
        />
      </ListItemButton>

      {/* Blogs */}
      <ListItemButton
        component={NavLink}
        to="/blogs"
        onClick={onNavigate}
        sx={navLinkSx(isActive("/blogs"))}
      >
        <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
          <ArticleOutlinedIcon />
        </ListItemIcon>
        <ListItemText
          primary="Blogs"
          primaryTypographyProps={{ fontWeight: 700 }}
        />
      </ListItemButton>

      {/* Categories accordion (still same, just paths changed) */}
      <ListItemButton
        onClick={() => setOpenCat((s) => !s)}
        sx={{
          borderRadius: "14px",
          mx: 1.5,
          my: 0.6,
          py: 1.25,
          px: 1.4,
          "&:hover": { background: "rgba(15, 23, 42, 0.04)" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 38 }}>
          <CategoryOutlinedIcon />
        </ListItemIcon>
        <ListItemText
          primary="Categories"
          primaryTypographyProps={{ fontWeight: 800 }}
        />
        {openCat ? (
          <KeyboardArrowDownRoundedIcon />
        ) : (
          <KeyboardArrowRightRoundedIcon />
        )}
      </ListItemButton>

      <Collapse in={openCat} timeout="auto" unmountOnExit>
        <Box sx={{ px: 1.5, pt: 0.25 }}>
          <ListItemButton
            component={NavLink}
            to="categories/tours"
            onClick={onNavigate}
            sx={{
              borderRadius: "12px",
              mx: 1,
              my: 0.4,
              py: 1.1,
              px: 1.2,
              color: isActive("categories/tours") ? "#0B63F6" : "#0f172a",
              background: isActive("/categories/tour")
                ? "rgba(11,99,246,0.08)"
                : "transparent",
              "&:hover": { background: "rgba(15, 23, 42, 0.04)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
              <CategoryOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Tour Categories"
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>

          <ListItemButton
            component={NavLink}
            to="categories/tours"
            onClick={onNavigate}
            sx={{
              borderRadius: "12px",
              mx: 1,
              my: 0.4,
              py: 1.1,
              px: 1.2,
              color: isActive("categories/tours") ? "#0B63F6" : "#0f172a",
              background: isActive("categories/tours")
                ? "rgba(11,99,246,0.08)"
                : "transparent",
              "&:hover": { background: "rgba(15, 23, 42, 0.04)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
              <CategoryOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Blog Categories"
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>
        </Box>
      </Collapse>

      {/* Enquiries */}
      <ListItemButton
        component={NavLink}
        to="/enquiries"
        onClick={onNavigate}
        sx={navLinkSx(isActive("/enquiries"))}
      >
        <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
          <MailOutlineIcon />
        </ListItemIcon>
        <ListItemText
          primary="Enquiries"
          primaryTypographyProps={{ fontWeight: 700 }}
        />
      </ListItemButton>
    </List>

    {/* bottom user card stays the same */}
  </Box>
);
}

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const userMenuOpen = Boolean(userMenuAnchor);

  const location = useLocation();
  const contentRef = useRef(null); // 👈 scroll container

  // ✅ scroll to top of the content area on every route change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  const today = useMemo(() => {
    try {
      return new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, []);

  const toggleDrawer = () => setMobileOpen((s) => !s);

  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        backgroundColor: "#ffffff",
        borderRight: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <SidebarContent onNavigate={() => isMobile && setMobileOpen(false)} />
    </Box>
  );

  return (
    <Box
      sx={{
        height: "100vh",
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(27,99,255,0.10), transparent 55%), radial-gradient(1000px 700px at 70% 65%, rgba(22,163,74,0.08), transparent 60%), #F6F7FB",
        display: "flex",
        overflow: "hidden", // window scroll disable, inner scroll only
      }}
    >
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          PaperProps={{
            sx: {
              width: drawerWidth,
              borderRight: "1px solid rgba(15,23,42,0.08)",
              background: "#fff",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main column (app bar + scrollable content) */}
      {/* <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      > */}
        <Box
        component="main"
        sx={{
            flex: 1,
            minWidth: 0,
            // pt: "92px",
            // px: { sm: 1.8, md: 2.4 },
            pb: 3,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            // ✅ ADD THIS LINE
            ml: { lg: `${drawerWidth}px` },
            overflow: "hidden",
        }}
        >

        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: "rgba(255,255,255,0.86)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {isMobile && (
              <IconButton onClick={toggleDrawer}>
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1.1,
                color: "#64748b",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                {today}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Search */}
            <Paper
              elevation={0}
              sx={{
                width: { xs: 220, sm: 420, md: 520 },
                px: 1.6,
                py: 0.9,
                borderRadius: "999px",
                border: "1px solid rgba(15,23,42,0.10)",
                backgroundColor: "rgba(255,255,255,0.90)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SearchRoundedIcon sx={{ color: "#94a3b8" }} />
              <InputBase
                placeholder="Search..."
                sx={{ flex: 1, fontSize: 14.5 }}
              />
            </Paper>

            {/* Notifications */}
            <IconButton>
              <Badge badgeContent={3} color="error">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>

            {/* User dropdown */}
            <Paper
              elevation={0}
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                cursor: "pointer",
                pl: 1,
                pr: 1.2,
                py: 0.7,
                borderRadius: "999px",
                border: "2px solid rgba(11,99,246,0.25)",
                background: "rgba(255,255,255,0.92)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { background: "#fff" },
              }}
            >
              <Avatar
                sx={{ width: 38, height: 38, bgcolor: "#1677ff", fontWeight: 900 }}
              >
                A
              </Avatar>
              <Box sx={{ lineHeight: 1.05 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 14,
                    color: "#0f172a",
                  }}
                >
                  Admin User
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Administrator
                </Typography>
              </Box>
              <KeyboardArrowDownRoundedIcon sx={{ color: "#475569" }} />
            </Paper>

            <Menu
              anchorEl={userMenuAnchor}
              open={userMenuOpen}
              onClose={() => setUserMenuAnchor(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 3,
                  border: "1px solid rgba(15,23,42,0.08)",
                  minWidth: 220,
                  overflow: "hidden",
                },
              }}
            >
              <MenuItem onClick={() => setUserMenuAnchor(null)}>
                <ListItemIcon>
                  <SettingsOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Profile Settings
              </MenuItem>
              <MenuItem onClick={() => setUserMenuAnchor(null)}>
                <ListItemIcon>
                  <TuneOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Preferences
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => setUserMenuAnchor(null)}
                sx={{ color: "#ef4444", fontWeight: 800 }}
              >
                <ListItemIcon sx={{ color: "#ef4444" }}>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Scrollable main content */}
        <Box
          ref={contentRef}
          sx={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            px: { xs: 1.8, md: 3 },
            pt: { xs: 4, md: 5 },
            pb: { xs: 3, md: 4 },
            display: "flex",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 1240 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
