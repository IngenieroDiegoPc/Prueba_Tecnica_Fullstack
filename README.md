# Sistema de gestión de clientes, productos y órdenes

Solución full-stack para la prueba técnica de DTrueStar: una API REST con persistencia en PostgreSQL y una interfaz web que permite administrar clientes, categorías, productos y órdenes.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Backend | Java 17, Spring Boot 4.0.10, Spring Data JPA (Hibernate), Bean Validation, Lombok, Flyway, Maven Wrapper |
| Base de datos | PostgreSQL 17 (Docker Compose) |
| Frontend | React, Vite, Tailwind CSS v4, React Router, Axios |

## Estructura del repositorio

```
.
├── backend/            API REST (Spring Boot)
├── frontend/           Interfaz web (React + Vite)
├── docker-compose.yml  Base de datos PostgreSQL
└── README.md
```

## Requisitos previos

- JDK 17 o superior
- Node.js 20 o superior y npm
- Docker Desktop (o Docker Engine con Compose)
- Git

## Cómo ejecutar el proyecto

Abrir tres terminales, una para cada componente.

### 1. Base de datos

Desde la raíz del repositorio:

```bash
docker compose up -d
```

Levanta PostgreSQL 17 en `localhost:5432` con la base `ordersdb`. Los datos se guardan en el volumen `pgdata`.

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run        # Linux / macOS
.\mvnw spring-boot:run        # Windows (PowerShell)
```

La API queda en `http://localhost:8080/api`. Al arrancar, Flyway crea las tablas automáticamente.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

En Windows PowerShell, si la política de ejecución bloquea `npm`, usar `npm.cmd run dev`.

La interfaz queda en `http://localhost:5173`. Debe usarse ese puerto: es el origen que el backend permite por defecto (ver variables de entorno).

## Variables de entorno

Todas son opcionales: tienen un valor por defecto pensado para desarrollo local.

| Variable | Componente | Valor por defecto | Descripción |
|---|---|---|---|
| `DB_NAME` | Backend y Docker | `ordersdb` | Nombre de la base de datos |
| `DB_USER` | Backend y Docker | `postgres` | Usuario de la base de datos |
| `DB_PASSWORD` | Backend y Docker | `postgres` | Contraseña de la base de datos |
| `CORS_ALLOWED_ORIGINS` | Backend | `http://localhost:5173` | Origen permitido para el frontend |
| `VITE_API_URL` | Frontend | `http://localhost:8080/api` | URL base de la API |

Las credenciales no están escritas en el código: se leen de variables de entorno, y los valores por defecto son solo para desarrollo. Para un entorno real deben sobrescribirse. Ejemplo en PowerShell:

```powershell
$env:DB_PASSWORD = "una-clave-segura"
docker compose up -d
```

## Base de datos

- El esquema se crea con una migración de Flyway: `backend/src/main/resources/db/migration/V1__create_schema.sql`.
- Hibernate trabaja con `ddl-auto=validate`: solo verifica que el esquema coincida con las entidades y nunca lo modifica.
- Tablas: `customer`, `category`, `product`, `orders` y `order_item`, con claves foráneas y restricciones `CHECK` y `UNIQUE` (correo del cliente, código del producto, nombre de la categoría, número de orden).
- Para reiniciar la base desde cero: `docker compose down -v` y luego `docker compose up -d`.

## API REST

Todas las rutas cuelgan de `/api`. Las listas son paginadas (`page`, `size`).

| Recurso | Ruta | Filtros |
|---|---|---|
| Clientes | `/api/customers` | `search` (nombre o correo) |
| Categorías | `/api/categories` | `search`, `status` |
| Productos | `/api/products` | `search`, `categoryId`, `available` |
| Órdenes | `/api/orders` | `status`, `customerId` |
| Estado de una orden | `PATCH /api/orders/{id}/status` | — |

Cada recurso ofrece las operaciones de creación, consulta, actualización y eliminación.

### Formato de errores

Todos los errores usan la misma estructura:

```json
{
  "timestamp": "2026-11-24T08:09:36.0752859",
  "status": 409,
  "error": "Conflict",
  "message": "Una orden PAID ya no puede cambiar de estado",
  "details": null
}
```

| Código | Cuándo |
|---|---|
| 400 | Validación de entrada fallida (`details` lista los campos) |
| 404 | El recurso no existe |
| 409 | Conflicto con una regla de negocio |

## Arquitectura

**Backend.** Organizado por dominio (`customer`, `category`, `product`, `order`, `common`), y cada dominio en capas: `Controller` (HTTP), `Service` (reglas de negocio y transacciones), `Repository` (acceso a datos) y DTOs `record` para entrada y salida, de modo que las entidades JPA no se exponen en la API. `GlobalExceptionHandler` centraliza el manejo de errores y `CorsConfig` el CORS.

**Frontend.** `api/` (llamadas HTTP, una por recurso), `pages/` (una pantalla por recurso) y `components/` (piezas reutilizables). Cada pantalla valida el formulario antes de enviarlo y muestra tanto los errores del cliente como los mensajes que devuelve el servidor.

## Decisiones técnicas

- **Total de la orden calculado en el servidor.** El cliente envía solo producto y cantidad; el total nunca se acepta desde el frontend. La pantalla muestra un total estimado y el definitivo lo devuelve la API.
- **Precio congelado.** Cada línea de la orden (`order_item`) guarda `unit_price` y `subtotal` al momento de la compra, así que cambiar el precio del catálogo no altera las órdenes existentes.
- **Creación de órdenes transaccional.** La orden y sus líneas se guardan en una sola transacción: o se crea todo o nada.
- **Eliminación segura.** Los clientes se desactivan en lugar de borrarse; las categorías se desactivan por estado; los productos solo se eliminan si no participan en órdenes.
- **Flyway + `ddl-auto=validate`.** El esquema es reproducible y versionado; Hibernate no lo altera.
- **Entidad `CustomerOrder`.** La tabla se llama `orders` y la clase `CustomerOrder` porque `ORDER` es palabra reservada en SQL.
- **Búsqueda con JPA Specifications** para combinar filtros opcionales sin escribir consultas por cada combinación.
- **CORS configurable** por variable de entorno en lugar de abrir todos los orígenes.

## Reglas de negocio

**Clientes**
- El correo es único; un correo repetido devuelve 409.
- "Eliminar" desactiva al cliente (borrado lógico) y conserva su historial de órdenes.

**Categorías**
- El nombre es único.
- No se puede desactivar una categoría que tiene productos (409).

**Productos**
- El código es único y el precio debe ser mayor que 0.
- No se puede crear ni asignar un producto a una categoría inactiva (409).
- No se puede eliminar un producto que ya aparece en una orden (409).

**Órdenes**
- Se asocian a un cliente y contienen una o más líneas con producto y cantidad (entero mayor o igual a 1).
- Estados: `CREATED`, `PAID` y `CANCELLED`. Desde `CREATED` se puede pasar a `PAID` o a `CANCELLED`; los estados `PAID` y `CANCELLED` son finales y cualquier cambio posterior devuelve 409.
- `DELETE` sobre una orden la cancela en lugar de borrarla.
- El número de orden se genera en el servidor con el formato `ORD-AAAAMMDD-NNNN`.

## Supuestos y limitaciones

- No hay autenticación ni autorización: queda fuera del alcance de la prueba.
- No se maneja inventario: el producto solo tiene una marca de disponibilidad.
- Una sola moneda (pesos colombianos en la interfaz) y sin impuestos ni descuentos.
- El número de orden es secuencial por día; con mucha concurrencia convendría reemplazarlo por una secuencia de base de datos.
- La base de datos se espera en `localhost:5432` (no hay variable para el host).
- La validación se hizo manualmente y está documentada en el PDF de evidencias; la cobertura de pruebas automáticas es mínima.

## Evidencias

El documento de evidencias de ejecución (casos válidos y no válidos, integración frontend-backend y persistencia) está en `docs/evidencias.pdf`.