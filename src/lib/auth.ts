// src/lib/auth.ts

import { initializeServerApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { cookies } from "next/headers"; // Next.js utility for accessing request cookies

// Import your existing Firebase configuration
import { firebaseConfig } from "./firebase";

// Define the shape of your session object
// Add any other properties you expect from the user's session or custom claims
export type AppSession = {
  uid: string;
  email: string | null;
  role?: string; // Assuming 'role' is a custom claim you set for users
  // Add other fields from ID token or custom claims as needed, e.g., displayName, photoURL
};

/**
 * Retrieves the user's session data from the Firebase Auth ID token
 * on the server-side.
 *
 * This function is designed to be used in Next.js server components or API routes.
 * It reads the '__session' cookie (which is typically set by Firebase client-side
 * authentication on successful login) and uses it to initialize a server-side
 * Firebase App instance.
 *
 * @returns {Promise<AppSession | null>} A Promise that resolves to the user's
 * session data if authenticated, or null if not authenticated or an error occurs.
 */
export async function getSession(): Promise<AppSession | null> {
  try {
    // Attempt to retrieve the Firebase Auth ID token from the '__session' cookie.
    // Firebase client-side SDK often stores the ID token in a cookie named '__session'.
    const authIdToken = cookies().get("__session")?.value;

    if (!authIdToken) {
      console.log("No Firebase session cookie found.");
      return null;
    }

    // Initialize a server-side Firebase App instance using the project config
    // and the retrieved ID token. This allows server-side verification of the token.
    const serverApp = initializeServerApp(firebaseConfig, {
      authIdToken: authIdToken,
    });

    // Get the Auth instance for this server-side app
    const auth = getAuth(serverApp);

    // Wait for the authentication state to be ready.
    // This will verify the ID token. If the token is invalid or expired,
    // auth.currentUser will be null after this.
    await auth.authStateReady();

    if (auth.currentUser) {
      // If a current user exists (meaning the ID token was valid),
      // fetch their ID token result to get custom claims (like 'role').
      const idTokenResult = await auth.currentUser.getIdTokenResult();

      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        // Safely access custom claims. Ensure 'role' is set as a custom claim
        // when you create or update users in Firebase Authentication.
        role: idTokenResult.claims.role as string,
        // Add other claims as needed, e.g., displayName: idTokenResult.claims.name as string
      };
    } else {
      console.log("Firebase ID token was invalid or expired.");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving session in getSession:", error);
    return null;
  }
}
