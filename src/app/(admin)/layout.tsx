import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/engagements", label: "Engagements" },
  { href: "/reference", label: "Disposition Reference" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-[var(--db-ground)] text-[var(--db-ink-head)] flex flex-col p-5 gap-6 no-print">
        <div>
          <div className="font-display text-[15px] font-semibold">Disposition Tracker</div>
          <div className="text-[11px] text-[var(--db-ink-2)] mt-0.5">{session.user.name}</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-[var(--db-radius)] text-[13px] text-[var(--db-ink-2)] hover:bg-[var(--db-card-dark)] hover:text-[var(--db-ink-head)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="mt-auto"
        >
          <button className="text-[12px] text-[var(--db-muted-2)] hover:text-[var(--db-ink-head)]">
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-[var(--db-light)] p-8">{children}</main>
    </div>
  );
}
