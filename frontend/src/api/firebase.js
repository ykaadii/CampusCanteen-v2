import { api } from "./axios";

export async function requestWebNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notifications.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Register token (mock or Web Push Subscription token)
      const token = `web_push_token_${Date.now()}`;
      await api.patch("/admin/fcm-token", { fcmToken: token });
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Notification permission request error:", err.message);
    return false;
  }
}
