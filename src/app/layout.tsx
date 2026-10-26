import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"||t==="light")d.setAttribute("data-theme",t);if(localStorage.getItem("sidebar")==="hidden")d.setAttribute("data-sidebar","hidden")}catch(e){}})()`;

export const metadata: Metadata = {
  title: "Portal del Empleado · TMS Energy",
  description: "Portal del empleado de TMS Energy",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Aplica el tema y el estado del menú guardados antes del primer pintado (evita destellos). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
