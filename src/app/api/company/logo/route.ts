import { proxyOdooImage } from "@/lib/image-proxy";

export async function GET() {
  return proxyOdooImage("/tms/api/portal/company/logo", 86400);
}
