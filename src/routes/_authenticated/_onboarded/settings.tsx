import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileQueryOptions } from "../_onboarded";
import { deleteMyAccount, getMyProfile } from "@/lib/profile.functions";
import { getMyUsageThisMonth } from "@/lib/usage.functions";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/_onboarded/settings")({
  head: () => ({ meta: [{ title: "Settings — VVCLab" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const profileQuery = useQuery({ ...profileQueryOptions, queryFn: () => getMyProfile() });
  const profile = profileQuery.data;
  const deleteFn = useServerFn(deleteMyAccount);

  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Password updated");
  }

  async function handleDelete() {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteFn({});
      await supabase.auth.signOut();
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 lg:px-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2 lg:p-6 lg:pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 lg:p-6">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={profile?.fullName || ""} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email || ""} readOnly disabled />
          </div>
          <form onSubmit={handlePassword} className="space-y-2 border-t pt-4">
            <Label htmlFor="np">Change password</Label>
            <div className="flex flex-col gap-2 lg:flex-row">
              <Input
                id="np"
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
              />
              <Button type="submit" disabled={pwLoading || newPassword.length < 6} className="w-full lg:w-auto">
                {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <UsageCard />

      <Card className="border-destructive/40">
        <CardHeader className="p-4 pb-2 lg:p-6 lg:pb-2">
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="w-full sm:w-auto">
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageCard() {
  const fetchUsage = useServerFn(getMyUsageThisMonth);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-usage-this-month"],
    queryFn: () => fetchUsage({}),
  });

  const items: Array<{ key: "script" | "linkedin_posts" | "images" | "blueprint"; label: string }> = [
    { key: "script", label: "Scripts" },
    { key: "linkedin_posts", label: "LinkedIn Posts" },
    { key: "images", label: "Images" },
    { key: "blueprint", label: "Blueprints" },
  ];

  return (
    <Card>
      <CardHeader className="p-4 pb-2 lg:p-6 lg:pb-2">
        <CardTitle className="text-base">Your usage this month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-4 lg:p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading usage…
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">Unable to load usage.</p>
        ) : (
          items.map(({ key, label }) => {
            const used = data.usage[key] ?? 0;
            const limit = data.limits[key] ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            const over = used >= limit;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className={over ? "text-destructive" : "text-muted-foreground"}>
                    {used} / {limit}
                  </span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })
        )}
        <p className="pt-2 text-xs text-muted-foreground">
          Free plan limits reset at the start of each month.
        </p>
      </CardContent>
    </Card>
  );
}

