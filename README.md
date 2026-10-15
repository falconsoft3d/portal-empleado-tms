# portal-empleado-tms 1

Portal del Empleado de TMS Energy, construido con Next.js 16 (App Router, Tailwind CSS v4).

Para iniciar sesión se usan las credenciales de la pestaña **TMS Portal** de la ficha del empleado en Odoo
(módulo `base_tms_energy`: campos *TMS Portal Active*, *Username* y *Password*).

## Cómo funciona el login

1. El formulario de `/login` envía las credenciales a una Server Action (nunca se llama a Odoo desde el navegador).
2. La Server Action llama a `POST {ODOO_URL}/tms/api/portal/login` (controlador `base_tms_energy/controllers/portal_api.py`).
3. Si Odoo valida al empleado, se guarda una cookie `httpOnly` firmada (JWT HS256, 8 h) con su id, nombre, puesto y compañía.
4. `src/proxy.ts` redirige a `/login` si no hay sesión válida; las páginas vuelven a validar la sesión en el servidor.

## Registro de asistencia (Cronómetro)

En la página de inicio el empleado registra su **entrada** y **salida**. Cada fichada se guarda en Odoo en
**Planillas → Horas Portal** (`tms.horas.portal`, módulo `l10n_ar_payroll_tms`) con la ubicación del navegador
si el empleado la permite.

- El login devuelve un token firmado por Odoo (`database.secret`, 12 h) que se guarda en la sesión y se envía
  en la cabecera `X-TMS-Portal-Token`; Odoo solo deja fichar al empleado de ese token.
- Endpoints: `GET /tms/api/portal/attendance`, `POST /tms/api/portal/attendance/check_in` y `.../check_out`.

## Puesta en marcha

```bash
cp .env.example .env.local   # y rellena los valores
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Descripción |
| --- | --- |
| `ODOO_URL` | URL de Odoo, p. ej. `https://odoo.miempresa.com` |
| `ODOO_DB` | Base de datos (solo si la instancia tiene varias) |
| `ODOO_PORTAL_API_KEY` | Clave compartida; debe coincidir con el parámetro de sistema `tms.portal_api_key` en Odoo. Si el parámetro está vacío en Odoo, no se exige |
| `SESSION_SECRET` | Secreto de al menos 32 caracteres (`openssl rand -base64 48`) |
| `COOKIE_SECURE` | `true`/`false`. Por defecto `true` en producción; usa `false` si sirves el portal por http |

## Producción

```bash
npm run build
npm start
```
