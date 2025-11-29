import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/hooks/useAuth';
import '@/i18n'; // Initialize i18n

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            title: 'Login',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="auth/signup" 
          options={{ 
            title: 'Sign Up',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="profile/edit-profile" 
          options={{ 
            title: 'Edit Profile',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="profile/notifications" 
          options={{ 
            title: 'Notifications',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="profile/notification-settings" 
          options={{ 
            title: 'Notification Settings',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="profile/rules" 
          options={{ 
            title: 'Rules & Help',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="profile/select-country" 
          options={{ 
            title: 'Select Country',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="profile/select-city" 
          options={{ 
            title: 'Select City',
            headerShown: true,
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}
