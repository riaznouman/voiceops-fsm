interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendExpoPush(message: ExpoPushMessage): Promise<void> {
  if (!message.to || !message.to.startsWith("ExponentPushToken[")) {
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
  };
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...message, sound: message.sound ?? "default" }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[expo-push] send failed", res.status, text);
    }
  } catch (err) {
    console.error("[expo-push] network error", err);
  }
}
