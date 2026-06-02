import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import type { CurrentUser } from "@/types/user";

function getRoleRedirect(user: CurrentUser) {
  if (user.role === "vendor") {
    return "/vendor";
  }

  if (user.role === "admin") {
    // TODO: redirect admin to admin dashboard when implemented.
    // NOTE: Admin will be a seperate application, it may not be accessed directly via the website
    return "/";
  }

  return "/hirer";
}

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setFormError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      toaster.create({
        title: "Login successful.",
        description: `Welcome, ${user.name}! Redirecting...`,
        duration: 2000,
        type: "success",
      });

      setSuccessMessage(`Logged in as ${user.name}!`);
      router.push(getRoleRedirect(user));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again later.";

      setFormError(message);
      toaster.create({
        title: "Login failed.",
        description: message,
        duration: 3000,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <section className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
        <div
          className="relative flex items-center justify-center px-6 py-6 sm:px-10 lg:px-14"
          style={{ backgroundColor: "#fffaf3" }}
        >
          <Link
            href="/"
            className="absolute left-6 top-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 sm:left-10 lg:left-14"
          >
            Back
          </Link>
          <div className="w-full max-w-sm text-zinc-950">
            <div className="mt-4 text-center">
              <h2 className="text-3xl font-semibold tracking-wide text-zinc-900">
                Venue Vendors
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
                Sign in to your Venue Vendors account
              </p>
            </div>
            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                  placeholder="Enter your email"
                />
                {emailError ? (
                  <p className="mt-1.5 text-sm text-red-600">{emailError}</p>
                ) : null}
              </div>

              <div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                  placeholder="Enter your password"
                />
                {passwordError ? (
                  <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
                ) : null}
              </div>

              {formError ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}
              {successMessage ? (
                <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#095d44" }}
              >
                {isSubmitting ? "Signing in..." : "Sign In Now"}
              </button>
            </form>

            <p className="mt-4 text-sm text-zinc-600">
              Don&apos;t have an account?{" "}
              <Link href="/sign_up" className="font-medium text-zinc-950 underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-center px-6 py-6 text-white sm:px-10 lg:px-14"
          style={{ backgroundColor: "#03533b" }}
        >
          <div className="w-full max-w-sm">
            <h1 className="mt-2 text-5xl italic font-semibold leading-tight">
              Welcome
            </h1>
            <h2 className="mt-2 text-3xl leading-tight">
              A simple platform where hirers explore venues and vendors manage
              applications with clarity.
            </h2>
          </div>
        </div>
      </section>
    </main>
  );
}
