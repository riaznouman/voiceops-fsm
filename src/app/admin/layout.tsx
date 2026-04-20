import type { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";
import "./admin.css";

export const metadata: Metadata = {
  title: "VoiceOps Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
