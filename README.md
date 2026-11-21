# EXCELLENCE REFORMAS · Web + EXCELLENCE SMART BUDGET

> Tu casa también merece un Glow Up.

Web de Excellence Reformas con su funcionalidad central, **EXCELLENCE SMART BUDGET**: un asistente
guiado, paso a paso, para que cualquier persona explique su reforma en unos 2 minutos y la envíe
directamente a Excellence Reformas.

| Ruta | Qué es |
| --- | --- |
| `/` | Portada: escena nocturna «Valle de luz» (3D), franja de confianza, servicios (cada uno abre el asistente con ese tipo ya elegido), Smart Budget, trabajos reales, cómo trabajamos, «Conóceme», opiniones (si hay reales), cuidado de clientes, contacto. |
| `/showroom` | Galería de 45 trabajos reales con filtros por tipo de espacio y visor a pantalla completa (teclado, deslizar en móvil y botón «Quiero algo así» que abre el asistente con el tipo de reforma ya elegido). |
| `/solicitar-presupuesto` | El asistente a pantalla completa. Admite `?tipo=integral\|cocina\|bano\|pintura\|albanileria\|otra`. |
| `/valoracion` | Valoración del cliente (1 a 5 estrellas, comentario, «¿te sientes bien atendido?», petición de llamada) y botones para seguir en redes. Una valoración baja o un «no» avisa a Julio César como **urgente**. |
| `/clientes` | **Área de clientes** (app instalable en el móvil): valorar la obra, pedir una revisión o arreglo posventa con fotos, guía de cuidados, pedir otra reforma y recomendar a un amigo. |
| `/politica-de-privacidad` | Política de privacidad (plantilla RGPD con los datos de `src/config/site.ts`). |
| `POST /api/solicitudes` | Backend que valida, guarda y notifica cada solicitud (versión con servidor). |
| `POST /api/formularios` | Valoraciones y consultas posventa (versión con servidor). |

Tecnología: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion),
three.js (portada), Zod, Nodemailer. Tipografías Archivo y Manrope alojadas en el propio proyecto (sin llamadas a Google Fonts).

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

**WhatsApp.** El número se puede escribir en `src/config/site.ts` o, sin tocar el código, en la
variable `NEXT_PUBLIC_WHATSAPP_NUMBER` de Netlify (*Site configuration → Environment variables*,
solo dígitos con prefijo, p. ej. `34612345678`) y volver a publicar. Con número configurado aparece
el **botón flotante animado** en todas las páginas (en la portada, al bajar de la escena nocturna;
nunca dentro del asistente, que tiene el suyo al final) con el mensaje «¿Hablamos?».

**Redes sociales.** `social` en `src/config/site.ts`: Instagram ya está; Facebook, TikTok, YouTube,
LinkedIn y el enlace de reseñas de Google aparecen solos en el pie, en `/valoracion` y en `/clientes`
en cuanto se rellenan.

### Portada nocturna «Valle de luz»

`src/components/home/night/` — diseño propio (no reutiliza código ni recursos de terceros):

- `scene.ts`: miles de luces en tres colores de la marca sobre un valle nocturno infinito. Florecen
  (cinco pétalos) al acercarse, se apartan del cursor y, al pasar el ratón o el foco por el botón
  redondo, **se reúnen formando las casas del logotipo** mientras el titular se atenúa.
- `ambient.ts`: sonido ambiente generado en el navegador (sin archivos). Empieza **apagado** y solo
  suena si la persona pulsa el altavoz.
- Rendimiento y accesibilidad: three.js (~134 KB comprimido) se descarga después de mostrar la
  página y solo en la portada; menos partículas en móvil; se pausa fuera de pantalla o con la pestaña
  oculta. Con «reducir movimiento» se muestra una imagen fija, y sin WebGL, un cielo estático.

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

> Esta sección describe la **versión con servidor**. En la versión HTML para Netlify las solicitudes
> se reciben con Netlify Forms (ver sección 4).

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

## 4. Despliegue en Netlify (HTML estático) — recomendado para empezar

