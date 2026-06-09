import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, triggerGlobalLogout, useProtectedRoute } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const apiBaseUrl =
  process.env["EXPO_PUBLIC_API_BASE_URL"] ??
  (process.env["EXPO_PUBLIC_DOMAIN"]
    ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
    : null);

if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl);
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const err = error as { status?: number };
      if (err?.status === 401) {
        triggerGlobalLogout();
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const err = error as { status?: number };
        if (err?.status === 401 || err?.status === 403) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  const colors = useColors();
  useProtectedRoute();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Retour",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="car/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="rental/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
