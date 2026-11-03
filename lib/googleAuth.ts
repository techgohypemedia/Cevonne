"use client";

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Dynamically loads the official Google Identity Services script safely.
 * Polls smoothly for up to 4 seconds so slower networks never fail prematurely.
 */
export const loadGoogleScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.google?.accounts) return resolve(true);

    let script = document.getElementById("google-gsi-client") as HTMLScriptElement | null;

    const checkReady = (attempts = 0) => {
      if (window.google?.accounts) {
        return resolve(true);
      }
      if (attempts >= 40) {
        // 40 attempts * 100ms = 4 seconds max
        return resolve(false);
      }
      setTimeout(() => checkReady(attempts + 1), 100);
    };

    if (!script) {
      script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", () => checkReady(), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });

    checkReady();
  });
};

/**
 * Triggers Google Sign-In.
 * If Google script is allowed -> opens native Google popup.
 * If Google script is blocked by an Ad-Blocker -> redirects seamlessly to Google OAuth URL without failing!
 */
export const triggerGoogleSignIn = async (
  onSuccess: (payload: { accessToken?: string; credential?: string }) => Promise<void>,
  onError: (error: string) => void,
  onCancel?: () => void
) => {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "464373232800-fpsftbddppnkhbqbkb0v6rvqja85c7eg.apps.googleusercontent.com";

  if (!clientId || clientId.trim() === "") {
    onError(
      "Google Client ID is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env file."
    );
    return;
  }

  const isLoaded = await loadGoogleScript();

  // If blocked by Ad-Blocker or script didn't evaluate, use direct OAuth redirect
  if (!isLoaded || !window.google?.accounts?.oauth2) {
    if (typeof window !== "undefined") {
      const redirectUri = `${window.location.origin}/login`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId.trim()
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=openid%20email%20profile&prompt=select_account`;

      window.location.href = authUrl;
      return;
    }
    onError("Unable to connect to Google. Please check your network.");
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: "openid email profile",
      callback: async (tokenResponse: any) => {
        if (tokenResponse?.error) {
          if (tokenResponse.error === "popup_closed_by_user") {
            onCancel?.();
            return;
          }
          onError(
            tokenResponse.error_description ||
              tokenResponse.error ||
              "Google sign-in was cancelled."
          );
          return;
        }

        if (tokenResponse?.access_token) {
          await onSuccess({ accessToken: tokenResponse.access_token });
        } else {
          onError("No access token received from Google.");
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err: any) {
    onError(err?.message || "Failed to initialize Google Sign-In.");
  }
};