`npm run build:netlify` genera la web completa como **HTML estático** en la carpeta `out/`
(páginas, estilos, tipografías y todas las fotos en WebP optimizado). En esta versión las
solicitudes se reciben con **Netlify Forms**: Netlify las guarda, filtra el spam y envía un email
con cada una. No hace falta configurar SMTP ni almacenamiento.

### Opción A · Subir la carpeta (sin Git)

1. `npm install` y `npm run build:netlify` (o usa el zip ya generado).
2. En Netlify: *Add new project → Deploy manually* y arrastra la carpeta `out/`.

### Opción B · Conectar el repositorio (recomendado: cada cambio se publica solo)

*Add new project → Import an existing project* → este repositorio. `netlify.toml` ya indica el
comando (`npm run build:netlify`) y la carpeta de publicación (`out`).

### Activar la recepción de solicitudes (imprescindible, una sola vez)

1. **Forms → Enable form detection** y vuelve a desplegar. Netlify registrará el formulario
   `solicitud-presupuesto` (definido en `public/__forms.html`).
2. **Forms → Submission notifications → Add notification → Email notification**: el email de
   Julio César. ⚠️ Netlify solo permite como destinatario a **un miembro activo del equipo de
   Netlify**: invita antes ese email al equipo.
3. Haz una solicitud de prueba real (con nombre, frases completas y un email real) y comprueba que
   aparece en **Forms**. Si no aparece, mira la carpeta **Spam** (Akismet a veces marca las pruebas).

Cada solicitud llega con: referencia `ER-AAMMDD-XXXX`, un **resumen completo** (con enlace de
WhatsApp del cliente), los campos por separado y hasta 6 fotos (`foto_1` … `foto_6`). Si Netlify no
acepta el envío (por ejemplo, sin la detección activada), el cliente ve un error: nunca un éxito falso.

**Limitaciones de esta versión** frente a la de servidor: las fotos se guardan en Netlify y se
abren desde el panel con un enlace directo (no publicado en la web, pero quien tenga el enlace exacto
puede verlo); no hay detección de duplicados en el servidor; y el número de solicitudes y el espacio
para archivos dependen del plan de Netlify (revisa sus límites de Forms).

### Emails visuales y confirmación al cliente (opcional, recomendado)

Además del aviso estándar de Netlify, la función `netlify/functions/formularios.mts` envía para cada
envío un **email visual y ordenado** (fotos dentro del email, botones Llamar / WhatsApp / Responder,
estrellas en las valoraciones, «URGENTE» si el cliente no se siente bien atendido) y, si el cliente
dejó su email, una **confirmación** con su referencia.

1. Despliega **conectando el repositorio** (opción B) o con Netlify CLI: las funciones no se publican
   arrastrando la carpeta.
2. En *Site configuration → Environment variables*, con alcance **Functions**:
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `NOTIFY_EMAIL_TO`
   y, si no quieres confirmación al cliente, `SEND_CLIENT_CONFIRMATION=false`.
3. Vuelve a publicar y haz una prueba. Sin estas variables la función no hace nada y sigue llegando
   el aviso estándar de Netlify.

