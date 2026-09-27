import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Field, inputClass, Button } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: callbackUrl || "/engagements",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      }
      throw err;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--db-ground)]">
      <form
        action={login}
        className="w-full max-w-sm bg-[var(--db-card-dark)] rounded-[var(--db-radius)] p-8 flex flex-col gap-5"
      >
        <div>
          <div className="font-display text-[18px] font-semibold text-[var(--db-ink-head)]">
            Disposition Tracker
          </div>
          <div className="text-[12px] text-[var(--db-ink-2)] mt-1">Admin sign in</div>
        </div>
        {error && (
          <div className="text-[12px] text-[var(--db-fail)] bg-[rgba(180,35,31,0.1)] rounded-[var(--db-radius)] px-3 py-2">
            Invalid email or password.
          </div>
        )}
        <Field label="Email">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required className={inputClass} />
        </Field>
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  );
}
