# Proyecto Base — Parcial Práctico Backend (NestJS + MongoDB)

API REST en NestJS y Mongoose para la gestión de **Usuarios (`/users`)** y **Tareas (`/tasks`)**.

---

## Requisitos Previos

- **Node.js** 18+ y **npm**
- **Docker Desktop** (o instancia local de MongoDB en el puerto `27017`)

---

## Instalación y Puesta en Marcha

1. **Levantar la base de datos MongoDB:**
   ```bash
   docker compose up -d
   ```
   *(Si utilizas una instancia local o MongoDB Atlas diferente a `mongodb://localhost:27017/nest-parcial`, configura la variable `MONGODB_URI` en un archivo `.env` tomando como base `.env.example`.)*

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Iniciar la aplicación en modo desarrollo:**
   ```bash
   npm run start:dev
   ```
   El servidor quedará disponible en `http://localhost:3000`.

---

## Pruebas y Validación

- **Ejecutar pruebas unitarias:**
  ```bash
  npm test
  ```
- **Ejecutar pruebas end-to-end:**
  ```bash
  npm run test:e2e
  ```
- **Verificar compilación y linter:**
  ```bash
  npm run build
  npm run lint
  ```

---

## Endpoints del Sistema

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Público | Verificación básica del servidor |
| `POST` | `/users` | Público | Crear usuario (`name`, `email`) |
| `GET` | `/users` | Público | Listar usuarios registrados |
| `GET` | `/users/:id` | Público | Consultar usuario por ID |
| `GET` | `/tasks` | Público | Listar tareas registradas |
| `GET` | `/tasks/:id` | Público | Consultar tarea por ID |
| `POST` | `/tasks` | Restringido (`Authorization: admin-secret-token`) | Crear una tarea asociada a un usuario |

También puedes importar `nest-parcial.postman_collection.json` en Postman o utilizar `requests.http` con la extensión REST Client de VS Code para probar manualmente los endpoints.

---

## Evidencia de funcionamiento

### Caso 1 - Propiedades no permitidas al crear una tarea

- Se creo el DTO `CreateTaskDto` (`src/tasks/dto/create-task.dto.ts`) con solo los campos permitidos: `title`, `description`, `completed` y `userId`, usando decoradores de class-validator y class-transformer.
- En `main.ts` se configuro el `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`.
- En el esquema de tareas se cambio `strict: false` por `strict: true` para que Mongoose no guarde campos que no estan en el modelo.

Resultado: al enviar el POST con `isAdmin`, `role` e `internalFlag` la API responde **400 Bad Request** y no se guarda nada en la base de datos.

```json
{
  "message": [
    "property isAdmin should not exist",
    "property role should not exist",
    "property internalFlag should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Caso 2 - Acceso directo a la coleccion de usuarios

- `UsersModule` ahora exporta `UsersService` (`exports: [UsersService]`).
- Se quito `UserSchema` / `UserModel` del `TasksModule`.
- `TasksModule` importa `UsersModule` y `TasksService` usa `usersService.findById()` para verificar que el usuario exista.

Resultado: si el usuario no existe se responde **404 Not Found** (`Usuario con ID ... no encontrado`) y si existe la tarea se crea normal.

### Caso 3 - GET /tasks bloqueado por el middleware

- Se elimino `AuthMiddleware` y su registro en `AppModule`.
- Se creo `AuthGuard` (`src/common/guards/auth.guard.ts`) que valida la cabecera `Authorization: admin-secret-token` y lanza `ForbiddenException` si no es valida.
- El guard se aplica con `@UseGuards(AuthGuard)` solo sobre `POST /tasks`.

Resultado:

| Peticion | Respuesta |
| :--- | :--- |
| `GET /tasks` sin cabeceras | 200 OK |
| `GET /tasks/:id` sin cabeceras | 200 OK |
| `POST /tasks` sin token | 403 Forbidden |
| `POST /tasks` con `Authorization: admin-secret-token` | 201 Created |

### Caso 4 - Controlador con modelos inyectados

- Se quitaron `TaskModel` y `UserModel` del constructor de `TasksController`, ahora solo depende de `TasksService`.
- La logica de crear la tarea (validar el usuario y guardar) se movio al metodo `create` de `TasksService`.
- El endpoint `POST /tasks` solo recibe el `CreateTaskDto` y llama a `tasksService.create()`.
- Se agregaron las pruebas `tasks.controller.spec.ts` (mockeando solo `TasksService`) y `tasks.service.spec.ts` (mockeando el modelo y `UsersService`).

Resultado: `npm test` pasa sin errores de dependencias (3 suites, 8 tests) y la cobertura ya muestra uso del metodo `create` de `TasksService`.
