// components/skeletons/ListProductsSkeleton.js (mobile)
// Équivalent de components/skeletons/ListProductsSkeleton.jsx.
//
// Adaptations : pas de CSS `animate-pulse` en RN — on garde des blocs gris
// statiques (simple et fiable) plutôt que de brancher Animated pour un
// loader ; pas de <aside>/<section> (HTML) → <View>.

import { View } from "react-native";

export function ProductItemSkeleton() {
  return (
    <View className="w-full overflow-hidden rounded-lg border border-gray-100 bg-white">
      <View className="h-48 w-full bg-gray-200" />
      <View className="gap-2 p-4">
        <View className="h-4 w-1/3 rounded bg-gray-200" />
        <View className="h-4 w-3/4 rounded bg-gray-200" />
        <View className="h-5 w-1/2 rounded bg-gray-200" />
        <View className="mt-2 h-9 w-full rounded bg-gray-200" />
      </View>
    </View>
  );
}

export function FiltersSkeleton() {
  return (
    <View className="gap-3">
      <View className="rounded-lg border border-gray-200 bg-white p-4">
        <View className="mb-3 h-5 w-20 rounded bg-gray-200" />
        <View className="mb-3 flex-row gap-2">
          <View className="h-10 flex-1 rounded bg-gray-200" />
          <View className="h-10 flex-1 rounded bg-gray-200" />
        </View>
        <View className="h-10 w-full rounded bg-gray-200" />
      </View>

      <View className="rounded-lg border border-gray-200 bg-white p-4">
        <View className="mb-3 h-5 w-24 rounded bg-gray-200" />
        {[...Array(4)].map((_, index) => (
          <View key={index} className="mb-2 h-8 w-full rounded bg-gray-200" />
        ))}
      </View>
    </View>
  );
}

const ListProductsSkeleton = () => {
  return (
    <View className="gap-4 p-4">
      <View className="h-6 w-40 rounded bg-gray-200" />

      {[...Array(4)].map((_, index) => (
        <ProductItemSkeleton key={index} />
      ))}
    </View>
  );
};

export default ListProductsSkeleton;
