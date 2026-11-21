import type { Metadata } from "next";
import { BudgetWizard } from "@/components/budget/BudgetWizard";

export const metadata: Metadata = {
  title: "Solicitar presupuesto · Excellence Smart Budget",
  description:
    "Cuéntanos tu reforma en unos 2 minutos: tipo de reforma, vivienda, detalles, fotos y contacto. Tu solicitud llega directamente a Excellence Reformas.",
  alternates: { canonical: "/solicitar-presupuesto" },
};

/** El tipo de reforma se puede preseleccionar con ?tipo=cocina (se lee en el navegador). */
export default function SolicitarPresupuestoPage() {
  return <BudgetWizard />;
}
