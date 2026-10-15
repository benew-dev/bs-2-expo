// components/layouts/CustomPagination.js (mobile)
// Équivalent de components/layouts/CustomPagination.jsx.
//
// Adaptations : react-responsive-pagination est une lib web (DOM), donc
// remplacée par une pagination Précédent/Suivant + indicateur "Page X / Y",
// suffisante sur la largeur d'un écran mobile. Pas de window.scrollTo : la
// liste est un FlatList (CustomPagination est dans son ListFooterComponent),
// donc rien à faire remonter manuellement ici — c'est à l'écran appelant de
// scroller le FlatList si besoin.

import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { buildQueryString } from "@/utils/inputSanitizer";

export default function CustomPagination({ basePath, totalPages = 1 }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  const safeTotalPages = Math.max(1, totalPages);
  const parsedPage = parseInt(params?.page, 10);
  const currentPage =
    !isNaN(parsedPage) && parsedPage >= 1
      ? Math.min(parsedPage, safeTotalPages)
      : 1;

  const goToPage = useCallback(
    (newPage) => {
      if (
        isNavigating ||
        newPage === currentPage ||
        newPage < 1 ||
        newPage > safeTotalPages
      ) {
        return;
      }

      setIsNavigating(true);

      try {
        const next = { ...params };
        if (newPage === 1) {
          delete next.page; // page 1 : pas besoin du paramètre, plus propre
        } else {
          next.page = String(newPage);
        }

        const query = buildQueryString(next);
        router.push(query ? `${basePath}?${query}` : basePath);
      } catch (error) {
        console.error("Erreur de navigation:", error);
      } finally {
        setIsNavigating(false);
      }
    },
    [isNavigating, currentPage, safeTotalPages, params, basePath, router],
  );

  if (safeTotalPages <= 1) {
    return null;
  }

  return (
    <View
      className="flex-row items-center justify-center gap-4"
      accessibilityLiveRegion="polite"
    >
      <TouchableOpacity
        onPress={() => goToPage(currentPage - 1)}
        disabled={isNavigating || currentPage <= 1}
        className={`rounded-md border border-gray-200 p-2 ${
          currentPage <= 1 ? "opacity-40" : ""
        }`}
        accessibilityLabel="Page précédente"
      >
        <ChevronLeft size={18} color="#374151" />
      </TouchableOpacity>

      {isNavigating ? (
        <ActivityIndicator size="small" color="#ea580c" />
      ) : (
        <Text className="text-sm text-gray-700">
          Page {currentPage} / {safeTotalPages}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => goToPage(currentPage + 1)}
        disabled={isNavigating || currentPage >= safeTotalPages}
        className={`rounded-md border border-gray-200 p-2 ${
          currentPage >= safeTotalPages ? "opacity-40" : ""
        }`}
        accessibilityLabel="Page suivante"
      >
        <ChevronRight size={18} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}
