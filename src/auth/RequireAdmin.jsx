import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { ADMIN_EMAILS } from "./adminEmails";

export default function RequireAdmin({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return null;

  if (!user) return <Navigate to="/login" />;

  if (!ADMIN_EMAILS.includes(user.email))
    return <Navigate to="/login" />;

  return children;
}
