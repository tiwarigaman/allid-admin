import React from "react";
import { getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export default function FirestoreDebug() {
  const app = getApp();
  const db = getFirestore(app);

  const info = {
    projectId: app?.options?.projectId,
    authDomain: app?.options?.authDomain,
    // Firestore internal strings (works in most builds)
    host: db?._delegate?._databaseId?.projectId || db?._databaseId?.projectId,
    database: db?._delegate?._databaseId?.database || db?._databaseId?.database,
  };

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Firestore Debug</div>
      <div><b>app.projectId:</b> {String(info.projectId)}</div>
      <div><b>app.authDomain:</b> {String(info.authDomain)}</div>
      <div><b>db.projectId:</b> {String(info.host || "-")}</div>
      <div><b>db.database:</b> {String(info.database || "-")}</div>
    </div>
  );
}
