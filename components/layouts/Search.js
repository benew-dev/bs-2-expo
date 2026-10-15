// components/layouts/Search.js (mobile)
// Équivalent de components/layouts/Search.jsx.
//
// Adaptations : pas de <form>/submit DOM → TextInput + onSubmitEditing
// (clavier) et un bouton ; pas de debounce côté saisie (il n'y a pas de
// recherche "au fil de la frappe" ici, seulement au submit) ; toast web
// (react-toastify) → showToast (lib/toast.js) ; basePath remplace le
// "/shop" en dur du web puisque ce composant est réutilisé par /men et
// /women.

import { useCallback, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Search as SearchIcon } from "lucide-react-native";
import { showToast } from "@/lib/toast";

export default function Search({ basePath, setLoading }) {
  const [keyword, setKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const submitHandler = useCallback(() => {
    if (isSubmitting) return;

    const trimmed = keyword.trim();
    if (!trimmed) {
      showToast("Veuillez entrer un terme de recherche");
      return;
    }

    setIsSubmitting(true);
    setLoading?.(true);

    try {
      router.push(`${basePath}?keyword=${encodeURIComponent(trimmed)}`);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      showToast("Une erreur est survenue lors de la recherche");
    } finally {
      setLoading?.(false);
      setIsSubmitting(false);
    }
  }, [keyword, isSubmitting, basePath, router, setLoading]);

  return (
    <View
      className="flex-row items-center w-full"
      accessibilityLabel="Rechercher des produits"
    >
      <TextInput
        className="mr-2 flex-1 rounded-md border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-900"
        placeholder="Rechercher..."
        value={keyword}
        onChangeText={setKeyword}
        onSubmitEditing={submitHandler}
        returnKeyType="search"
        editable={!isSubmitting}
        accessibilityLabel="Terme de recherche"
      />
      <TouchableOpacity
        onPress={submitHandler}
        disabled={isSubmitting}
        className={`items-center justify-center rounded-md p-2.5 ${
          isSubmitting ? "bg-orange-300" : "bg-orange-600"
        }`}
        accessibilityLabel="Lancer la recherche"
      >
        <SearchIcon size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
