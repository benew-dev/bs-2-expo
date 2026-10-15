// components/home/HomeContent.js (mobile)
//
// Adaptations : pas de CSS gradient/blur décoratif (bg-gradient-sunset,
// blur-3xl) → couleurs pleines ; <Link>/next/image → TouchableOpacity +
// router.push / Image RN ; grilles CSS → flexWrap.

import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  Truck,
  RotateCcw,
  Tag,
  Headphones,
  Star,
  ArrowRight,
  ShoppingBag,
  Watch,
  Smartphone,
  Home as HomeIcon,
  Dumbbell,
  Gem,
  Quote,
} from "lucide-react-native";

// ─── Données statiques (identiques à la version web) ──────────────────────

const featuredProducts = [
  {
    id: 1,
    name: "Sac en cuir véritable",
    category: "Accessoires",
    price: "89.99 €",
    originalPrice: "129.99 €",
    discount: "-31%",
    rating: 4.8,
    reviews: 142,
    image:
      "https://res.cloudinary.com/duzebhr9l/image/upload/v1760797628/buyitnow/products/umzsynq3p8hvaoli8jkc.jpg",
    badge: "Bestseller",
    badgeColor: "bg-orange-500",
  },
  {
    id: 2,
    name: "Montre classique",
    category: "Bijoux & Montres",
    price: "59.99 €",
    originalPrice: "89.99 €",
    discount: "-33%",
    rating: 4.6,
    reviews: 87,
    image:
      "https://res.cloudinary.com/duzebhr9l/image/upload/v1760797698/buyitnow/products/hhr6m635axn9nqt0gynw.jpg",
    badge: "Nouveauté",
    badgeColor: "bg-pink-500",
  },
  {
    id: 3,
    name: "Sneakers tendance",
    category: "Chaussures",
    price: "74.99 €",
    originalPrice: "99.99 €",
    discount: "-25%",
    rating: 4.9,
    reviews: 203,
    image:
      "https://res.cloudinary.com/duzebhr9l/image/upload/v1760799305/buyitnow/products/vq8vn3s70cb5wv4is7h0.jpg",
    badge: "Populaire",
    badgeColor: "bg-purple-500",
  },
];

const newArrivals = [
  {
    id: 4,
    name: "Veste en denim premium",
    category: "Vêtements",
    description:
      "Une coupe intemporelle taillée dans un denim de qualité supérieure. Parfaite pour toutes les saisons.",
    price: "64.99 €",
    originalPrice: "94.99 €",
    discount: "-32%",
    rating: 4.7,
    reviews: 156,
    image:
      "https://res.cloudinary.com/duzebhr9l/image/upload/v1760863316/buyitnow/products/qesnmyibwgromdien091.jpg",
    badge: "Nouveau",
    accent: "orange",
  },
  {
    id: 5,
    name: "Lunettes de soleil",
    category: "Accessoires",
    description:
      "Protection UV400 et style contemporain. Une paire indispensable pour affronter le soleil avec élégance.",
    price: "39.99 €",
    originalPrice: "59.99 €",
    discount: "-33%",
    rating: 4.5,
    reviews: 94,
    image:
      "https://res.cloudinary.com/duzebhr9l/image/upload/v1760799022/buyitnow/products/rebakyhsr1zfkvz8r4jt.jpg",
    badge: "Tendance",
    accent: "pink",
  },
];

const categories = [
  {
    label: "Mode",
    icon: ShoppingBag,
    color: "orange",
    href: "/shop?category=mode",
  },
  {
    label: "Montres & Bijoux",
    icon: Watch,
    color: "pink",
    href: "/shop?category=bijoux",
  },
  {
    label: "Électronique",
    icon: Smartphone,
    color: "purple",
    href: "/shop?category=electronique",
  },
  {
    label: "Maison",
    icon: HomeIcon,
    color: "orange",
    href: "/shop?category=maison",
  },
  {
    label: "Sport",
    icon: Dumbbell,
    color: "pink",
    href: "/shop?category=sport",
  },
  {
    label: "Accessoires",
    icon: Gem,
    color: "purple",
    href: "/shop?category=accessoires",
  },
];

const advantages = [
  {
    icon: Truck,
    title: "Livraison rapide",
    description:
      "Commandez avant 14h et recevez votre colis dès le lendemain partout en France.",
    color: "orange",
  },
  {
    icon: RotateCcw,
    title: "Retours gratuits",
    description:
      "Pas satisfait ? Retournez votre commande sous 30 jours, sans frais et sans questions.",
    color: "pink",
  },
  {
    icon: Tag,
    title: "Meilleur prix garanti",
    description:
      "Nous nous alignons sur tout prix inférieur trouvé ailleurs pour le même produit.",
    color: "purple",
  },
  {
    icon: Headphones,
    title: "Support 7j/7",
    description:
      "Notre équipe est disponible tous les jours pour répondre à toutes vos questions.",
    color: "orange",
  },
];

