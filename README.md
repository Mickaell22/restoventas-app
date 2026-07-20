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

## Cómo correr

```bash
npm install
npx expo start
```

Requiere el backend corriendo (ver README del backend).
