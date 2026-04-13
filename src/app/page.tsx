import { PAGE_NAVIGATOR } from "@/utls/navigator";
import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">VoiceOps</h1>
          <Link
            href={PAGE_NAVIGATOR.LOGIN}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Voice Receptionist &<br />
            Field Service Management
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Automate inbound calls, manage work orders, dispatch technicians,
            and streamline your field service operations — all in one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded text-sm font-medium hover:bg-blue-700"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded text-sm font-medium hover:bg-gray-100"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 text-lg">📞</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              AI Voice Receptionist
            </h3>
            <p className="text-sm text-gray-600">
              Never miss a customer call. Our AI handles inbound calls,
              collects job details, and schedules appointments automatically.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 text-lg">📋</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Work Order Management
            </h3>
            <p className="text-sm text-gray-600">
              Create, assign, and track work orders from start to finish.
              Real-time status updates keep everyone in the loop.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 text-lg">🔧</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Technician Dispatch
            </h3>
            <p className="text-sm text-gray-600">
              Assign the right technician based on skills, location, and
              availability. Track field workers in real time.
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mt-16 bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Project Status</p>
          <p className="text-base font-medium text-gray-800">
            Sprint 0 — Planning & Setup (Week 2)
          </p>
          <p className="text-sm text-gray-500 mt-1">
            COIT20273 — Software Design and Development Project — CQUniversity
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          VoiceOps — Group 1 — Nouman Riaz, Bishal Pandey, Mehran Abbas
        </div>
      </footer>
    </div>
  );
}