const testimonials = [
  {
    id: 1,
    name: "Sophie M.",
    location: "Paris",
    rating: 5,
    text: "Commande reçue en 24h, emballage soigné et produit exactement comme décrit. Je recommande vivement !",
    initials: "SM",
    accentColor: "bg-orange-500",
  },
  {
    id: 2,
    name: "Thomas R.",
    location: "Lyon",
    rating: 5,
    text: "Service client très réactif, j'avais une question sur ma commande et j'ai eu une réponse en moins d'une heure.",
    initials: "TR",
    accentColor: "bg-pink-500",
  },
  {
    id: 3,
    name: "Camille D.",
    location: "Bordeaux",
    rating: 4,
    text: "Excellent rapport qualité-prix. La veste que j'ai commandée est de très bonne qualité, bien mieux que ce que j'espérais.",
    initials: "CD",
    accentColor: "bg-purple-500",
  },
];

const colorMap = {
  orange: { bg: "bg-orange-100", text: "#ea580c", border: "border-orange-200" },
  pink: { bg: "bg-pink-100", text: "#db2777", border: "border-pink-200" },
  purple: { bg: "bg-purple-100", text: "#9333ea", border: "border-purple-200" },
};

// ─── Sous-composants ────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          color={star <= Math.round(rating) ? "#fb923c" : "#d1d5db"}
          fill={star <= Math.round(rating) ? "#fb923c" : "#d1d5db"}
        />
      ))}
    </View>
  );
}

