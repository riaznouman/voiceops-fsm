import Link from "next/link";
import HeaderAuth from "@/components/header-auth";
import CustomerNav from "@/components/customer/customer-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            VoiceOps
          </Link>
          <HeaderAuth />
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <CustomerNav />
      </div>
      <main className="max-w-5xl mx-auto px-6 pb-10">{children}</main>
    </div>
  );
}
