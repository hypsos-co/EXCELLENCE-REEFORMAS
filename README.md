# EXCELLENCE REFORMAS · Web + EXCELLENCE SMART BUDGET

> Tu casa también merece un Glow Up.

Web de Excellence Reformas con su funcionalidad central, **EXCELLENCE SMART BUDGET**: un asistente
guiado, paso a paso, para que cualquier persona explique su reforma en unos 2 minutos y la envíe
directamente a Excellence Reformas.

| Ruta | Qué es |
| --- | --- |
| `/` | Portada: hero, servicios (cada uno abre el asistente con ese tipo ya elegido), Smart Budget, trabajos reales, cómo trabajamos, «Conóceme», opiniones (si hay reales), contacto. |
| `/showroom` | Galería de 45 trabajos reales con filtros por tipo de espacio y visor a pantalla completa (teclado, deslizar en móvil y botón «Quiero algo así» que abre el asistente con el tipo de reforma ya elegido). |
| `/solicitar-presupuesto` | El asistente a pantalla completa. Admite `?tipo=integral\|cocina\|bano\|pintura\|albanileria\|otra`. |
| `/politica-de-privacidad` | Política de privacidad (plantilla RGPD con los datos de `src/config/site.ts`). |
| `POST /api/solicitudes` | Backend que valida, guarda y notifica cada solicitud. |

Tecnología: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion),
Zod, Nodemailer. Tipografías Archivo y Manrope alojadas en el propio proyecto (sin llamadas a Google Fonts).

---

## 1. Puesta en marcha

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Abre http://localhost:3000. En desarrollo, sin SMTP configurado, cada solicitud se guarda en `.data/`
junto con una **vista previa del email** (`email-preview.html`) que recibiría Excellence Reformas.

## 2. Configuración

### Datos públicos → `src/config/site.ts`

Un único archivo para cambiar lo que se muestra en la web:

- Nombre de la empresa, lema y persona de contacto (Julio César).
- Teléfono, **WhatsApp** (solo dígitos con prefijo, p. ej. `34600000000`) y email público.
- Dominio (`https://…`), usado en metadatos, sitemap y comprobación de origen del formulario.
- Instagram oficial: https://www.instagram.com/excellencereformas.es/
- Zona y localidades de servicio (Madrid y alrededores). Una localidad fuera de la lista **no se
  rechaza**: la solicitud se marca «fuera de zona habitual» para que Julio César la valore.
- Datos legales del responsable para la política de privacidad.

Los campos vacíos se ocultan: por ejemplo, el botón «CONTINUAR POR WHATSAPP» solo aparece cuando hay
un número de WhatsApp válido (mientras tanto, la pantalla final enlaza a Instagram).

### Textos de la portada

- `src/config/about.ts` → sección **«Conóceme»** de Julio César (texto en primera persona). Su foto
  está en `src/assets/equipo/` y aparece también en la portada, el asistente y la pantalla final.
- `src/config/reviews.ts` → **opiniones de clientes**. La sección solo aparece cuando la lista tiene
  opiniones **reales** (con permiso del cliente). No se deben añadir reseñas inventadas: además de
  engañar a los clientes, es una práctica desleal prohibida por la normativa de consumo.
  `reviewLinkUrl` admite el enlace de reseñas de Google para mostrar el botón «Déjanos tu opinión».

### Secretos → variables de entorno

Todo lo sensible (SMTP, claves del almacenamiento) va en variables de entorno del servidor, **nunca**
en el código ni en el navegador. Ver `.env.example`.

## 3. Cómo llegan las solicitudes

