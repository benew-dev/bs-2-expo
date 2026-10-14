// components/layouts/Header.js (mobile)

import { useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Menu, ShoppingCart, User, Heart } from "lucide-react-native";
import CartContext from "@/context/CartContext";
import AuthContext from "@/context/AuthContext";
import { signOut, useSession } from "@/lib/auth-client";
import NavDrawer from "./NavDrawer";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Équivalent du UserDropdown web : modal plutôt que dropdown positionné,
// plus adapté au tactile mobile.
function UserMenu({ visible, onClose, user, onSignOut }) {
  const router = useRouter();

  const menuItems = [
    { href: "/me", label: "Mon profil" },
    { href: "/me/orders", label: "Mes commandes" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/30" onPress={onClose}>
        <View className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 w-48">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.href}
              onPress={() => {
                onClose();
                router.push(item.href);
              }}
              className="px-4 py-3 border-b border-gray-100"
            >
              <Text className="text-sm text-gray-700">{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onSignOut();
            }}
            className="px-4 py-3"
          >
            <Text className="text-sm text-red-600">Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function Header() {
  const { user } = useContext(AuthContext);
  const { data } = useSession();

  const { setCartToState, cartCount, clearCartOnLogout } =
    useContext(CartContext);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const isCartLoadingRef = useRef(false);
  const router = useRouter();

  const loadCart = useCallback(async () => {
    if (isCartLoadingRef.current) return;
    try {
      isCartLoadingRef.current = true;
      await setCartToState();
    } catch (error) {
      if (!IS_PRODUCTION) {
        console.error("Error loading cart:", error);
      }
    } finally {
      isCartLoadingRef.current = false;
    }
  }, [setCartToState]);

  useEffect(() => {
    if (data) {
      loadCart();
    }
  }, [data, loadCart]);

  // CORRECTIF (adaptation) : window.location.href n'existe pas en React
  // Native. router.replace() évite d'empiler /login au-dessus d'un écran
  // qui dépendait encore de la session (même logique que pour les
  // redirections de commande).
  const handleSignOut = useCallback(async () => {
    try {
      clearCartOnLogout();
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/login");
          },
        },
      });
    } catch (error) {
      if (!IS_PRODUCTION) {
        console.error("Erreur lors de la déconnexion:", error);
      }
      router.replace("/login");
    }
  }, [clearCartOnLogout, router]);

  const favoritesCount = user?.favorites?.length || 0;

  return (
    <View className="bg-white border-b border-gray-200 pt-12 pb-2">
      <View className="flex-row items-center justify-between px-4">
        {/* Logo */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          accessibilityLabel="Accueil"
        >
          <Text className="text-lg font-bold text-blue-600">BuyItNow</Text>
          {/* Remplacer par <Image source={require("@/assets/images/logo.png")} .../>
              dès que l'asset du logo est ajouté au projet. */}
        </TouchableOpacity>

        {/* Icônes */}
        <View className="flex-row items-center gap-4">
          {user && (
            <TouchableOpacity
              onPress={() => router.push("/favorites")}
              accessibilityLabel="Mes favoris"
              className="relative"
            >
              <Heart size={24} color="#374151" />
              {favoritesCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-pink-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                  <Text className="text-white text-xs font-medium">
                    {favoritesCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push("/cart")}
            accessibilityLabel="Panier"
            className="relative"
          >
            <ShoppingCart size={24} color="#374151" />
            {cartCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                <Text className="text-white text-xs font-medium">
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {user ? (
            <TouchableOpacity
              onPress={() => setUserMenuOpen(true)}
              accessibilityLabel="Menu utilisateur"
            >
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200">
                  <User size={18} color="#374151" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/login")}
              accessibilityLabel="Connexion"
            >
              <User size={24} color="#374151" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setNavDrawerOpen(true)}
            accessibilityLabel="Ouvrir le menu"
          >
            <Menu size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <UserMenu
        visible={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        user={user}
        onSignOut={handleSignOut}
      />
      <NavDrawer
        visible={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
      />
    </View>
  );
}
