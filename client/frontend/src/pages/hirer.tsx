import { useRouter } from "next/router";
import { useEffect } from "react";

import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";

export default function HirerPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!currentUser || currentUser.role !== "hirer") {
      router.replace("/sign_in");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser || currentUser.role !== "hirer") {
    return null;
  }

  return (
    <Layout headerTitle="Hirer Dashboard" footerText="Student project footer">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-zinc-950">
          Hirer Dashboard
        </h1>
        <p className="text-zinc-700">
          You are signed in as a hirer.
        </p>
      </section>
    </Layout>
  );
}
