import type { Metadata } from "next";
import { Suspense } from "react";
import { REFORM_TYPE_IDS, type ReformType } from "@/lib/budget/options";
import { BudgetWizard } from "@/components/budget/BudgetWizard";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Solicitar presupuesto · Excellence Smart Budget",
  description:
    "Cuéntanos tu reforma en unos 2 minutos: tipo de reforma, vivienda, detalles, fotos y contacto. Tu solicitud llega directamente a Excellence Reformas.",
  alternates: { canonical: "/solicitar-presupuesto" },
};

export default function SolicitarPresupuestoPage({ searchParams }: PageProps<"/solicitar-presupuesto">) {
  return (
    <Suspense fallback={<WizardLoading />}>
      <WizardFromParams searchParams={searchParams} />
    </Suspense>
  );
}

/** Permite preseleccionar el tipo desde otras páginas: /solicitar-presupuesto?tipo=cocina */
async function WizardFromParams({ searchParams }: Pick<PageProps<"/solicitar-presupuesto">, "searchParams">) {
  const { tipo } = await searchParams;
  const value = Array.isArray(tipo) ? tipo[0] : tipo;
  const initialType = (REFORM_TYPE_IDS as readonly string[]).includes(value ?? "") ? (value as ReformType) : undefined;
  return <BudgetWizard initialType={initialType} />;
}

function WizardLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-white" role="status" aria-label="Cargando el asistente">
      <div className="flex flex-col items-center gap-6">
        <Logo className="h-20 w-auto animate-pulse text-navy motion-reduce:animate-none" decorative />
        <p className="text-sm font-semibold tracking-[0.2em] text-steel-ink uppercase">Excellence Smart Budget</p>
      </div>
    </div>
  );
}
