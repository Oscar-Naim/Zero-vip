# LYAXIS labs™ — ZERO VIP Gatekeeper (All-in-One Vercel Edition)

> **Bóveda Criptográfica y Consola de Administración Táctica Privada**  
> Diseñada para **Oscar Naim Ambrocio Aguirre (Fundador de LYAXIS labs™)**  
> Emisión, Almacenamiento, Gestión y Validación Atómica de Tokens `LYX-XXX-XXX` y Hito Inaugural `ZERO VIP 30`.

---

## 🛡️ Principios Arquitectónicos y Restricciones Críticas
1. **100% Nativo en Vercel:** Todo el stack (Frontend React 19, Next.js 15 App Router, Middlewares en el Edge, Route Handlers y Base de Datos) opera exclusivamente dentro del ecosistema Vercel.
2. **CERO RENDER, CERO SUPABASE:** Cumplimiento estricto. La persistencia utiliza **Vercel Postgres** (`@vercel/postgres` / SQL nativo) con migraciones automáticas autogestionadas. Cuenta con un adaptador seguro en memoria para pruebas locales inmediatas con cero configuración externa.
3. **Escalabilidad Sin Límites:** Arquitectura lista para soportar miles de registros organizados por Tiers (`zero_vip_30`, `early_access`, `developer`, `partner`, `internal_core`), con control estricto del cupo para los 30 creadores inaugurales del 17 de octubre.
4. **Defensa Perimetral Zero-Trust:** Acceso exclusivo Founder-Only mediante comparación en tiempo constante (`crypto.timingSafeEqual`), sesiones JWT firmadas con HMAC-SHA256 (`jose`) en cookies `HttpOnly`, y Rate Limiting estricto por IP (máximo 5 intentos fallidos por ventana de 15 minutos).

---

## 🔐 1. Seguridad Defensiva de Grado Militar

### Autenticación del Fundador
- **Llave Maestra:** Configurable mediante `GATEKEEPER_MASTER_KEY`.
- **Mitigación de Side-Channel Attacks:** Se aplica `crypto.timingSafeEqual` sobre digests SHA-256 de longitud uniforme para erradicar ataques de análisis de tiempo.
- **Sesión Criptográfica:** Emisión de tokens JWT con algoritmo HS256 (`jose`), issuer `lyaxis:gatekeeper`, audience `lyaxis:admin`, expiración estricta de 2 horas en cookie `SameSite=Strict`, `HttpOnly`, `Secure`.

### Blindaje Perimetral y Anti-Fuerza Bruta
- `src/middleware.ts`: Intercepta peticiones hacia `/admin/*`, `/api/keys/*` y `/api/auth/login`.
- **Sliding-Window Limiter:** Tras 5 intentos fallidos en 15 minutos, la IP queda bloqueada automáticamente devolviendo HTTP `429 Too Many Requests` con cabecera `Retry-After`.

### Cabeceras HTTP (`next.config.ts`)
- `Content-Security-Policy`: Restricción estricta de fuentes de script, frames y estilos.
- `Strict-Transport-Security`: HSTS con `max-age=63072000; includeSubDomains; preload`.
- `X-Frame-Options: DENY` (anti-clickjacking).
- `X-Content-Type-Options: nosniff` (anti-MIME sniffing).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `poweredByHeader: false` (elimina huellas digitales de Next.js).

---

## 🗄️ 2. Esquema de Base de Datos (Vercel Postgres SQL)

El sistema autoejecuta las migraciones en la inicialización o puedes ejecutarlas manualmente en la consola de Vercel Storage:

```sql
-- 1. Tabla de llaves de acceso
CREATE TABLE IF NOT EXISTS access_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(11) UNIQUE NOT NULL, -- Formato: LYX-XXX-XXX
    tier VARCHAR(50) NOT NULL DEFAULT 'early_access', -- 'zero_vip_30', 'early_access', 'developer', 'partner', 'internal_core'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'claimed', 'revoked', 'expired'
    max_uses INT NOT NULL DEFAULT 1,
    current_uses INT NOT NULL DEFAULT 0,
    assigned_to_name VARCHAR(150),
    assigned_to_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100) DEFAULT 'Oscar Naim (Founder)'
);

-- 2. Tabla de auditoría forense
CREATE TABLE IF NOT EXISTS token_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID REFERENCES access_keys(id) ON DELETE CASCADE,
    token_text VARCHAR(11) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL, -- IP anonimizada con hash SHA-256 por privacidad
    action VARCHAR(50) NOT NULL, -- 'VERIFIED', 'CLAIMED', 'REVOKED', 'FAILED'
    success BOOLEAN NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_lookup ON access_keys(token);
CREATE INDEX IF NOT EXISTS idx_token_status ON access_keys(status);
CREATE INDEX IF NOT EXISTS idx_token_tier ON access_keys(tier);
CREATE INDEX IF NOT EXISTS idx_audit_created ON token_audit_logs(created_at DESC);
```