Para ver la versión estática en local: `npm run build:netlify` y `npm run preview:netlify`
(http://localhost:4000, con un Netlify simulado que guarda los envíos en `.data-netlify/`).

## 5. Despliegue con servidor (Vercel u otro hosting Node)

1. Importa el repositorio en Vercel (framework detectado: Next.js).
2. Añade las variables de `.env.example` (SMTP + S3) en *Settings → Environment Variables*.
3. Completa `src/config/site.ts` (dominio, WhatsApp, teléfono, email, datos legales) y despliega.
4. Envía una solicitud de prueba y comprueba que llega el email y que aparece en el bucket.

Límite a tener en cuenta: las funciones de Vercel aceptan peticiones de hasta 4,5 MB. Por eso el
asistente comprime las fotos en el navegador y el servidor limita el total a 4 MB (6 fotos máx.;
configurable en `src/lib/budget/uploads.ts`).

## 6. Seguridad y privacidad

- Ninguna credencial en el navegador; el formulario solo habla con `/api/solicitudes`.
- Validación en cliente **y** en servidor con el mismo esquema (`src/lib/budget/schema.ts`).
- Fotos verificadas por su firma binaria (JPG, PNG, WEBP, HEIC), renombradas en el servidor y
  guardadas en almacenamiento privado. El navegador elimina sus metadatos (GPS) al comprimirlas.
- Comprobación de origen, límite de envíos por IP, campo trampa y tiempo mínimo anti-bots.
- Cabeceras de seguridad (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS).
- Nada se guarda en el almacenamiento del navegador: si el usuario cierra la página, el navegador le
  avisa antes de perder las respuestas.
- Casilla obligatoria de política de privacidad (se registra la versión aceptada).

## 7. Fotografías

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

## 8. Pruebas

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run test:e2e:netlify
```

- `npm test` (Vitest): esquema, enlace de WhatsApp, detección de imágenes, almacenamiento local y S3,
  límite por IP, la API completa y el envío real por SMTP contra un servidor de correo local
  (adjuntos, reintentos, duplicados, fallo del email).
- `npm run test:e2e` (Playwright, móvil y escritorio): solicitud completa con fotos, validación,
  edición desde el resumen, volver atrás sin perder respuestas, navegación con teclado,
  `prefers-reduced-motion`, preselección desde la portada y el showroom (filtros, visor con
  teclado y enlace al asistente), portada nocturna (botón y sonido), botón de WhatsApp y valoración.
- `npm run test:e2e:netlify`: compila la versión HTML y la prueba con un Netlify simulado (envío
  real a Netlify Forms con fotos, valoración, posventa, error sin éxito falso, todas las páginas y
  fotos sin errores, 404, app instalable).

## 9. Antes de publicar (checklist)

- [ ] `src/config/site.ts`: dominio, teléfono, WhatsApp (o `NEXT_PUBLIC_WHATSAPP_NUMBER`), email público.
- [ ] `src/config/site.ts → legal`: titular, NIF/CIF, domicilio y email de privacidad.
- [ ] Revisión legal de la política de privacidad (es una plantilla).
- [ ] **Netlify:** detección de formularios activada + notificación por email a un miembro del equipo.
- [ ] **Netlify (emails visuales):** despliegue desde Git o CLI + variables SMTP con alcance Functions.
- [ ] **Servidor propio (alternativa):** variables SMTP + `NOTIFY_EMAIL_TO` y bucket privado `S3_*`.
- [ ] Revisar el texto de «Conóceme» (`src/config/about.ts`).
- [ ] Añadir opiniones reales de clientes en `src/config/reviews.ts` cuando las tengáis.
- [ ] Solicitud de prueba real de principio a fin.

## 10. Estructura

```
src/
  app/
    page.tsx                         Portada
    showroom/page.tsx                Showroom (galería)
    solicitar-presupuesto/page.tsx   Asistente (lee ?tipo=)
    valoracion/page.tsx              Valoración del cliente
    clientes/page.tsx                Área de clientes (app instalable)
    politica-de-privacidad/page.tsx
    api/*/route.server.ts            Backend (solo versión con servidor)
  components/
    home/night/                      Portada nocturna 3D y sonido ambiente
    budget/                          EXCELLENCE SMART BUDGET (pasos, resumen, éxito)
    forms/                           Valoración y posventa
    site/                            Cabecera, pie, botones y WhatsApp flotante
    showroom/                        Galería con filtros y visor
    brand/                           Logotipo vectorial oficial
  config/site.ts                     ⚙️  Configuración central
  content/showroom.ts                Fotos del showroom (títulos y categorías)
  lib/budget/                        Opciones, esquema, resumen, WhatsApp (cliente + servidor)
  lib/email/                         Plantillas de email visuales (aviso + confirmación)
  lib/server/                        Almacenamiento, email, anti-abuso (solo servidor)
netlify/functions/formularios.mts    Emails visuales en Netlify
  assets/obras/                      Fotografías de trabajos reales
tests/  e2e/                         Pruebas
```

## 11. Próximos pasos sugeridos

- Panel privado para consultar y marcar solicitudes (hoy se gestionan desde el email y el bucket).
- Límite de envíos global con Redis/Upstash (el actual es por instancia).
- Recordatorios automáticos de revisión (por ejemplo, al año de la obra) desde el área de clientes.
