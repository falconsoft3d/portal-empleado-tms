import { SidebarNav } from "./sidebar-nav";

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen pb-16 lg:pb-0 lg:pl-56 lg:sidebar-hidden:pl-0">
      <SidebarNav />
      {children}
    </div>
  );
}
