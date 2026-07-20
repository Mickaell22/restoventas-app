import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/auth.store';

/**
 * Pantalla placeholder para las secciones que se implementan en los proximos
 * dias (Productos, Nueva venta, Historial). Muestra al usuario logueado y un
 * boton de logout para poder probar el flujo de sesion end-to-end.
 */
export default function PlaceholderScreen({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>Próximamente</Text>
      {user && <Text style={styles.user}>Sesión: {user.name}</Text>}
      <TouchableOpacity style={styles.logout} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#18181b' },
  hint: { fontSize: 14, color: '#a1a1aa' },
  user: { fontSize: 14, color: '#52525b', marginTop: 8 },
  logout: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  logoutText: { color: '#ea580c', fontWeight: '600' },
});
