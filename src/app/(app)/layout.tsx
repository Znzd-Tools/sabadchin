import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { StoreProvider, type Family, type Member } from "@/lib/store";
import Shell from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: mine } = await sb.from("members").select("family_id, user_id, display_name, role").eq("user_id", auth.user.id).maybeSingle();
  if (!mine) redirect("/onboarding");

  const [{ data: family }, { data: members }] = await Promise.all([
    sb.from("families").select("id, name, invite_code, reward_pct, created_at").eq("id", mine.family_id).single(),
    sb.from("members").select("user_id, display_name, role").eq("family_id", mine.family_id),
  ]);
  if (!family) redirect("/onboarding");

  return (
    <StoreProvider family={family as Family} me={mine as Member} members={(members ?? []) as Member[]}>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
