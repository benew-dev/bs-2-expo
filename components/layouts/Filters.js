// components/layouts/Filters.js (mobile)
// Équivalent de components/layouts/Filters.jsx.
//
// Adaptations :
// - Pas d'URLSearchParams (non garanti sur RN) → les paramètres courants
//   viennent de useLocalSearchParams() (expo-router, équivalent de
//   useSearchParams() côté web) et la navigation reconstruit la query
//   string à la main via buildQueryString.
// - basePath remplace le "/shop" en dur du web : ce composant est partagé
//   entre /men et /women.
// - toast (react-toastify) → showToast (lib/toast.js).
// - <aside>/<input>/<button> (DOM) → View/TextInput/TouchableOpacity.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { isArrayEmpty } from "@/helpers/helpers";
import { buildQueryString } from "@/utils/inputSanitizer";
import { showToast } from "@/lib/toast";

export default function Filters({ basePath, categories, setLocalLoading }) {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [min, setMin] = useState(() => (params?.min ? String(params.min) : ""));
  const [max, setMax] = useState(() => (params?.max ? String(params.max) : ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCategory = params?.category || "";

  // Synchroniser les états avec les paramètres de l'URL courante
  useEffect(() => {
    setMin(params?.min ? String(params.min) : "");
    setMax(params?.max ? String(params.max) : "");
  }, [params?.min, params?.max]);

  const hasActiveFilters = useMemo(
    () => Boolean(min || max || currentCategory),
    [min, max, currentCategory],
  );

  const navigateWithParams = useCallback(
    (nextParams) => {
      const query = buildQueryString(nextParams);
      router.push(query ? `${basePath}?${query}` : basePath);
    },
    [basePath, router],
  );

  // Gestionnaire de tap sur catégorie
  const handleCategoryPress = useCallback(
    (categoryId) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setLocalLoading?.(true);

      try {
        const next = { ...params };
        // Basculement : si la catégorie est déjà sélectionnée, la désélectionner
        if (next.category === categoryId) {
          delete next.category;
        } else {
          next.category = categoryId;
        }
        navigateWithParams(next);
      } catch (error) {
        console.error("Erreur lors de la sélection de catégorie:", error);
        showToast("Une erreur est survenue lors du filtrage par catégorie");
      } finally {
        setLocalLoading?.(false);
        setIsSubmitting(false);
      }
    },
    [isSubmitting, params, navigateWithParams, setLocalLoading],
  );

  // Gestionnaire pour appliquer les filtres de prix
  const handlePriceFilter = useCallback(() => {
    if (isSubmitting) return;

    if (min === "" && max === "") {
      showToast("Veuillez renseigner au moins un des deux champs de prix");
      return;
    }

    if (min !== "" && max !== "") {
      const minNum = Number(min);
      const maxNum = Number(max);

      if (isNaN(minNum) || isNaN(maxNum)) {
        showToast("Les valeurs de prix doivent être des nombres valides");
        return;
      }

      if (minNum > maxNum) {
        showToast("Le prix minimum doit être inférieur au prix maximum");
        return;
      }
    }

    setIsSubmitting(true);
    setLocalLoading?.(true);

    try {
      const next = { ...params };
      if (min !== "") {
        next.min = min;
      } else {
        delete next.min;
      }
      if (max !== "") {
        next.max = max;
      } else {
        delete next.max;
      }
      navigateWithParams(next);
    } catch (error) {
      showToast(
        error.message || "Une erreur est survenue avec les filtres de prix",
      );
    } finally {
      setLocalLoading?.(false);
      setIsSubmitting(false);
    }
  }, [min, max, isSubmitting, params, navigateWithParams, setLocalLoading]);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setIsSubmitting(false);
    setLocalLoading?.(false);
    setMin("");
    setMax("");
    router.push(basePath);
  }, [router, basePath, setLocalLoading]);

  return (
    <View className="w-full gap-4">
      {hasActiveFilters && (
        <TouchableOpacity
          onPress={resetFilters}
          accessibilityLabel="Réinitialiser tous les filtres"
        >
          <Text className="text-sm font-medium text-orange-600">
            Réinitialiser les filtres
          </Text>
        </TouchableOpacity>
      )}

      {/* Prix */}
      <View className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Text className="mb-3 font-semibold text-gray-700">Prix (Fdj)</Text>
        <View className="mb-3 flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Min</Text>
            <TextInput
              className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-900"
              keyboardType="numeric"
              placeholder="Min"
              value={min}
              onChangeText={setMin}
              editable={!isSubmitting}
              accessibilityLabel="Prix minimum"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Max</Text>
            <TextInput
              className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-900"
              keyboardType="numeric"
              placeholder="Max"
              value={max}
              onChangeText={setMax}
              editable={!isSubmitting}
              accessibilityLabel="Prix maximum"
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={handlePriceFilter}
          disabled={isSubmitting}
          className={`items-center rounded-md py-2.5 ${
            isSubmitting ? "bg-orange-300" : "bg-orange-600"
          }`}
          accessibilityLabel="Appliquer les filtres de prix"
        >
          <Text className="font-medium text-white">Appliquer</Text>
        </TouchableOpacity>
      </View>

      {/* Catégories */}
      <View className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Text className="mb-3 font-semibold text-gray-700">Catégories</Text>

        {isArrayEmpty(categories) ? (
          <Text className="py-2 text-center text-gray-500">
            Aucune catégorie disponible
          </Text>
        ) : (
          <View className="gap-1">
            {categories.map((category) => {
              const active = currentCategory === category?._id;
              return (
                <TouchableOpacity
                  key={category?._id}
                  onPress={() => handleCategoryPress(category?._id)}
                  disabled={isSubmitting}
                  className={`rounded-md p-2.5 ${active ? "bg-orange-100" : ""}`}
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={category?.name}
                >
                  <Text
                    className={
                      active ? "font-medium text-orange-700" : "text-gray-700"
                    }
                  >
                    {category?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