```
Navegador (asistente)                          Servidor  POST /api/solicitudes
────────────────────                           ─────────────────────────────────
· Validación inmediata por paso                 1. Origen permitido · límite por IP
· Fotos comprimidas a JPEG en el móvil          2. Anti-bots: campo trampa + tiempo mínimo
  (sin metadatos GPS)                           3. Validación completa con Zod
· Idempotency-Key por envío             ──────▶ 4. Fotos: tipo real por firma binaria, tamaño
                                                5. ¿Envío repetido? (misma clave o mismo
                                                   contenido < 15 min) → misma referencia
                                                6. Guarda fotos + solicitud.json (privado)
                                                7. Email a Excellence Reformas con fotos
                                                   adjuntas y botones Llamar / WhatsApp
                                         ◀──────8. 201 + referencia ER-AAMMDD-XXXX
Pantalla «¡Gracias…!» + WhatsApp
```

Garantías:

- **Sin éxitos falsos.** La pantalla de agradecimiento solo aparece cuando el servidor responde que la
  solicitud está registrada. En producción, además, solo cuando el email ha salido
  (`REQUIRE_EMAIL_NOTIFICATION`, activado por defecto).
- **Sin recepción configurada, no se finge nada:** el servidor responde `503` y el cliente ve un error.
- **Si el email falla**, la solicitud queda guardada con el estado `failed`, el cliente ve
  «Reintentar» y el reintento reenvía el aviso **sin duplicar** la solicitud.
- **Fecha y hora** de recepción en UTC (`receivedAt`) y en hora de Madrid (`receivedAtMadrid`).
- Las solicitudes se guardan en `solicitudes/AAAA/MM/<referencia>/` con `solicitud.json`,
  `fotos/` y, si aplica, `email-preview.html`.

### 3.1 Activar el email empresarial (pendiente)

Rellena en el hosting:

```
NOTIFY_EMAIL_TO=el-email-de-la-empresa@…
MAIL_FROM="Web Excellence Reformas <web@tudominio.es>"
SMTP_HOST=…  SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=…  SMTP_PASS=…
```

Valores habituales de `SMTP_HOST`: Google Workspace `smtp.gmail.com` (con contraseña de aplicación),
Microsoft 365 `smtp.office365.com`, IONOS `smtp.ionos.es`, Resend `smtp.resend.com` (usuario `resend`
y la API key como contraseña). El email llega con **Responder a** = email del cliente.

### 3.2 Almacenamiento seguro

- `STORAGE_DRIVER=local` → carpeta `DATA_DIR` del servidor (fuera de `/public`, archivos `0600`).
  Válido en desarrollo o en un servidor propio con disco persistente.
- `STORAGE_DRIVER=s3` → **recomendado en producción**: un bucket **privado** compatible con S3
  (Cloudflare R2, AWS S3, Backblaze B2, MinIO). Las fotos nunca se publican con enlaces abiertos.
  Variables: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
  (y opcionalmente `S3_PREFIX`). La clave solo necesita permisos de lectura/escritura en ese bucket.

> En Vercel el disco no es persistente: sin `STORAGE_DRIVER=s3` el servidor se niega a recibir
> solicitudes (503) en lugar de perderlas.

## 4. Despliegue (Vercel)

1. Importa el repositorio en Vercel (framework detectado: Next.js).
2. Añade las variables de `.env.example` (SMTP + S3) en *Settings → Environment Variables*.
3. Completa `src/config/site.ts` (dominio, WhatsApp, teléfono, email, datos legales) y despliega.
4. Envía una solicitud de prueba y comprueba que llega el email y que aparece en el bucket.

Límite a tener en cuenta: las funciones de Vercel aceptan peticiones de hasta 4,5 MB. Por eso el
asistente comprime las fotos en el navegador y el servidor limita el total a 4 MB (6 fotos máx.;
configurable en `src/lib/budget/uploads.ts`).

## 5. Seguridad y privacidad

- Ninguna credencial en el navegador; el formulario solo habla con `/api/solicitudes`.
- Validación en cliente **y** en servidor con el mismo esquema (`src/lib/budget/schema.ts`).
- Fotos verificadas por su firma binaria (JPG, PNG, WEBP, HEIC), renombradas en el servidor y
  guardadas en almacenamiento privado. El navegador elimina sus metadatos (GPS) al comprimirlas.
