// components/layouts/Footer.js (mobile)
//
// Pas de <footer> fixe en bas d'écran sur mobile : ce composant est
// simplement rendu en dernière section du ScrollView de chaque écran, sauf
// l'accueil (/) — même logique que ConditionalFooter côté web.

import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/me", label: "Mon compte" },
  { href: "/cart", label: "Panier" },
];

export default function Footer() {
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <View className="bg-gray-800 px-4 py-6 mt-8">
      <Text className="text-white text-base font-bold mb-2">Buy It Now</Text>
      <Text className="text-gray-300 text-sm mb-5">
        Votre destination pour le shopping en ligne de qualité. Découvrez notre
        vaste sélection de produits à des prix compétitifs.
      </Text>

      <Text className="text-white text-sm font-bold mb-2">Liens utiles</Text>
      <View className="mb-5">
        {LINKS.map((link) => (
          <TouchableOpacity
            key={link.href}
            onPress={() => router.push(link.href)}
            className="py-1"
          >
            <Text className="text-gray-300 text-sm">{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-white text-sm font-bold mb-2">Nous contacter</Text>
      <Text className="text-gray-300 text-sm">Email: contact@buyitnow.com</Text>
      <Text className="text-gray-300 text-sm mb-5">
        Téléphone: +33 1 23 45 67 89
      </Text>

      <View className="border-t border-gray-700 pt-4">
        <Text className="text-gray-400 text-xs text-center">
          © {year} Buy It Now. Tous droits réservés.
        </Text>
      </View>
    </View>
  );
}
