// app/_layout.js

import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

// NOTE : les providers Auth/Cart/Order seront ajoutés ici dès que
// context/AuthContext.js, context/CartContext.js et context/OrderContext.js
// seront créés (prochaine étape). Pour l'instant, layout minimal pour
// vérifier que le projet démarre correctement avec expo-router + nativewind.

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