function SectionHeader({
  eyebrow,
  eyebrowColor = "text-orange-600",
  title,
  highlight,
  description,
}) {
  return (
    <View className="items-center mb-8 px-4">
      <Text
        className={`text-xs font-medium uppercase tracking-wider mb-2 ${eyebrowColor}`}
      >
        {eyebrow}
      </Text>
      <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
        {title} <Text className="text-orange-600">{highlight}</Text>
      </Text>
      {description && (
        <Text className="text-gray-500 text-center text-sm">{description}</Text>
      )}
    </View>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function HomeContent() {
  const router = useRouter();

  return (
    <View className="bg-gray-50">
      {/* Section 1 : Nos Coups de Cœur */}
      <View className="py-10">
        <SectionHeader
          eyebrow="Sélection exclusive"
          title="Nos"
          highlight="Coups de Cœur"
          description="Des produits soigneusement sélectionnés pour vous offrir qualité et style au meilleur prix."
        />

        <View className="px-4 gap-4">
          {featuredProducts.map((product) => (
            <View
              key={product.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
            >
              <View className="relative h-56">
                <Image
                  source={{ uri: product.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View
                  className={`absolute top-3 left-3 ${product.badgeColor} px-2.5 py-1 rounded-full`}
                >
                  <Text className="text-white text-xs font-semibold">
                    {product.badge}
                  </Text>
                </View>
                <View className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-full shadow">
                  <Text className="text-orange-600 text-xs font-bold">
                    {product.discount}
                  </Text>
                </View>
              </View>
              <View className="p-4">
                <Text className="text-xs text-gray-400 mb-1">
                  {product.category}
                </Text>
                <Text className="text-base font-semibold text-gray-800 mb-2">
                  {product.name}
                </Text>
                <View className="flex-row items-center gap-1.5 mb-3">
                  <StarRating rating={product.rating} />
                  <Text className="text-xs text-gray-500">
                    ({product.reviews})
                  </Text>
                </View>
                <View className="flex-row items-baseline gap-2 mb-4">
                  <Text className="text-lg font-bold text-gray-900">
                    {product.price}
                  </Text>
                  <Text className="text-sm text-gray-400 line-through">
                    {product.originalPrice}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/shop")}
                  className="py-2.5 border border-orange-200 rounded-lg items-center"
                >
                  <Text className="text-sm font-medium text-orange-600">
                    Voir le produit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View className="items-center mt-6 px-4">
          <TouchableOpacity
            onPress={() => router.push("/shop")}
            className="flex-row items-center gap-2 px-8 py-3.5 bg-orange-600 rounded-lg"
          >
            <Text className="text-white font-semibold">
              Voir tous nos produits
            </Text>
            <ArrowRight size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 2 : Catégories populaires */}
      <View className="py-10 bg-orange-50">
        <SectionHeader
          eyebrow="Explorez nos rayons"
          eyebrowColor="text-pink-600"
          title="Nos"
          highlight="Catégories"
          description="Trouvez exactement ce que vous cherchez parmi notre large sélection de produits."
        />

        <View className="px-4 flex-row flex-wrap gap-3 justify-between">
          {categories.map((cat) => {
            const { bg, text, border } = colorMap[cat.color];
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.label}
                onPress={() => router.push(cat.href)}
                className={`w-[31%] items-center gap-2 p-4 bg-white rounded-xl border ${border}`}
              >
                <View
                  className={`w-11 h-11 ${bg} rounded-full items-center justify-center`}
                >
                  <Icon size={20} color={text} />
                </View>
                <Text className="text-xs font-medium text-gray-700 text-center">
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Section 3 : Nouveautés */}
      <View className="py-10">
        <SectionHeader
          eyebrow="Vient d'arriver"
          title="Nouveautés de"
          highlight="la semaine"
          description="Découvrez nos dernières arrivées, sélectionnées avec soin pour vous."
        />

        <View className="px-4 gap-4">
          {newArrivals.map((product) => {
            const { bg, text } = colorMap[product.accent];
            return (
              <View
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                <View className="relative h-48">
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View
                    className={`absolute top-3 left-3 ${bg} px-2.5 py-1 rounded-full`}
                  >
                    <Text
                      style={{ color: text }}
                      className="text-xs font-semibold"
                    >
                      {product.badge}
                    </Text>
                  </View>
                </View>
                <View className="p-5">
                  <Text className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                    {product.category}
                  </Text>
                  <Text className="text-lg font-bold text-gray-900 mb-2">
                    {product.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mb-4">
                    {product.description}
                  </Text>
                  <View className="flex-row items-center gap-2 mb-4">
                    <StarRating rating={product.rating} />
                    <Text className="text-xs text-gray-500">
                      ({product.reviews} avis)
                    </Text>
                  </View>
                  <View className="flex-row items-baseline gap-2 mb-5">
                    <Text className="text-xl font-bold text-gray-900">
                      {product.price}
                    </Text>
                    <Text className="text-sm text-gray-400 line-through">
                      {product.originalPrice}
                    </Text>
                    <View className={`${bg} px-2 py-0.5 rounded-full`}>
                      <Text
                        style={{ color: text }}
                        className="text-xs font-bold"
                      >
                        {product.discount}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/shop")}
                    className="flex-row items-center gap-2 px-6 py-2.5 bg-orange-600 rounded-lg self-start"
                  >
                    <Text className="text-white text-sm font-semibold">
                      Découvrir
                    </Text>
                    <ArrowRight size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Section 4 : Pourquoi Buy It Now */}
      <View className="py-10 bg-orange-50">
        <SectionHeader
          eyebrow="Notre engagement"
          eyebrowColor="text-pink-600"
          title="Pourquoi choisir"
          highlight="Buy It Now ?"
          description="Nous mettons tout en œuvre pour vous offrir une expérience shopping irréprochable, de la commande à la livraison."
        />

        <View className="px-4 flex-row flex-wrap gap-3 justify-between">
          {advantages.map((adv) => {
            const { bg, text } = colorMap[adv.color];
            const Icon = adv.icon;
            return (
              <View
                key={adv.title}
                className="w-[48%] items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <View
                  className={`w-12 h-12 ${bg} rounded-full items-center justify-center mb-3`}
                >
                  <Icon size={22} color={text} />
                </View>
                <Text className="text-sm font-semibold text-gray-900 mb-1 text-center">
                  {adv.title}
                </Text>
                <Text className="text-xs text-gray-500 text-center">
                  {adv.description}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Section 5 : Témoignages + CTA */}
      <View className="py-10">
        <SectionHeader
          eyebrow="Ils nous font confiance"
          eyebrowColor="text-purple-600"
          title="Ce que disent"
          highlight="nos clients"
          description="Des milliers de clients satisfaits. Voici ce qu'ils pensent de leur expérience Buy It Now."
        />

        <View className="px-4 gap-4 mb-8">
          {testimonials.map((t) => (
            <View
              key={t.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <Quote size={28} color="#fed7aa" />
              <Text className="text-gray-600 text-sm mt-3 mb-4">
                "{t.text}"
              </Text>
              <View className="flex-row items-center gap-3 pt-3 border-t border-gray-100">
                <View
                  className={`w-9 h-9 ${t.accentColor} rounded-full items-center justify-center`}
                >
                  <Text className="text-white text-xs font-bold">
                    {t.initials}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">
                    {t.name}
                  </Text>
                  <Text className="text-xs text-gray-400">{t.location}</Text>
                </View>
                <StarRating rating={t.rating} />
              </View>
            </View>
          ))}
        </View>

        {/* Bannière CTA */}
        <View className="mx-4 bg-orange-600 rounded-2xl p-6">
          <Text className="text-xs font-medium uppercase tracking-wider text-white/80 mb-2">
            Offre de bienvenue
          </Text>
          <Text className="text-2xl font-bold text-white mb-3">
            Jusqu'à <Text className="text-yellow-300">-40%</Text> sur vos
            premières commandes
          </Text>
          <Text className="text-white/80 mb-6">
            Inscrivez-vous aujourd'hui et profitez de promotions exclusives
            réservées à nos nouveaux membres.
          </Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push("/register")}
              className="bg-white px-6 py-3.5 rounded-lg items-center"
            >
              <Text className="text-orange-600 font-bold">Créer un compte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/shop")}
              className="border border-white px-6 py-3.5 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">
                Explorer la boutique
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
