// components/products/ProductsScreen.js (mobile)
// Logique partagée entre app/men.js et app/women.js.
// Équivalent fusionné de app/men/page.jsx + app/women/page.jsx +
// components/products/ListProducts.jsx — les deux pages web ne
// différaient que par le "type" forcé, donc on garde un seul composant
// paramétré par `type`/`basePath` plutôt que deux copies quasi identiques.
//
// Adaptations principales :
// - Pas de Server Component Next.js : le fetch se fait ici, côté client,
//   au montage et à chaque changement de filtre (pas de revalidate/tags
//   Next, non pertinent côté RN).
// - Route API : /api/v1/products (cohérent avec /api/v1/homepage,
//   /api/v1/cart, etc. utilisés ailleurs dans l'app mobile), alors que le
//   web appelle /api/products.
// - useLocalSearchParams() (expo-router) remplace useSearchParams()
//   (next/navigation).
// - FlatList en grille (2 colonnes) comme conteneur de défilement
//   principal : recherche/filtres/titre en ListHeaderComponent,
//   pagination + Footer en ListFooterComponent (éviter d'imbriquer un
//   ScrollView dans une liste, source d'avertissements React Native).

import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SearchX, SlidersHorizontal } from "lucide-react-native";
import { isArrayEmpty } from "@/helpers/helpers";
import {
  parseProductSearchParams,
  buildQueryString,
} from "@/utils/inputSanitizer";
import Search from "@/components/layouts/Search";
import Filters from "@/components/layouts/Filters";
import CustomPagination from "@/components/layouts/CustomPagination";
import ProductItem from "@/components/products/ProductItem";
import ListProductsSkeleton, {
  ProductItemSkeleton,
} from "@/components/skeletons/ListProductsSkeleton";
import Footer from "@/components/layouts/Footer";

const REQUEST_TIMEOUT = 15000;

