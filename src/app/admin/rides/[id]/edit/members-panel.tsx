"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { removeMember } from "../../../actions";
import type { RideMember } from "@/lib/types";

function RemoveMemberButton({ rideId, userId }: { rideId: string; userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await removeMember(rideId, userId);
        });
      }}
    >
      <Button type="submit" variant="danger" size="sm" disabled={isPending}>
        {isPending ? "Removing..." : "Remove"}
      </Button>
    </form>
  );
}

export function MembersPanel({
  rideId,
  members,
}: {
  rideId: string;
  members: RideMember[];
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold tracking-[0.18em] text-accent uppercase">
        Joined Riders ({members.length})
      </h3>
      {members.length === 0 ? (
        <p className="text-sm text-muted">No riders joined yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={m.profile?.display_name ?? "Rider"} src={m.profile?.avatar_url} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.profile?.display_name ?? "Rider"}</p>
                  {m.details ? (
                    <p className="truncate text-[11px] text-muted">
                      <span className="font-semibold text-danger">{m.details.blood_group}</span>
                      {" · EC: "}
                      {m.details.emergency_contact_name}
                      {m.details.emergency_contact_relation ? ` (${m.details.emergency_contact_relation}: ${m.details.emergency_contact_phone})` : ` (${m.details.emergency_contact_phone})`}
                      {m.details.bike_model ? ` · ${m.details.bike_model}` : ""}
                      {m.details.bike_reg_no ? ` [${m.details.bike_reg_no}]` : ""}
                    </p>
                  ) : (
                    <p className="font-mono text-[11px] text-danger">KYC incomplete</p>
                  )}
                  <p className="font-mono text-[11px] text-muted">joined {formatDate(m.created_at)}</p>
                </div>
              </div>
              <RemoveMemberButton rideId={rideId} userId={m.user_id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
