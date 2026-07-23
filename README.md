# RestoVentas — App móvil

App móvil de uso diario para registrar ventas de un restaurante, con toma de pedido por IA en lenguaje natural: el mesero dicta "dos hamburguesas y una cola" y la IA arma el pedido.

> Estado: en desarrollo.

## Stack

- Expo (React Native) + TypeScript
- React Navigation (stack + tabs)
- Zustand (estado)
- Axios (cliente API)
- Backend: [restoventas-backend](https://github.com/Mickaell22/restoventas-backend) (NestJS + PostgreSQL + JWT)

## Funcionalidades previstas

- Login con JWT (token en SecureStore)
- CRUD de productos
- Flujo de venta con carrito (buscar productos, cantidades, subtotales, total)
- Historial de ventas y tarjetas de totales (hoy / semana)
- Pedido por IA: texto o dictado -> `POST /ai/parse-order` -> carrito precargado

## Estructura

```
src/
  api/          cliente Axios (interceptor de token) y llamadas al backend
  store/        estado global con Zustand (sesión persistida en SecureStore)
  screens/      pantallas (Login, Productos, Nueva venta, Historial)
  navigation/   stack + tabs (muestra Login o la app según haya sesión)
  components/   componentes reutilizables
  lib/          lógica pura reutilizable (rangos de fecha) con su self-check
```

Los self-checks de la lógica pura corren sin framework:

```bash
npx tsx src/store/cart.logic.test.ts
npx tsx src/lib/date-range.test.ts
```

## Cómo correr

```bash
npm install
cp .env.example .env    # ajustar EXPO_PUBLIC_API_URL a la URL del backend
npx expo start
```

> Emulador Android: usa `http://10.0.2.2:3000`. Dispositivo físico: la IP LAN de tu PC.

Requiere el backend corriendo (ver README del backend).
