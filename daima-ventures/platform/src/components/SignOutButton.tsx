import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  async function handleSignOut() {
    "use server";
    const supabase = await createClientServer();
    if (supabase) {
      await supabase.auth.signOut();
    }
    revalidatePath("/", "layout");
    redirect("/login");
  }

  return (
    <form action={handleSignOut} className="w-full">
      <button
        type="submit"
        className={
          className ??
          "w-full rounded-full border border-[#dc3545] px-5 py-2.5 text-sm font-semibold text-[#dc3545] transition-all hover:bg-[#dc3545] hover:text-white"
        }
      >
        Sign Out
      </button>
    </form>
  );
}