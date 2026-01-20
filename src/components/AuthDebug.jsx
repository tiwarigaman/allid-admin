import React from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";

export default function AuthDebug() {
  const [info, setInfo] = React.useState({
    projectId: "",
    email: "",
    tokenEmail: "",
    uid: "",
    ready: false,
    error: "",
  });

  React.useEffect(() => {
    const auth = getAuth();
    const app = getApp();

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        const projectId = app?.options?.projectId || "";
        if (!user) {
          setInfo({
            projectId,
            email: "",
            tokenEmail: "",
            uid: "",
            ready: true,
            error: "NOT LOGGED IN (user is null)",
          });
          return;
        }

        const token = await user.getIdTokenResult(true);

        setInfo({
          projectId,
          email: user.email || "",
          tokenEmail: token?.claims?.email || "",
          uid: user.uid,
          ready: true,
          error: "",
        });
      } catch (e) {
        setInfo((prev) => ({
          ...prev,
          ready: true,
          error: String(e?.message || e),
        }));
      }
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Auth Debug</div>
      {!info.ready ? (
        <div>Loading auth…</div>
      ) : (
        <>
          <div><b>projectId:</b> {info.projectId || "-"}</div>
          <div><b>user.email:</b> {info.email || "-"}</div>
          <div><b>token email:</b> {info.tokenEmail || "-"}</div>
          <div><b>uid:</b> {info.uid || "-"}</div>
          {info.error ? <div style={{ color: "crimson", marginTop: 8 }}><b>Error:</b> {info.error}</div> : null}
        </>
      )}
    </div>
  );
}
