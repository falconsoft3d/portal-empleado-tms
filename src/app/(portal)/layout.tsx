import { Suspense } from "react";
import { odooGetMe } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { SidebarNav } from "./sidebar-nav";

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen pb-16 lg:pb-0 lg:pl-56 lg:sidebar-hidden:pl-0">
      {/* La sesión se lee detrás de Suspense: mientras tanto, el menú sin las entradas por permiso. */}
      <Suspense fallback={<SidebarNav />}>
        <PortalNav />
      </Suspense>
      {children}
    </div>
  );
}

/**
 * Menú según el empleado: Mantenimiento solo para los Responsables de Mantenimiento.
 * El dato viene en la sesión (login); las sesiones abiertas antes de existir el campo lo piden a Odoo.
 */
async function PortalNav() {
  const session = await getSession();
  let maintenance = session?.maintenance;
  if (session && maintenance === undefined) {
    maintenance = Boolean((await odooGetMe(session.odooToken))?.responsable_mantenimiento);
  }
  return <SidebarNav maintenance={maintenance ?? false} />;
}
