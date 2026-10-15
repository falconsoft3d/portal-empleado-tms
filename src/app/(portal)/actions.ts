"use server";

import { redirect } from "next/navigation";
import { odooRegisterAttendance, type AttendanceResult, type Coords } from "@/lib/odoo";
import { deleteSession, getSession } from "@/lib/session";

export async function logout() {
  await deleteSession();
  redirect("/login");
}

function sanitizeCoords(coords: Coords): Coords {
  if (!coords) return null;
  const { latitude, longitude } = coords;
  const valid =
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  return valid ? { latitude, longitude } : null;
}

async function registerAttendance(kind: "check_in" | "check_out", coords: Coords): Promise<AttendanceResult> {
  const session = await getSession();
  if (!session) redirect("/login");
  return odooRegisterAttendance(session.odooToken, kind, sanitizeCoords(coords));
}

export async function registrarEntrada(coords: Coords) {
  return registerAttendance("check_in", coords);
}

export async function registrarSalida(coords: Coords) {
  return registerAttendance("check_out", coords);
}