- Comprobación de origen, límite de envíos por IP, campo trampa y tiempo mínimo anti-bots.
- Cabeceras de seguridad (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS).
- Nada se guarda en el almacenamiento del navegador: si el usuario cierra la página, el navegador le
  avisa antes de perder las respuestas.
- Casilla obligatoria de política de privacidad (se registra la versión aceptada).

## 6. Fotografías

Todas las fotos son trabajos reales de la carpeta de Google Drive «TRABAJO» (631 archivos).
Se revisaron una a una y se descartaron:

- obra en curso (escombros, cables, plásticos de protección),
- fotos con personas, objetos personales, juguetes o etiquetas de precio,
- fachadas y exteriores de viviendas particulares,
- fotos borrosas, oscuras, torcidas o duplicadas.

Las elegidas se recortaron, se retocaron de forma suave y uniforme (niveles, equilibrio de blancos;
más suave en las fotos con luz cálida para no perder el ambiente) y se les quitaron los metadatos
(incluida la ubicación GPS).

- `src/assets/obras/` → fotos de la portada y del asistente (`src/components/budget/media.ts`).
- `src/assets/showroom/` → las 45 fotos del showroom. Títulos, descripciones y categorías en
  `src/content/showroom.ts`; para añadir una foto, guárdala en esa carpeta y añade una línea.

## 7. Pruebas

```bash
npm test
```

```bash
npm run test:e2e
```

- `npm test` (Vitest): esquema, enlace de WhatsApp, detección de imágenes, almacenamiento local y S3,
  límite por IP, la API completa y el envío real por SMTP contra un servidor de correo local
  (adjuntos, reintentos, duplicados, fallo del email).
- `npm run test:e2e` (Playwright, móvil y escritorio): solicitud completa con fotos, validación,
  edición desde el resumen, volver atrás sin perder respuestas, navegación con teclado,
  `prefers-reduced-motion`, preselección desde la portada y el showroom (filtros, visor con
  teclado y enlace al asistente).

## 8. Antes de publicar (checklist)

- [ ] `src/config/site.ts`: dominio, teléfono, WhatsApp, email público.
- [ ] `src/config/site.ts → legal`: titular, NIF/CIF, domicilio y email de privacidad.
- [ ] Revisión legal de la política de privacidad (es una plantilla).
- [ ] Variables SMTP + `NOTIFY_EMAIL_TO` en el hosting.
- [ ] Bucket privado y variables `S3_*` en el hosting.
- [ ] Revisar el texto de «Conóceme» (`src/config/about.ts`).
- [ ] Añadir opiniones reales de clientes en `src/config/reviews.ts` cuando las tengáis.
- [ ] Solicitud de prueba real de principio a fin.

## 9. Estructura

```
src/
  app/
    page.tsx                         Portada
    showroom/page.tsx                Showroom (galería)
    solicitar-presupuesto/page.tsx   Asistente (lee ?tipo=)
    politica-de-privacidad/page.tsx
    api/solicitudes/route.ts         Backend de recepción
  components/
    budget/                          EXCELLENCE SMART BUDGET (pasos, resumen, éxito)
    site/                            Cabecera, pie y botones de llamada a la acción
    showroom/                        Galería con filtros y visor
    brand/                           Logotipo vectorial oficial
  config/site.ts                     ⚙️  Configuración central
  content/showroom.ts                Fotos del showroom (títulos y categorías)
  lib/budget/                        Opciones, esquema, resumen, WhatsApp (cliente + servidor)
  lib/server/                        Almacenamiento, email, anti-abuso (solo servidor)
  assets/obras/                      Fotografías de trabajos reales
tests/  e2e/                         Pruebas
```

## 10. Próximos pasos sugeridos

- Panel privado para consultar y marcar solicitudes (hoy se gestionan desde el email y el bucket).
- Límite de envíos global con Redis/Upstash (el actual es por instancia).
- Email de confirmación al cliente, si se desea.
