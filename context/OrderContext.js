// context/OrderContext.js (mobile)

import { useRouter } from "expo-router";
import { createContext, useState } from "react";
import { captureClientError } from "@/lib/monitoring";
import { authenticatedFetch } from "@/lib/auth-client";

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState(null);

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);

  const [canReview, setCanReview] = useState(false);

  const router = useRouter();

  /**
   * Crée la commande.
   * Route mobile : /api/v1/orders/webhook
   *
   * CORRECTIF : router.push("/confirmation") → router.replace("/confirmation").
   * Avec push, l'écran de paiement/review-order restait monté sous la
   * confirmation ; ses effets (dépendant du panier) se déclenchaient après
   * le nettoyage du panier côté serveur et provoquaient une redirection en
   * boucle confirmation → panier → panier qui se rafraîchit sans cesse —
   * déjà rencontré et corrigé de la même façon dans les 2 précédents projets.
   */
  const addOrder = async (orderInfo) => {
    try {
      setError(null);
      setUpdated(true);
      setLowStockProducts(null);

      if (!orderInfo) {
        const validationError = new Error("Données de commande manquantes");
        captureClientError(validationError, "OrderContext", "addOrder", false);
        setError("Données de commande manquantes");
        setUpdated(false);
        return;
      }

      if (!orderInfo.orderItems || orderInfo.orderItems.length === 0) {
        const validationError = new Error(
          "Panier vide lors de la création de commande",
        );
        captureClientError(validationError, "OrderContext", "addOrder", false);
        setError("Votre panier est vide");
        setUpdated(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/orders/webhook", {
          method: "POST",
          body: JSON.stringify(orderInfo),
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
            errorMessage = data.message || "Données de commande invalides";
            break;
          case 401:
            errorMessage = "Session expirée. Veuillez vous reconnecter.";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 404:
            errorMessage = "Utilisateur non trouvé";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 409:
            if (data.unavailableProducts) {
              setLowStockProducts(data.unavailableProducts);
              errorMessage = "Produits indisponibles détectés";
              router.replace("/error");
            } else {
              errorMessage = "Certains produits ne sont plus disponibles";
            }
            break;
          case 429:
            errorMessage = "Trop de tentatives. Réessayez plus tard.";
            break;
          default:
            errorMessage =
              data.message || "Erreur lors du traitement de la commande";
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        const isCritical = [401, 404, 409].includes(res.status);
        captureClientError(httpError, "OrderContext", "addOrder", isCritical);

        setError(errorMessage);
        setUpdated(false);
        return;
      }

      if (data.success && data.id) {
        setOrderId(data.id);
        setError(null);

        console.log("Order created:", data.orderNumber);
        router.replace("/confirmation");
      } else {
        const responseError = new Error(
          "Réponse API malformée lors de la création de commande",
        );
        captureClientError(responseError, "OrderContext", "addOrder", true);
        setError("Erreur lors de la création de la commande");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps. Veuillez réessayer.");
        captureClientError(error, "OrderContext", "addOrder", true);
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        setError("Problème de connexion. Vérifiez votre connexion.");
        captureClientError(error, "OrderContext", "addOrder", true);
      } else if (error instanceof SyntaxError) {
        setError("Réponse serveur invalide.");
        captureClientError(error, "OrderContext", "addOrder", true);
      } else {
        setError("Problème de connexion. Vérifiez votre connexion.");
        captureClientError(error, "OrderContext", "addOrder", true);
      }
      console.error("Order creation error:", error.message);
    } finally {
      setUpdated(false);
    }
  };

  /**
   * Vérifie si l'utilisateur peut laisser un avis sur un produit.
   * Route mobile : /api/v1/orders/can_review/[id]
   */
  const canUserReview = async (id) => {
    try {
      if (!id || typeof id !== "string") {
        const error = new Error("ID du produit invalide");
        captureClientError(error, "OrderContext", "canUserReview", false);
        setError("ID du produit invalide");
        setCanReview(false);
        return;
      }

      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        const error = new Error(`Format d'ID invalide: ${id}`);
        captureClientError(error, "OrderContext", "canUserReview", false);
        setError("Format d'ID du produit invalide");
        setCanReview(false);
        return;
      }

      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let res;
      try {
        res = await authenticatedFetch(`/api/v1/orders/can_review/${id}`, {
          method: "GET",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const error = new Error("Réponse serveur invalide");
        captureClientError(error, "OrderContext", "canUserReview", false);
        setError("Erreur lors du traitement de la réponse");
        setCanReview(false);
        return;
      }

      if (!res.ok) {
        let errorMessage = "";

        switch (res.status) {
          case 400:
            errorMessage = data.message || "ID du produit invalide";
            break;
          case 401:
            errorMessage = "Session expirée. Veuillez vous reconnecter.";
            setCanReview(false);
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 404:
            errorMessage =
              data.code === "USER_NOT_FOUND"
                ? "Utilisateur non trouvé"
                : "Produit non trouvé";
            setCanReview(false);
            break;
          case 429:
            errorMessage = "Trop de tentatives. Veuillez patienter.";
            break;
          case 503:
            errorMessage = "Service temporairement indisponible. Réessayez.";
            break;
          default:
            errorMessage =
              data.message ||
              "Erreur lors de la vérification de l'éligibilité à l'avis";
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        const isCritical = [401, 404].includes(res.status);
        captureClientError(
          httpError,
          "OrderContext",
          "canUserReview",
          isCritical,
        );

        setError(errorMessage);
        setCanReview(false);
        return;
      }

      if (!data.success) {
        const error = new Error("Réponse API sans succès malgré status 200");
        captureClientError(error, "OrderContext", "canUserReview", false);
        setError(
          data.message ||
            "Erreur lors de la vérification de l'éligibilité à l'avis",
        );
        setCanReview(false);
        return;
      }

      if (!data.data || typeof data.data.canReview !== "boolean") {
        const error = new Error("Structure de réponse invalide");
        captureClientError(error, "OrderContext", "canUserReview", true);
        setError("Erreur de format des données");
        setCanReview(false);
        return;
      }

      setCanReview(data.data.canReview);

      if (__DEV__) {
        console.log("Can review check result:", {
          canReview: data.data.canReview,
          hasAlreadyReviewed: data.data.hasAlreadyReviewed,
        });
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps. Veuillez réessayer.");
        captureClientError(error, "OrderContext", "canUserReview", false);
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        setError("Problème de connexion. Vérifiez votre connexion internet.");
        captureClientError(error, "OrderContext", "canUserReview", false);
      } else if (error instanceof SyntaxError) {
        setError("Erreur de format des données. Réessayez.");
        captureClientError(error, "OrderContext", "canUserReview", false);
      } else {
        setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
        captureClientError(error, "OrderContext", "canUserReview", false);
      }

      setCanReview(false);

      console.error("Can review check error:", {
        message: error.message,
        name: error.name,
        productId: id,
      });
    }
  };

  /**
   * Publie ou met à jour un avis sur un produit.
   * Route mobile : /api/v1/review/[id]
   */
  const postReview = async (reviewData) => {
    try {
      if (!reviewData || typeof reviewData !== "object") {
        const error = new Error("Données d'avis manquantes");
        captureClientError(error, "OrderContext", "postReview", false);
        setError("Données d'avis manquantes");
        return;
      }

      const { productId, rating, comment } = reviewData;

      if (!productId || typeof productId !== "string") {
        const error = new Error("ID du produit invalide");
        captureClientError(error, "OrderContext", "postReview", false);
        setError("ID du produit invalide");
        return;
      }

      const numericRating = Number(rating);
      if (
        rating === undefined ||
        rating === null ||
        isNaN(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        const error = new Error(
          `Note invalide: ${rating}. Doit être entre 1 et 5`,
        );
        captureClientError(error, "OrderContext", "postReview", false);
        setError("La note doit être un nombre entre 1 et 5");
        return;
      }

      const roundedRating = Math.round(numericRating * 2) / 2;

      if (!comment || typeof comment !== "string") {
        const error = new Error("Commentaire manquant ou invalide");
        captureClientError(error, "OrderContext", "postReview", false);
        setError("Le commentaire est requis");
        return;
      }

      const trimmedComment = comment.trim();
      if (trimmedComment.length < 10) {
        const error = new Error(
          `Commentaire trop court: ${trimmedComment.length} caractères`,
        );
        captureClientError(error, "OrderContext", "postReview", false);
        setError("Le commentaire doit contenir au moins 10 caractères");
        return;
      }

      if (trimmedComment.length > 1000) {
        const error = new Error(
          `Commentaire trop long: ${trimmedComment.length} caractères`,
        );
        captureClientError(error, "OrderContext", "postReview", false);
        setError("Le commentaire ne doit pas dépasser 1000 caractères");
        return;
      }

      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let res;
      try {
        res = await authenticatedFetch(`/api/v1/review/${productId}`, {
          method: "PUT",
          body: JSON.stringify({
            reviewData: {
              productId,
              rating: roundedRating,
              comment: trimmedComment,
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const error = new Error("Réponse serveur invalide");
        captureClientError(error, "OrderContext", "postReview", true);
        setError("Erreur lors du traitement de la réponse");
        return;
      }

      if (!res.ok) {
        let errorMessage = "";

        switch (res.status) {
          case 400:
            errorMessage =
              data.message || "Données d'avis invalides. Vérifiez vos entrées.";
            break;
          case 401:
            errorMessage = "Session expirée. Veuillez vous reconnecter.";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 404:
            errorMessage = "Produit non trouvé";
            break;
          case 429:
            errorMessage =
              "Trop de tentatives. Veuillez patienter avant de réessayer.";
            break;
          case 503:
            errorMessage = "Service temporairement indisponible. Réessayez.";
            break;
          default:
            errorMessage = data.message || "Erreur lors de l'envoi de l'avis";
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        const isCritical = [401, 404].includes(res.status);
        captureClientError(httpError, "OrderContext", "postReview", isCritical);

        setError(errorMessage);
        return;
      }

      if (!data.success) {
        const error = new Error(
          "Réponse API sans succès malgré status 200/201",
        );
        captureClientError(error, "OrderContext", "postReview", true);
        setError(data.message || "Erreur lors de l'envoi de l'avis");
        return;
      }

      console.log("Review posted successfully:", data.data?.meta);
      router.push(`/shop/${productId}`);
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps. Veuillez réessayer.");
        captureClientError(error, "OrderContext", "postReview", false);
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        setError(
          "Problème de connexion. Vérifiez votre connexion internet et réessayez.",
        );
        captureClientError(error, "OrderContext", "postReview", false);
      } else if (error instanceof SyntaxError) {
        setError("Erreur de format des données. Réessayez.");
        captureClientError(error, "OrderContext", "postReview", true);
      } else {
        setError(
          "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
        );
        captureClientError(error, "OrderContext", "postReview", true);
      }

      console.error("Review post error:", {
        message: error.message,
        name: error.name,
        productId: reviewData?.productId,
      });
    }
  };

  const clearErrors = () => {
    setError(null);
  };

  const safeSetPaymentTypes = (types) => {
    try {
      if (!Array.isArray(types)) {
        const validationError = new Error(
          "Types de paiement invalides (non-array)",
        );
        captureClientError(
          validationError,
          "OrderContext",
          "setPaymentTypes",
          false,
        );
        setPaymentTypes([]);
        return;
      }
      setPaymentTypes(types);
    } catch (error) {
      captureClientError(error, "OrderContext", "setPaymentTypes", true);
      setPaymentTypes([]);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        error,
        updated,
        orderId,
        lowStockProducts,
        paymentTypes,
        orderInfo,
        canReview,
        setPaymentTypes,
        setOrderInfo,
        addOrder,
        canUserReview,
        postReview,
        setUpdated,
        clearErrors,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;