async function fetchProducts(type, params) {
  try {
    const cleanParams = parseProductSearchParams(params, type);
    cleanParams.type = type;

    const query = buildQueryString(cleanParams);
    const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/v1/products${
      query ? `?${query}` : ""
    }`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`API Error: ${res.status} - ${res.statusText}`);
      return {
        success: false,
        message: "Erreur lors de la récupération des données",
        data: { products: [], totalPages: 0, categories: [] },
      };
    }

    const responseBody = await res.json();

    if (!responseBody.success || !responseBody.data) {
      console.error("Invalid API response structure:", responseBody);
      return {
        success: false,
        message: responseBody.message || "Réponse API invalide",
        data: { products: [], totalPages: 0, categories: [] },
      };
    }

    return {
      success: true,
      message: "Données récupérées avec succès",
      data: {
        products: responseBody.data.products || [],
        totalPages: responseBody.data.totalPages || 0,
        totalProducts: responseBody.data.totalProducts || 0,
        categories: responseBody.data.categories || [],
        type: responseBody.data.type,
      },
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timeout after 15 seconds");
      return {
        success: false,
        message: "La requête a pris trop de temps",
        data: { products: [], totalPages: 0, categories: [] },
      };
    }

    console.error("Network error:", error.message);
    return {
      success: false,
      message: "Problème de connexion réseau",
      data: { products: [], totalPages: 0, categories: [] },
    };
  }
}

export default function ProductsScreen({ type, basePath }) {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // On ne lit que les champs pertinents (pas `params` entier : une
  // nouvelle référence est recréée à chaque navigation même sans
  // changement de valeur, ce qui provoquerait un re-fetch inutile).
  const keyword = params?.keyword;
  const category = params?.category;
  const minPrice = params?.min;
  const maxPrice = params?.max;
  const page = params?.page;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchProducts(type, params).then((result) => {
      if (mounted) {
        setData(result.data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, keyword, category, minPrice, maxPrice, page]);

  const getFilterSummary = useCallback(() => {
    try {
      const summary = [];

      if (keyword) summary.push(`Recherche : "${keyword}"`);
      if (category) {
        const categoryName = data?.categories?.find(
          (c) => c._id === category,
        )?.name;
        if (categoryName) summary.push(`Catégorie : ${categoryName}`);
      }
      if (minPrice && maxPrice) {
        summary.push(`Prix : ${minPrice} - ${maxPrice} Fdj`);
      } else if (minPrice) {
        summary.push(`Prix min : ${minPrice} Fdj`);
      } else if (maxPrice) {
        summary.push(`Prix max : ${maxPrice} Fdj`);
      }
      if (page) summary.push(`Page : ${page}`);

      return summary.length > 0 ? summary.join(" | ") : null;
    } catch (error) {
      console.error("[ProductsScreen] getFilterSummary error:", error);
      return null;
    }
  }, [keyword, category, minPrice, maxPrice, page, data?.categories]);

  const filterSummary = getFilterSummary();

  const hasValidData = Boolean(data && typeof data === "object");
  const hasValidCategories = Array.isArray(data?.categories);
  const products = data?.products || [];
  const isEmpty = isArrayEmpty(products);

  // Premier chargement : aucune donnée précédente à afficher
  if (loading && !hasValidData) {
    return <ListProductsSkeleton />;
  }

  if (!hasValidData) {
    return (
      <View className="m-4 rounded-md border-l-4 border-orange-500 bg-orange-50 p-4">
        <Text className="font-medium text-orange-800">
          Les données des produits ne sont pas disponibles pour le moment.
        </Text>
      </View>
    );
  }

  const Header = (
    <View className="p-4 pb-0">
      <View className="mb-4 flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => setShowFilters((v) => !v)}
          className="rounded-md border border-gray-200 bg-white p-2.5 shadow-sm"
          accessibilityLabel="Afficher/Masquer les filtres"
          accessibilityState={{ expanded: showFilters }}
        >
          <SlidersHorizontal size={20} color="#ea580c" />
        </TouchableOpacity>
        <View className="flex-1">
          <Search basePath={basePath} setLoading={setLoading} />
        </View>
      </View>

      {showFilters && (
        <View className="mb-4">
          {hasValidCategories ? (
            <Filters
              basePath={basePath}
              categories={data.categories}
              setLocalLoading={setLoading}
            />
          ) : (
            <View className="rounded-md border border-gray-200 bg-white p-4">
              <Text className="text-gray-600">Chargement des filtres...</Text>
            </View>
          )}
        </View>
      )}

      {filterSummary && (
        <View className="mb-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-3">
          <Text className="font-medium text-orange-800">{filterSummary}</Text>
        </View>
      )}

      <Text className="mb-4 text-xl font-bold text-gray-900">
        {products.length > 0
          ? `${products.length} produit${products.length > 1 ? "s" : ""} trouvé${
              products.length > 1 ? "s" : ""
            }`
          : "Produits"}
      </Text>

      {loading && (
        <View className="mb-4 gap-4">
          {[...Array(2)].map((_, i) => (
            <ProductItemSkeleton key={i} />
          ))}
        </View>
      )}
    </View>
  );

  // Chargement d'un filtre : on cache la grille précédente (comme le web
  // avec localLoading), on ne garde que le header (déjà le skeleton inline).
  if (loading) {
    return <View>{Header}</View>;
  }

  if (isEmpty) {
    return (
      <View>
        {Header}
        <View className="items-center px-6 py-10">
          <SearchX size={48} color="#d1d5db" />
          <Text className="mb-2 mt-4 text-xl font-semibold text-gray-800">
            Aucun produit trouvé
          </Text>
          <Text className="text-center text-gray-600">
            {keyword
              ? `Aucun résultat pour "${keyword}". Essayez d'autres termes de recherche.`
              : "Aucun produit ne correspond aux filtres sélectionnés. Essayez de modifier vos critères."}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(basePath)}
            className="mt-6 rounded-lg bg-orange-600 px-6 py-3"
            accessibilityLabel="Voir tous les produits disponibles"
          >
            <Text className="font-semibold text-white">
              Voir tous les produits
            </Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item, index) => item?._id || `product-${index}`}
      numColumns={2}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
      ListHeaderComponent={Header}
      renderItem={({ item }) => (
        <View style={{ width: "50%", padding: 4 }}>
          <ProductItem product={item} />
        </View>
      )}
      ListFooterComponent={
        <View>
          {data?.totalPages > 1 && (
            <View className="mt-4 px-4">
              <CustomPagination
                basePath={basePath}
                totalPages={data.totalPages}
              />
            </View>
          )}
          <Footer />
        </View>
      }
    />
  );
}
