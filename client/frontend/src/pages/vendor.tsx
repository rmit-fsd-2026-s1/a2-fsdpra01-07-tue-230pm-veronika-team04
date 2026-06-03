import { useRouter } from "next/router";
import { useEffect } from "react";

import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";

export default function VendorPage() {
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!currentUser || currentUser.role !== "vendor") {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);

  if (!isAuthReady || !currentUser || currentUser.role !== "vendor") {
    return null;
  }

  return (
    <Layout headerTitle="Vendor Dashboard" footerText="Student project footer">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-zinc-950">
          Vendor Dashboard
        </h1>
        <p className="text-zinc-700">
          You are signed in as a vendor.
        </p>
      </section>
    </Layout>
  );
}
