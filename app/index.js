// app/index.js (mobile) — remplace le placeholder de configuration

import { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator, View } from "react-native";
import Hero from "@/components/home/Hero";

/**
 * Récupère les données de la page d'accueil.
 * Route mobile : /api/v1/homepage (publique, pas besoin d'authenticatedFetch)
 */
async function getHomePageData() {
  try {
    const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/v1/homepage`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`API Error: ${res.status} - ${res.statusText}`);
      return {
        success: false,
        message: "Erreur lors de la récupération des données",
        data: null,
      };
    }

    const responseBody = await res.json();

    if (!responseBody.success) {
      console.error("Invalid API response structure:", responseBody);
      return {
        success: false,
        message: responseBody.message || "Réponse API invalide",
        data: null,
      };
    }

    return {
      success: true,
      message: "Données récupérées avec succès",
      data: responseBody.data,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timeout after 5 seconds");
      return {
        success: false,
        message: "La requête a pris trop de temps",
        data: null,
      };
    }

    console.error("Network error:", error.message);
    return {
      success: false,
      message: "Problème de connexion réseau",
      data: null,
    };
  }
}

export default function Home() {
  const [homePageData, setHomePageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getHomePageData().then((result) => {
      if (mounted) {
        setHomePageData(result.data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <Hero homePageData={homePageData} />
    </ScrollView>
  );
}
