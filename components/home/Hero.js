// components/home/Hero.js (mobile)
//
// Adaptations : pas de next-cloudinary (CldImage) → construction manuelle
// de l'URL via lib/cloudinary.js ; pas de <Link>/CSS "group-hover" →
// TouchableOpacity + navigation programmatique ; la vague SVG décorative du
// bas (pur détail visuel CSS/SVG) est omise — à ajouter plus tard avec
// react-native-svg si tu la veux vraiment sur mobile.

import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, ArrowRight } from "lucide-react-native";
import { cldUrl } from "@/lib/cloudinary";

const defaultData = {
  title: "Bienvenue sur Buy It Now",
  subtitle: "Votre destination shopping de confiance",
  text: "Découvrez des milliers de produits de qualité à des prix imbattables",
  image: null,
};

export default function Hero({ homePageData }) {
  const router = useRouter();

  const heroData = homePageData || defaultData;
  const hasImage = heroData.image && heroData.image.publicId;
  const imageUrl = hasImage
    ? cldUrl(heroData.image.publicId, { width: 800, quality: 90 })
    : null;

  return (
    <View className="bg-blue-50 px-4 py-8">
      <Text className="text-3xl font-bold text-gray-800 mb-2">
        {heroData.title}
      </Text>
      <Text className="text-lg text-gray-600 font-semibold mb-1">
        {heroData.subtitle}
      </Text>
      <Text className="text-base text-gray-500 mb-6">{heroData.text}</Text>

      <View className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-72"
            resizeMode="cover"
          />
        ) : (
          // Pas d'image Cloudinary disponible et pas d'asset local requis :
          // simple fond coloré avec l'icône, plutôt que de dépendre d'un
          // fichier image qui n'existe pas forcément dans le projet.
          <View className="w-full h-72 bg-blue-600 items-center justify-center">
            <ShoppingBag size={48} color="white" />
          </View>
        )}

        <View className="absolute bottom-3 left-3 right-3 bg-white/95 rounded-xl p-3 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-blue-600 items-center justify-center">
            <ShoppingBag size={20} color="white" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-gray-800">
              Expérience Premium
            </Text>
            <Text className="text-xs text-gray-600">
              Shopping de qualité supérieure
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <TouchableOpacity
          onPress={() => router.push("/men")}
          className="flex-row items-center justify-center bg-blue-600 rounded-lg py-4"
        >
          <Text className="text-white font-semibold mr-2">
            Parcourir la boutique
          </Text>
          <ArrowRight size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/about")}
          className="flex-row items-center justify-center bg-white border border-gray-200 rounded-lg py-4"
        >
          <Text className="text-gray-700 font-semibold">En savoir plus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
