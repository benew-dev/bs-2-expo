// components/layouts/NavDrawer.js
//
// Équivalent du "menu mobile" du Header web. Sur l'app mobile il n'y a pas
// de distinction desktop/mobile : ce menu plein écran EST le seul menu de
// navigation (NAV_LINKS). Lien actif coloré différemment, comme demandé.

import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { NAV_LINKS, isActiveLink } from "@/helpers/nav";

export default function NavDrawer({ visible, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (href) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable
          className="mt-auto bg-white rounded-t-2xl pt-4 pb-8 px-4"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">Menu</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Fermer le menu"
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {NAV_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <TouchableOpacity
                key={link.href}
                onPress={() => handleNavigate(link.href)}
                className="py-3 border-b border-gray-100"
              >
                <Text
                  className={
                    active
                      ? "text-blue-600 font-semibold text-base"
                      : "text-gray-700 text-base"
                  }
                >
                  {link.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
