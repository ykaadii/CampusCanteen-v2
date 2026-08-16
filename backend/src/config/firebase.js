import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app = null;

try {
  let serviceAccount = null;

  // Method 1: Environment variable FIREBASE_SERVICE_ACCOUNT_JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Method 2: Local uploaded JSON file (firebase-service-account.json or firebase-service-account..json)
    const possiblePaths = [
      path.join(__dirname, "../../firebase-service-account.json"),
      path.join(__dirname, "../../firebase-service-account..json"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p, "utf-8");
        serviceAccount = JSON.parse(fileContent);
        console.log(`[Firebase Admin] Successfully loaded service account from: ${path.basename(p)}`);
        break;
      }
    }
  }

  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log(`[Firebase Admin] Initialized successfully for project: ${serviceAccount.project_id}`);
  } else {
    console.warn("[Firebase Admin] No service account configured (FIREBASE_SERVICE_ACCOUNT_JSON or file). Push notifications will log in dev mode.");
  }
} catch (err) {
  console.error("[Firebase Admin] Initialization error:", err.message);
}

// Sends a push notification to a single device token, e.g. "Your order Token #14 is ready for pickup!"
export async function sendPushNotification(token, { title, body }) {
  if (!app || !token) {
    console.warn(`[FCM DEV LOG] Push notification to token: "${token}" | Title: "${title}" | Body: "${body}"`);
    return null;
  }

  try {
    const response = await admin.messaging().send({
      token,
      notification: { title, body },
    });
    console.log(`[FCM Push] Notification sent successfully. MessageID: ${response}`);
    return response;
  } catch (err) {
    console.warn("[FCM Push] Send notification failed:", err.message);
    return null;
  }
}
