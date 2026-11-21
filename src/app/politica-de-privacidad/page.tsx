import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo trata Excellence Reformas los datos que envías a través de la web y del asistente Excellence Smart Budget.",
  alternates: { canonical: "/politica-de-privacidad" },
};

/**
 * Plantilla de política de privacidad (RGPD / LOPDGDD).
 * Los datos del responsable salen de `src/config/site.ts` → `legal`.
 * Debe revisarla un profesional antes de publicar la web.
 */
export default function PrivacyPage() {
  const { legal, contact, name } = siteConfig;
  const pending = (v: string, label: string) => v || `[${label}: pendiente de completar]`;
  const rightsEmail = legal.privacyEmail || contact.email;
  const version = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(
    new Date(`${legal.privacyPolicyVersion}T12:00:00Z`),
  );

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-white">
        <div className="mx-auto max-w-3xl px-5 pt-12 pb-24 sm:px-8 lg:pt-20">
          <p className="text-xs font-bold tracking-[0.22em] text-steel-ink uppercase">Legal</p>
          <h1 className="font-display-tight mt-3 text-5xl leading-[0.92] text-navy uppercase sm:text-6xl">Política de privacidad</h1>
          <p className="mt-4 text-[15px] text-steel-ink">Última actualización: {version}</p>

          <div className="mt-10 space-y-10 text-[16px] leading-relaxed text-navy/90">
            <Block title="1. Responsable del tratamiento">
              <dl className="grid gap-x-6 gap-y-2 rounded-2xl bg-mist-50 p-5 ring-1 ring-navy/8 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold text-steel-ink">Titular</dt>
                <dd>{pending(legal.holder, "Nombre o razón social")}</dd>
                <dt className="font-semibold text-steel-ink">NIF/CIF</dt>
                <dd>{pending(legal.taxId, "NIF/CIF")}</dd>
                <dt className="font-semibold text-steel-ink">Domicilio</dt>
                <dd>{pending(legal.address, "Domicilio")}</dd>
                <dt className="font-semibold text-steel-ink">Email</dt>
                <dd>{pending(rightsEmail, "Email de contacto")}</dd>
                <dt className="font-semibold text-steel-ink">Nombre comercial</dt>
                <dd>{name}</dd>
              </dl>
            </Block>

            <Block title="2. Qué datos tratamos">
              <p>Cuando nos envías una solicitud de presupuesto a través de Excellence Smart Budget tratamos:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Datos de contacto: nombre y apellidos, teléfono y email.</li>
                <li>Datos de tu proyecto: tipo de reforma, tipo de inmueble, características, localidad, provincia y código postal (opcional), plazos y rango de presupuesto orientativo (opcional).</li>
                <li>La descripción y las fotografías que decidas adjuntar.</li>
              </ul>
              <p className="mt-3">
                Te pedimos solo lo imprescindible para responder a tu solicitud. Te recomendamos que en las fotografías no aparezcan personas,
                documentos ni otros datos personales. Antes de enviarlas, el asistente las optimiza en tu dispositivo y elimina sus metadatos
                (por ejemplo, la ubicación GPS).
              </p>
            </Block>

            <Block title="3. Para qué los usamos">
              <p>
                Para estudiar tu solicitud, ponernos en contacto contigo (por teléfono, WhatsApp o email) y, en su caso, preparar un presupuesto
                personalizado. No tomamos decisiones automatizadas ni elaboramos perfiles con tus datos.
              </p>
              <p className="mt-3">
                <strong>Opiniones en la web.</strong> Si al enviar tu valoración marcas la casilla que lo autoriza, publicaremos en nuestra web tu
                nombre con la inicial del apellido, tu puntuación, tu comentario y la fecha. La base legal es tu consentimiento. Si en el
                comentario aparecen emails, teléfonos o enlaces, los retiramos antes de publicarlo. Puedes retirar tu consentimiento y pedirnos que
                la quitemos en cualquier momento escribiendo a {rightsEmail || "nuestro email de contacto"}.
              </p>
            </Block>

            <Block title="4. Base legal">
              <p>
                Tu consentimiento, que nos das al marcar la casilla de aceptación antes de enviar la solicitud (art. 6.1.a RGPD), y la aplicación
                de medidas precontractuales a petición tuya (art. 6.1.b RGPD). Puedes retirar tu consentimiento en cualquier momento, sin que ello
                afecte a la licitud del tratamiento anterior.
              </p>
            </Block>

            <Block title="5. Cuánto tiempo los conservamos">
              <p>
                Mientras gestionamos tu solicitud y, si no llega a convertirse en un encargo, durante un máximo de {legal.retentionMonths} meses.
                Si contratas nuestros servicios, los conservaremos durante la relación comercial y los plazos que exija la ley.
              </p>
            </Block>

            <Block title="6. Destinatarios">
              <p>
                No cedemos tus datos a terceros, salvo obligación legal. Para que la web funcione utilizamos proveedores de alojamiento web,
                recepción de formularios, almacenamiento y correo electrónico que actúan como encargados del tratamiento, con las garantías que
                exige la normativa. Algunos pueden estar ubicados fuera del Espacio Económico Europeo; en ese caso, las transferencias se
                amparan en las garantías previstas en el RGPD (por ejemplo, el Marco de Privacidad de Datos UE-EE. UU. o cláusulas
                contractuales tipo). Si decides continuar la conversación por WhatsApp, ese servicio se rige por las condiciones de su
                proveedor.
              </p>
            </Block>

            <Block title="7. Tus derechos">
              <p>
                Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a{" "}
                <strong>{pending(rightsEmail, "Email de contacto")}</strong>, indicando el derecho que quieres ejercer. Si consideras que no
                hemos atendido correctamente tu solicitud, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  www.aepd.es
                </a>
                ).
              </p>
            </Block>

            <Block title="8. Seguridad">
              <p>
                Las solicitudes y las fotografías se guardan en los servidores de nuestros proveedores tecnológicos, no se publican en la web y
                solo {name} accede a ellas desde su panel de gestión. La comunicación con la web se realiza de forma cifrada (HTTPS).
              </p>
            </Block>

            <Block title="9. Almacenamiento en tu navegador">
              <p>
                El asistente no guarda tus respuestas ni tus datos personales en el almacenamiento de tu navegador: si cierras la página antes de
                enviar la solicitud, las respuestas se pierden. Esta web no utiliza cookies de analítica ni de publicidad.
              </p>
            </Block>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-navy">{title}</h2>
      {children}
    </section>
  );
}
