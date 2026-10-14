// context/AuthContext.js (mobile)

import { useRouter } from "expo-router";
import { createContext, useEffect, useState } from "react";
import { showToast } from "@/lib/toast";
import { captureClientError } from "@/lib/monitoring";
import { useSession, authClient, authenticatedFetch } from "@/lib/auth-client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Session Better Auth : identique au pattern web, aucun state user dupliqué
  const { data: session, refetch: refetchSession } = useSession();
  const sessionUser = session?.user ?? null;

  // Favoris optimistes séparés de la session (même logique que le web)
  const [optimisticFavorites, setOptimisticFavorites] = useState(null);

  useEffect(() => {
    setOptimisticFavorites(null);
  }, [sessionUser?.favorites]);

  // Garde défensive supplémentaire côté client (en plus du fix serveur dans
  // lib/auth.js) : au cas où "favorites" arriverait encore comme string ou
  // comme valeur non-array, par ex. pendant un court instant après inscription.
  const safeSessionFavorites = Array.isArray(sessionUser?.favorites)
    ? sessionUser.favorites
    : [];

  const user = sessionUser
    ? {
        ...sessionUser,
        favorites: optimisticFavorites ?? safeSessionFavorites,
      }
    : null;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  const router = useRouter();

  /**
   * Force un refetch de la session en bypassant le cookieCache
   */
  const forceRefreshSession = async () => {
    try {
      await authClient.getSession({ query: { disableCookieCache: true } });
      await refetchSession();
    } catch (err) {
      console.warn("[AuthContext] Failed to refresh session:", err);
    }
  };

  /**
   * Met à jour le profil utilisateur
   * Route mobile : /api/v1/me/update (équivalent de /api/auth/me/update côté web)
   */
  const updateProfile = async ({ phone, address }) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        phone: phone.trim(),
        address,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/me/update", {
          method: "PUT",
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "";
        switch (res.status) {
          case 400:
            if (data.errors) {
              const firstErrorKey = Object.keys(data.errors)[0];
              errorMessage =
                data.errors[firstErrorKey] || "Données de profil invalides";
            } else {
              errorMessage = data.message || "Données de profil invalides";
            }
            break;
          case 401:
            errorMessage = "Session expirée. Veuillez vous reconnecter";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 429:
            errorMessage = "Trop de tentatives. Réessayez plus tard.";
            break;
          default:
            errorMessage = data.message || "Erreur lors de la mise à jour";
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        const isCritical = res.status === 401;
        console.error(httpError, "AuthContext", "updateProfile", isCritical);

        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      if (data.success && data.data?.updatedUser) {
        showToast("Profil mis à jour avec succès!");
        await forceRefreshSession();
        setUpdated(true);

        const sessionUpdated = res.headers.get("X-Session-Updated");

        return { success: true, sessionUpdated };
      }

      return { success: false, error: "Réponse inattendue du serveur" };
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps");
        console.error(error, "AuthContext", "updateProfile", false);
      } else {
        setError("Problème de connexion. Vérifiez votre connexion.");
        console.error(error, "AuthContext", "updateProfile", true);
      }

      console.error("Profile update error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour le mot de passe via le client Better Auth directement
   * (pas de fetch manuel : authClient gère déjà le cookie/la session).
   *
   * CORRECTIF (absent du fichier source web) : la version web ne renvoyait
   * jamais de valeur de succès/échec, ce qui empêchait l'UI de savoir si
   * l'opération avait réussi — même bug déjà rencontré et corrigé dans les
   * 2 précédents projets Expo.
   */
  const updatePassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    try {
      setLoading(true);
      setError(null);

      if (!currentPassword || !newPassword) {
        setError("Tous les champs sont obligatoires");
        setLoading(false);
        return { success: false, error: "Tous les champs sont obligatoires" };
      }

      if (currentPassword === newPassword) {
        const msg = "Le nouveau mot de passe doit être différent";
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      if (newPassword.length < 8) {
        const msg = "Minimum 8 caractères pour le nouveau mot de passe";
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      if (newPassword !== confirmPassword) {
        const msg =
          "Le nouveau mot de passe et la confirmation ne correspondent pas";
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (changeError) {
        const errorMessage =
          changeError.status === 401
            ? "Session expirée. Veuillez vous reconnecter"
            : changeError.message || "Mot de passe actuel incorrect";

        if (changeError.status === 401) {
          setTimeout(() => router.replace("/login"), 2000);
        }

        console.error(
          new Error(errorMessage),
          "AuthContext",
          "updatePassword",
          changeError.status === 401,
        );

        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      showToast("Mot de passe mis à jour avec succès!");

      setTimeout(() => {
        router.replace("/me");
      }, 1000);

      return { success: true };
    } catch (error) {
      let errorMessage = "Problème de connexion. Vérifiez votre connexion.";
      if (error.name === "AbortError") {
        errorMessage = "La requête a pris trop de temps";
        console.error(error, "AuthContext", "updatePassword", false);
      } else {
        console.error(error, "AuthContext", "updatePassword", true);
      }
      console.error("Password update error:", error.message);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bascule un produit en favori / hors favoris.
   * Route mobile : /api/v1/me/favorites
   */
  const toggleFavorite = async (
    productId,
    productName,
    productImage,
    action = "toggle",
  ) => {
    try {
      setError(null);

      if (!productId) {
        setError("L'ID du produit est obligatoire");
        return { success: false };
      }

      const currentFavorites = user?.favorites || [];
      const backupFavorites = JSON.parse(JSON.stringify(currentFavorites));

      const favoriteIndex = currentFavorites.findIndex(
        (fav) => fav.productId?.toString() === productId,
      );
      const isCurrentlyInFavorites = favoriteIndex !== -1;

      let actionToPerform = action;
      if (action === "toggle") {
        actionToPerform = isCurrentlyInFavorites ? "remove" : "add";
      }

      let updatedFavorites;
      if (actionToPerform === "add") {
        updatedFavorites = [
          ...currentFavorites,
          {
            productId,
            productName: productName.trim(),
            productImage: productImage || { public_id: null, url: null },
            addedAt: new Date(),
          },
        ];
      } else if (actionToPerform === "remove") {
        updatedFavorites = currentFavorites.filter(
          (fav) => fav.productId?.toString() !== productId,
        );
      } else {
        updatedFavorites = currentFavorites;
      }

      setOptimisticFavorites(updatedFavorites);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/me/favorites", {
          method: "POST",
          body: JSON.stringify({
            productId,
            productName,
            productImage,
            action: actionToPerform,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const contentType = res.headers.get("content-type") || "";
      let data = null;

      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (parseError) {
          console.error(
            "[toggleFavorite] Failed to parse JSON response:",
            parseError.message,
          );
        }
      }

      if (!res.ok) {
        let errorMessage = "";

        if (data?.message) {
          errorMessage = data.message;
        } else {
          switch (res.status) {
            case 400:
              errorMessage = "Données invalides";
              break;
            case 401:
              errorMessage = "Session expirée. Veuillez vous reconnecter";
              setTimeout(() => router.replace("/login"), 2000);
              break;
            case 404:
              errorMessage = "Service indisponible (route introuvable)";
              break;
            case 429:
              errorMessage = "Trop de tentatives. Réessayez plus tard.";
              break;
            default:
              errorMessage = `Erreur lors de l'opération (${res.status})`;
          }
        }

        setOptimisticFavorites(backupFavorites);

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        const isCritical = res.status === 401;
        console.error(httpError, "AuthContext", "toggleFavorite", isCritical);

        setError(errorMessage);
        showToast(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!data) {
        setOptimisticFavorites(backupFavorites);
        const errorMessage = "Réponse invalide du serveur";
        console.error(
          new Error(errorMessage),
          "AuthContext",
          "toggleFavorite",
          true,
        );
        setError(errorMessage);
        showToast(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data.success && data.data?.favorites) {
        setOptimisticFavorites(data.data.favorites);
        forceRefreshSession();

        const isAdded = data.data.action === "added";
        showToast(
          isAdded
            ? `${productName} ajouté aux favoris`
            : `${productName} retiré des favoris`,
        );

        return {
          success: true,
          isFavorite: isAdded,
          favorites: data.data.favorites,
        };
      }

      setOptimisticFavorites(backupFavorites);
      return { success: false, error: "Réponse inattendue du serveur" };
    } catch (error) {
      console.error("[toggleFavorite] Error:", error.message);

      setOptimisticFavorites(null);

      let errorMessage = "Problème de connexion. Vérifiez votre connexion.";
      if (error.name === "AbortError") {
        errorMessage = "La requête a pris trop de temps";
        console.error(error, "AuthContext", "toggleFavorite", false);
      } else {
        console.error(error, "AuthContext", "toggleFavorite", true);
      }

      setError(errorMessage);
      showToast(errorMessage);
      return { success: false, error: error.message };
    }
  };

  /**
   * Envoie un email (formulaire de contact).
   * Route mobile : /api/v1/emails
   *
   * CORRECTIF (absent du fichier source web) : la version web redirigeait
   * de force vers /me après envoi et ne renvoyait jamais de valeur de
   * succès/échec — même bug déjà rencontré et corrigé dans les 2 précédents
   * projets Expo. Ici on retire la redirection forcée (l'écran appelant
   * décide quoi faire) et on renvoie systématiquement {success, error}.
   */
  const sendEmail = async ({ subject, message }) => {
    try {
      setLoading(true);
      setError(null);

      if (!subject || !subject.trim()) {
        setError("Le sujet est obligatoire");
        setLoading(false);
        return { success: false, error: "Le sujet est obligatoire" };
      }

      if (!message || !message.trim()) {
        setError("Le message est obligatoire");
        setLoading(false);
        return { success: false, error: "Le message est obligatoire" };
      }

      if (subject.length > 200) {
        const msg = "Le sujet est trop long (max 200 caractères)";
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      if (message.length > 5000) {
        const msg = "Le message est trop long (max 5000 caractères)";
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/emails", {
          method: "POST",
          body: JSON.stringify({ subject, message }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "";
        switch (res.status) {
          case 400:
            errorMessage = data.message || "Données invalides";
            break;
          case 401:
            errorMessage = "Session expirée. Veuillez vous reconnecter";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 404:
            errorMessage = "Utilisateur non trouvé";
            break;
          case 429:
            errorMessage = "Trop de tentatives. Réessayez plus tard.";
            break;
          case 503:
            errorMessage = "Service d'email temporairement indisponible";
            break;
          default:
            errorMessage = data.message || "Erreur lors de l'envoi";
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        const isCritical = [401, 503].includes(res.status);
        console.error(httpError, "AuthContext", "sendEmail", isCritical);

        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      if (data.success) {
        showToast("Message envoyé avec succès!");
        return { success: true };
      }

      return { success: false, error: "Réponse inattendue du serveur" };
    } catch (error) {
      let errorMessage = "Problème de connexion. Vérifiez votre connexion.";
      if (error.name === "AbortError") {
        errorMessage = "La requête a pris trop de temps";
        console.error(error, "AuthContext", "sendEmail", false);
      } else {
        console.error(error, "AuthContext", "sendEmail", true);
      }
      console.error("Email send error:", error.message);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setOptimisticFavorites(null);
    setError(null);
    setUpdated(false);
  };

  const clearErrors = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        error,
        loading,
        updated,
        setUpdated,
        setLoading,
        updateProfile,
        updatePassword,
        toggleFavorite,
        sendEmail,
        clearUser,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
