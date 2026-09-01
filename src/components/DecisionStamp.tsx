import type { Call, MissionDecision } from "@/lib/types";

const CALL_CLASS: Record<Call, string> = {
  GO: "call-go",
  CONDITIONAL: "call-cond",
  "NO-GO": "call-nogo",
};

export default function DecisionStamp({
  channel,
  hint,
  align,
  decision,
}: {
  channel: string;
  hint?: string;
  align: "launch" | "gnss";
  decision: MissionDecision;
}) {
  const long = decision.call === "CONDITIONAL";
  return (
    <section
      className={`stamp stamp-${align} ${CALL_CLASS[decision.call]}`}
      aria-label={`${channel} ${decision.call}`}
    >
      <p className="stamp-channel">{channel}</p>
      {hint ? <p className="stamp-hint">{hint}</p> : null}
      <p className={`stamp-call ${long ? "is-long" : ""}`}>{decision.call}</p>
    </section>
  );
}
