"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Loader2 } from "lucide-react";

type CallState = "idle" | "connecting" | "active" | "ended";

interface VoiceCallButtonProps {
  customerName?: string;
}

interface VapiInstance {
  start: (assistantId: string, opts?: { variableValues?: Record<string, unknown> }) => Promise<unknown>;
  stop: () => void;
  on: (event: string, handler: (data?: unknown) => void) => void;
}

export default function VoiceCallButton({ customerName }: VoiceCallButtonProps) {
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<VapiInstance | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  useEffect(() => {
    return () => {
      const vapi = vapiRef.current;
      if (vapi) {
        try {
          vapi.stop();
        } catch {
          // ignore — call may already be over
        }
      }
    };
  }, []);

  async function startCall() {
    if (!publicKey || !assistantId) {
      setError("Voice agent is not configured on this site.");
      console.error("[VAPI:web] missing env vars", {
        hasPublicKey: !!publicKey,
        hasAssistantId: !!assistantId,
      });
      return;
    }
    setError(null);
    setState("connecting");
    console.log("[VAPI:web] starting call", { assistantId, customerName });
    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(publicKey) as unknown as VapiInstance;
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        console.log("[VAPI:web] call-start");
        setState("active");
      });
      vapi.on("call-end", () => {
        console.log("[VAPI:web] call-end");
        setState("ended");
        setTimeout(() => setState("idle"), 3000);
      });
      vapi.on("speech-start", () => console.log("[VAPI:web] assistant speech-start"));
      vapi.on("speech-end", () => console.log("[VAPI:web] assistant speech-end"));
      vapi.on("message", (msg) => console.log("[VAPI:web] message", msg));
      vapi.on("error", (e) => {
        console.error("[VAPI:web] error", e);
        const err = e as { message?: string };
        setError(err?.message ?? "Voice call error");
        setState("idle");
      });

      const startOptions = customerName
        ? { variableValues: { customerName } }
        : undefined;
      await vapi.start(assistantId, startOptions);
    } catch (err) {
      console.error("[VAPI:web] start failed", err);
      setError(err instanceof Error ? err.message : String(err));
      setState("idle");
    }
  }

  function endCall() {
    const vapi = vapiRef.current;
    if (vapi) {
      console.log("[VAPI:web] user ended call");
      vapi.stop();
    }
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">
            Speak to our voice agent
          </h2>
          <p className="mt-1 max-w-md text-sm text-gray-600">
            Need to book a service or check on a job? Talk to our AI receptionist
            right from your browser — no phone call needed.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {state === "ended" && !error && (
            <p className="mt-2 text-sm text-gray-500">
              Call ended. You can call again any time.
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {state === "idle" || state === "ended" ? (
            <button
              onClick={startCall}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Phone className="h-4 w-4" />
              Call agent
            </button>
          ) : (
            <button
              onClick={endCall}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              {state === "connecting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <PhoneOff className="h-4 w-4" />
                  End call
                </>
              )}
            </button>
          )}
          {state === "active" && (
            <span className="flex items-center gap-2 text-xs font-medium text-green-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              On call
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
