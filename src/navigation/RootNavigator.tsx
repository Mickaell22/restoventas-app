import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import NewSaleScreen from '../screens/NewSaleScreen';
import ProductsScreen from '../screens/ProductsScreen';
import { useAuthStore } from '../store/auth.store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Icono base por pestaña; el sufijo -outline se usa cuando no esta activa.
const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Productos: 'fast-food',
  'Nueva venta': 'cart',
  Historial: 'receipt',
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: '#71717a',
        tabBarIcon: ({ color, size, focused }) => {
          const base = TAB_ICONS[route.name] ?? 'ellipse';
          const name = (
            focused ? base : `${base}-outline`
          ) as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Productos" component={ProductsScreen} />
      <Tab.Screen name="Nueva venta" component={NewSaleScreen} />
      <Tab.Screen name="Historial" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="App" component={AppTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
