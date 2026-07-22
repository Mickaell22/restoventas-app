@AGENTS.md

# RestoVentas — App movil (CLAUDE.md)

App Expo (React Native) + TypeScript, SDK 57. Consume el backend NestJS
(repo `restoventas-backend`). Aca van decisiones e invariantes (el "por que"),
no el changelog. Para instalar/correr, ver `README.md`.

## Stack y estructura
- Navegacion: React Navigation (stack de auth + bottom tabs). `src/navigation/RootNavigator.tsx`.
- Estado: Zustand. Sesion en `src/store/auth.store.ts`.
- HTTP: Axios centralizado en `src/api/client.ts`.
- Carpetas: `src/screens`, `src/api`, `src/store`, `src/navigation`.

## Decisiones / gotchas
- **Cliente API unico** (`src/api/client.ts`): un interceptor adjunta el JWT a
  cada request y, ante un 401, limpia la sesion (logout). `baseURL` viene de
  `EXPO_PUBLIC_API_URL`. No crear instancias de Axios sueltas.
- **`EXPO_PUBLIC_*` se inyecta en tiempo de bundle de Metro.** Cambiar el `.env`
  NO se refleja con Fast Refresh: hay que reiniciar Metro con `expo start -c`.
- **Sesion persistida en SecureStore** (token + user). `hydrate` tolera JSON
  corrupto: si el user guardado no parsea, arranca sin sesion en vez de dejar la
  app trabada en el splash.
- **Marca:** naranja `#ea580c`. La app es **light-only** (`userInterfaceStyle: "light"`
  en `app.json`); no hay modo oscuro, asi que los hallazgos de theming/dark-mode
  no aplican mientras siga siendo light-only.
- **Iconos:** `@expo/vector-icons` con **import directo** por set
  (`import Ionicons from '@expo/vector-icons/Ionicons'`) para no arrastrar el
  barrel completo.
- **Logo:** las fuentes vectoriales editables estan en `assets/logo/*.svg`; los
  PNG de la app (icon, adaptive, splash, favicon) se regeneran con `rsvg-convert`.

## Probar en el telefono (ver tambien AGENTS.md)
- **Por WiFi (preferido, sin cable):** poner `EXPO_PUBLIC_API_URL=http://<IP_LAN_PC>:3000`
  en `.env`, correr `expo start` (SIN `--android`) y en Expo Go abrir manualmente
  `exp://<IP_LAN_PC>:8081`. El telefono y la PC deben estar en la misma WiFi y la
  PC corriendo Metro + backend. Fast Refresh actualiza los cambios de codigo solo.
- **SDK 57 exige Expo Go 57** (no el de Play Store, que puede ir atrasado).
- App 100% standalone (sin PC) = EAS Build + backend desplegado; pendiente Dia 7.
