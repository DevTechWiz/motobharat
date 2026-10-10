"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { EmptyState, Skeleton, Spinner } from "@/components/ui/feedback";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/lib/auth-context";

export default function UiGalleryPage() {
  const toast = useToast();
  const { user, profile, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1100px] space-y-12 px-4 py-12 md:px-6">
      <section>
        <SectionHeader eyebrow="Design system" title="Primitives (M0)" />
        <p className="text-sm text-muted">Dev-only reference page. Not linked in nav.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted">Auth (topbar states)</h3>
        <p className="text-xs text-muted">
          Current: {user ? `${profile?.display_name ?? user.email} (${profile?.role ?? "rider"})` : "signed out"} — sign in via /login to preview the avatar menu.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="secondary" disabled>
            Sign in via /login
          </Button>
          <Button size="sm" variant="danger" onClick={signOut} disabled={!user}>
            Sign out
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted">Button</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted">Badge</h3>
        <div className="flex flex-wrap gap-2">
          <Badge tone="easy">Easy</Badge>
          <Badge tone="moderate">Moderate</Badge>
          <Badge tone="hard">Hard</Badge>
          <Badge>Neutral</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted">Avatar</h3>
        <div className="flex items-center gap-3">
          <Avatar name="Arjun Rao" size="sm" />
          <Avatar name="Arjun Rao" size="md" />
          <Avatar name="Arjun Rao" size="lg" />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted">Card</h3>
        <Card className="max-w-sm">
          <p className="font-semibold">Ride card title</p>
          <p className="mt-1 text-sm text-muted">Sun, 12 Oct · 6:00 AM IST</p>
        </Card>
      </section>

      <section className="max-w-md space-y-3">
        <h3 className="text-sm font-semibold text-muted">Form</h3>
        <Field label="Ride title" htmlFor="t" hint="Keep it short">
          <Input id="t" placeholder="Early morning GG" />
        </Field>
        <Field label="Description" htmlFor="d" error="Required">
          <Textarea id="d" placeholder="Route, pace, gear…" />
        </Field>
        <Field label="Difficulty" htmlFor="diff">
          <Select id="diff" defaultValue="moderate">
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </Select>
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted">Feedback</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open ConfirmDialog
          </Button>
          <Button variant="secondary" onClick={() => toast("Saved successfully")}>
            Toast success
          </Button>
          <Button variant="secondary" onClick={() => toast("Something failed", "error")}>
            Toast error
          </Button>
          <Spinner />
        </div>
        <Skeleton className="h-20 w-full max-w-sm" />
        <EmptyState
          title="No rides yet"
          hint="When the community posts rides, they will show up here."
        />
        <ConfirmDialog
          open={dialogOpen}
          title="Delete ride?"
          body="This removes the ride for everyone. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setDialogOpen(false)}
          onConfirm={() => {
            setDialogOpen(false);
            toast("Ride deleted (demo)");
          }}
        />
      </section>
    </div>
  );
}
