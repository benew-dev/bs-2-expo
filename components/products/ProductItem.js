// components/products/ProductItem.js (mobile)
// Équivalent de components/products/ProductItem.jsx.
//
// Adaptations :
// - toast (react-toastify) → showToast (lib/toast.js).
// - <Link>/<Image> (next/link, next/image) → Pressable + router.push,
//   <Image> React Native.
// - lucide-react (web) → lucide-react-native, pour rester cohérent avec le
//   reste de l'app mobile (Hero, Header, NavDrawer, HomeContent).
// - Couleur d'accent : orange-600 (thème mobile établi) plutôt que
//   blue-600 (web), pour rester cohérent avec Hero/HomeContent.
// - Route de détail supposée "/product/[id]" (aucun écran détail fourni à
//   ce stade — à ajuster si la vraie route diffère).
//
// CORRECTIF (par rapport au web) : le web fait
// `if (!product...) return null;` AVANT les hooks (useMemo/useCallback),
// ce qui viole les Rules of Hooks (ne casse rien en pratique uniquement
// parce que product est toujours valide quand ce composant est monté via
// .map() sur un tableau non vide). Ici, le court-circuit est déplacé après
// les hooks pour ne jamais dépendre de cette hypothèse implicite.

import { memo, useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Heart, ImageOff, ShoppingCart } from "lucide-react-native";
import CartContext from "@/context/CartContext";
import AuthContext from "@/context/AuthContext";
import { INCREASE } from "@/helpers/constants";
import { formatPrice } from "@/lib/format";
import { showToast } from "@/lib/toast";

const ProductItem = memo(({ product }) => {
  const router = useRouter();
  const { addItemToCart, updateCart, cart } = useContext(CartContext);
  const { user, toggleFavorite } = useContext(AuthContext);

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const isValidProduct = Boolean(product && typeof product === "object");

  const productId = isValidProduct ? product._id || "" : "";
  const productName = isValidProduct ? product.name || "Produit sans nom" : "";
  const productPrice = isValidProduct ? product.price || 0 : 0;
  const productCategory = isValidProduct
    ? product.category?.categoryName || "Non catégorisé"
    : "";
  const inStock = isValidProduct ? product.stock > 0 : false;
  const imageUrl = isValidProduct ? product.images?.[0]?.url : null;

  const isFavorite = useMemo(() => {
    if (!user?.favorites || !Array.isArray(user.favorites)) return false;
    return user.favorites.some(
      (fav) => fav.productId?.toString() === productId,
    );
  }, [user, productId]);

  const addToCartHandler = useCallback(() => {
    if (!user) {
      showToast("Connectez-vous pour ajouter des articles à votre panier !");
      return;
    }

    try {
      const isProductInCart = cart.find((i) => i?.productId === productId);

      if (isProductInCart) {
        updateCart(isProductInCart, INCREASE);
      } else {
        addItemToCart({ product: productId });
      }
    } catch (error) {
      console.error("Erreur d'ajout au panier:", error);
      showToast("Impossible d'ajouter au panier. Veuillez réessayer.");
    }
  }, [user, cart, productId, updateCart, addItemToCart]);

  const toggleFavoriteHandler = useCallback(async () => {
    if (favoriteLoading) return;

    if (!user) {
      showToast("Connectez-vous pour ajouter des produits à vos favoris !");
      return;
    }

    setFavoriteLoading(true);
    try {
      const productImage = product?.images?.[0] || {
        public_id: null,
        url: null,
      };
      await toggleFavorite(productId, productName, productImage);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("Erreur lors de la mise à jour des favoris");
    } finally {
      setFavoriteLoading(false);
    }
  }, [
    user,
    productId,
    productName,
    product?.images,
    toggleFavorite,
    favoriteLoading,
  ]);

  if (!isValidProduct) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push(`/product/${productId}`)}
      className="relative w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm active:opacity-90"
      accessibilityLabel={`Voir les détails du produit : ${productName}`}
    >
      {/* Badge de stock */}
      {!inStock && (
        <View className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 shadow">
          <Text className="text-xs font-semibold text-white">
            Rupture de stock
          </Text>
        </View>
      )}

      {/* Bouton Favoris */}
      <Pressable
        onPress={toggleFavoriteHandler}
        disabled={favoriteLoading}
        className={`absolute right-3 top-3 z-10 rounded-full p-2 shadow ${
          isFavorite ? "bg-pink-50" : "bg-white/90"
        } ${favoriteLoading ? "opacity-60" : ""}`}
        accessibilityLabel={
          isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
        }
        accessibilityState={{ busy: favoriteLoading }}
      >
        {favoriteLoading ? (
          <ActivityIndicator size="small" color="#ec4899" />
        ) : (
          <Heart
            size={18}
            color={isFavorite ? "#ec4899" : "#374151"}
            fill={isFavorite ? "#ec4899" : "transparent"}
          />
        )}
      </Pressable>

      {/* Image du produit */}
      <View className="h-48 w-full items-center justify-center bg-white p-2">
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            accessibilityLabel={productName}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-gray-50">
            <ImageOff size={32} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* Contenu */}
      <View className="gap-2 p-4">
        <View className="self-start rounded-full bg-orange-50 px-2 py-0.5">
          <Text className="text-xs font-medium text-orange-700">
            {productCategory}
          </Text>
        </View>

        <Text
          className="min-h-[40px] text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {productName}
        </Text>

        <Text className="text-xl font-bold text-gray-900">
          {formatPrice(productPrice)}
        </Text>

        <Pressable
          onPress={addToCartHandler}
          disabled={!inStock}
          className={`mt-1 flex-row items-center justify-center gap-2 rounded-lg px-3 py-2.5 ${
            inStock ? "bg-orange-600 active:bg-orange-700" : "bg-gray-200"
          }`}
          accessibilityLabel={
            inStock ? "Ajouter au panier" : "Produit indisponible"
          }
          accessibilityState={{ disabled: !inStock }}
        >
          <ShoppingCart size={16} color={inStock ? "#ffffff" : "#6b7280"} />
          <Text
            className={`text-sm font-medium ${
              inStock ? "text-white" : "text-gray-500"
            }`}
          >
            {inStock ? "Ajouter au panier" : "Indisponible"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

ProductItem.displayName = "ProductItem";

export default ProductItem;
