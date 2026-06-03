import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const user = await signup({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        phone,
      });

      toaster.create({
        title: "Signup successful.",
        description: `Welcome, ${user.name}! Redirecting...`,
        duration: 2000,
        type: "success",
      });

      setSuccessMessage(`Account created for ${user.name}.`);
      // Keep the A1 signup flow: users sign in explicitly after account creation.
      router.push("/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again later.";

      setFormError(message);
      toaster.create({
        title: "Signup failed.",
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
                Create your hirer account
              </p>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                  placeholder="First name"
                />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                  placeholder="Last name"
                />
              </div>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                placeholder="Enter your email"
              />

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                placeholder="Phone number"
              />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-950 outline-none transition-colors focus:border-zinc-900"
                placeholder="Create a password"
              />

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
                className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-70"
                style={{ backgroundColor: "#095d44" }}
              >
                {isSubmitting ? "Creating account..." : "Sign Up Now"}
              </button>
            </form>

            <p className="mt-4 text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-zinc-950 underline">
                Sign In
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
              Join
            </h1>
            <h2 className="mt-2 text-3xl leading-tight">
              Find venues for your next event with one hirer account.
            </h2>
          </div>
        </div>
      </section>
    </main>
  );
}