---

## 🎲 3. Generador Criptográfico de Tokens
- Formato: `LYX-XXX-XXX`
- Alfabeto seguro (32 caracteres de alta entropía):
  `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (Excluye `0/O` y `1/I` para eliminar ambigüedades visuales en activaciones de usuarios).
- Detección y resolución automática de colisiones previa a inserción.

---

## 🖥️ 4. Interfaz Táctica Cyber-Premium
- **Tema:** Dark Void puro (`#050505`) con malla de cuadrícula táctica cibernética (`bg-cyber-grid`), Electric Blue (`#2563FF`), Cyan Glow (`#00D9FF`) y Púrpura de IA (`#7C3AED`).
- **Módulos:**
  - **Terminal Biométrica de Acceso:** Login futurista con escáner táctil, indicador de intentos y countdown reactivo de desbloqueo.
  - **Barra de Telemetría Superior:** Reloj militar UTC en tiempo real, estados de `VERCEL SERVERLESS ONLINE`, `POSTGRES ACTIVE`, perfil del Fundador y control de sonido sintético táctil (Web Audio API nativo).
  - **HUD Cards de Métricas:** Medidor visual del cupo `ZERO VIP 30` (X / 30 Asignados con barra de progreso en cian brillante), total de tokens, llaves reclamadas y llaves revocadas.
  - **Bóveda de Emisión (Modal Drawer):** Modo individual (nombre, correo, tier, usos, notas, fecha) y Modo Batch (1 a 100 llaves con un clic, descarga instantánea en CSV y JSON).
  - **Data Grid Táctico:** Buscador difuso en tiempo real, filtros por pestañas, botones de copiar, revocar, resetear usos, eliminar y exportar a CSV/JSON.
  - **Simulador Sandbox LYAXIS IA:** Consola interactiva integrada para validar tokens en vivo contra `/api/v1/keys/verify` mostrando latencia en ms y payload JSON.
  - **Auditoría Forense:** Drawer lateral para examinar logs con IP Hashes SHA-256.

---

## 🚀 5. Endpoints de la API Implementados

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público (Rate-Limited) | Valida `GATEKEEPER_MASTER_KEY` con timingSafeEqual y setea cookie JWT. |
| `POST` | `/api/auth/logout` | Sesión | Destruye la sesión de forma segura. |
| `GET` | `/api/auth/session` | Público | Consulta el estado de autenticación y de la base de datos. |
| `GET` | `/api/keys` | Fundador | Lista filtrada y paginada con métricas en tiempo real. |
| `POST` | `/api/keys/generate` | Fundador | Emisión individual o en lote (1-100) con control de cupo VIP. |
| `PATCH` | `/api/keys/[id]` | Fundador | Modifica estado, revoca o resetea usos. |
| `DELETE` | `/api/keys/[id]` | Fundador | Eliminación permanente de llave. |
| `POST` | `/api/setup/migrate` | Fundador | Ejecuta verificación y creación de tablas en Vercel Postgres. |
| `GET` | `/api/system/health` | Público | Telemetría en vivo, región de servidor Vercel y estado de seguridad. |
| `POST` | `/api/v1/keys/verify` | Servicio / IA | **Endpoint de Consumo de LYAXIS IA**. Validación y canje atómico con transacción SQL y registro forense. |

### Ejemplo de Consumo desde LYAXIS IA:
```bash
curl -X POST https://tu-dominio.vercel.app/api/v1/keys/verify \
  -H "Content-Type: application/json" \
  -H "x-lyaxis-service-key: tu_service_key" \
  -d '{"token": "LYX-XXX-XXX"}'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "valid": true,
  "tier": "zero_vip_30",
  "assigned_to": "Santiago Morales",
  "assigned_to_email": "santiago@creators.vip",
  "current_uses": 1,
  "max_uses": 1,
  "status": "claimed",
  "timestamp": "2026-09-30T07:59:10.968Z"
}
```

---

## ⚙️ 6. Despliegue en Vercel con un Solo Comando

### Paso 1: Configurar Variables de Entorno en Vercel
En tu panel de Vercel (o archivo `.env.local` para pruebas locales):
- `GATEKEEPER_MASTER_KEY`: Tu clave maestra de fundador.
- `LYAXIS_SERVICE_KEY`: Clave interna para microservicios.
- `GATEKEEPER_IP_SALT`: Salt criptográfico para anonimizar IPs.

### Paso 2: Conectar Vercel Postgres
1. En tu proyecto de Vercel, ve a la pestaña **Storage**.
2. Haz clic en **Create Database** -> Selecciona **Postgres**.
3. Haz clic en **Connect Project**. Vercel inyectará automáticamente `POSTGRES_URL`.

### Paso 3: Desplegar
```bash
vercel deploy --prod
```
¡Listo! La aplicación ejecutará las migraciones automáticamente en el primer arranque y estará 100% operativa.
