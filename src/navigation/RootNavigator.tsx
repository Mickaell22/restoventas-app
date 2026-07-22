import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import ProductsScreen from '../screens/ProductsScreen';
import { useAuthStore } from '../store/auth.store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#ea580c' }}>
      <Tab.Screen name="Productos" component={ProductsScreen} />
      <Tab.Screen name="Nueva venta">
        {() => <PlaceholderScreen title="Nueva venta" />}
      </Tab.Screen>
      <Tab.Screen name="Historial">
        {() => <PlaceholderScreen title="Historial" />}
      </Tab.Screen>
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
