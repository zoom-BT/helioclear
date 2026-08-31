import { loadOps } from "@/lib/ops";
import { isScenarioId } from "@/lib/ops";
import type { ScenarioId } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("scenario") ?? "live";
  const scenario: ScenarioId = isScenarioId(raw) ? raw : "live";
  const payload = await loadOps(scenario);
  return NextResponse.json(payload);
}
