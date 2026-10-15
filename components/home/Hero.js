// components/home/Hero.js (mobile)
//
// Adaptations : pas de react-swipeable (lib web) → le swipe est géré
// nativement par un ScrollView horizontal avec pagingEnabled ; pas de
// next-cloudinary → cldUrl() comme avant ; pas de <Link>/CSS hover →
// TouchableOpacity + navigation programmatique ; vague SVG décorative omise
// (comme pour la version précédente).

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Shield,
  ShoppingBag,
  TrendingUp,
} from "lucide-react-native";
import { cldUrl } from "@/lib/cloudinary";

const SCREEN_WIDTH = Dimensions.get("window").width;

const defaultSections = [
  {
    title: "Bienvenue sur Buy It Now",
    subtitle: "Votre destination shopping de confiance",
    text: "Découvrez des milliers de produits de qualité à des prix imbattables",
    image: null,
  },
];

const FEATURES = [
  {
    icon: TrendingUp,
    label: "Prix compétitifs",
    bg: "bg-orange-100",
    color: "#ea580c",
  },
  {
    icon: Shield,
    label: "Paiement sécurisé",
    bg: "bg-pink-100",
    color: "#db2777",
  },
  {
    icon: ShoppingBag,
    label: "Support 24/7",
    bg: "bg-orange-100",
    color: "#ea580c",
  },
];

export default function Hero({ homePageData }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const sections = useMemo(() => {
    if (!homePageData?.sections || homePageData.sections.length === 0) {
      return defaultSections;
    }
    return homePageData.sections;
  }, [homePageData]);

  const totalSlides = sections.length;

  // Auto-scroll toutes les 5 secondes
  useEffect(() => {
    if (!isAutoScrolling || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = prev >= totalSlides - 1 ? 0 : prev + 1;
        scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, totalSlides]);

  // Réactiver l'auto-scroll après 10s d'inactivité (suite à un swipe manuel)
  useEffect(() => {
    if (!isAutoScrolling) {
      const timeout = setTimeout(() => setIsAutoScrolling(true), 10000);
      return () => clearTimeout(timeout);
    }
  }, [isAutoScrolling]);

  // Swipe natif : le ScrollView en pagingEnabled gère le geste lui-même ;
  // on se contente de synchroniser currentSlide quand il s'arrête.
  const handleMomentumScrollEnd = useCallback((event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(index);
    setIsAutoScrolling(false);
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setIsAutoScrolling(false);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  }, []);

  return (
    <View className="bg-white">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {sections.map((section, index) => {
          const hasImage =
            section?.image &&
            (section.image.publicId || section.image.public_id);
          const imageUrl = hasImage
            ? cldUrl(section.image.publicId || section.image.public_id, {
                width: 800,
                quality: 90,
              })
            : null;

          return (
            <View
              key={index}
              style={{ width: SCREEN_WIDTH }}
              className="px-4 py-8"
            >
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {section?.title || "Bienvenue sur Buy It Now"}
              </Text>
              <Text className="text-lg text-orange-600 font-semibold mb-1">
                {section?.subtitle || "Votre destination shopping de confiance"}
              </Text>
              <Text className="text-base text-gray-600 mb-6">
                {section?.text ||
                  "Découvrez des milliers de produits de qualité"}
              </Text>

              <View className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-72"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-72 bg-orange-500 items-center justify-center">
                    <ShoppingBag size={48} color="white" />
                  </View>
                )}
              </View>

              <View className="gap-3 mb-8">
                <TouchableOpacity
                  onPress={() => router.push("/shop")}
                  className="flex-row items-center justify-center bg-orange-600 rounded-lg py-4"
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
                  <Text className="text-gray-700 font-semibold">
                    En savoir plus
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <View key={feature.label} className="items-center flex-1">
                      <View
                        className={`w-11 h-11 rounded-full ${feature.bg} items-center justify-center mb-1.5`}
                      >
                        <Icon size={20} color={feature.color} />
                      </View>
                      <Text className="text-xs font-medium text-gray-600 text-center">
                        {feature.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {totalSlides > 1 && (
        <View className="flex-row justify-center gap-2 pb-6">
          {sections.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              accessibilityLabel={`Aller à la section ${index + 1}`}
            >
              <View
                className={
                  index === currentSlide
                    ? "bg-orange-600 w-8 h-3 rounded-full"
                    : "bg-gray-300 w-3 h-3 rounded-full"
                }
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
