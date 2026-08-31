import OperationsDesk from "@/components/OperationsDesk";
import { loadOps } from "@/lib/ops";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await loadOps("live");
  return <OperationsDesk initial={initial} />;
}
