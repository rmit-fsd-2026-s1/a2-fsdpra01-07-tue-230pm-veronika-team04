import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import type { NavItem } from "./Layout";

type NavbarProps = {
  items?: NavItem[];
  profileMenu?: ReactNode;
};

export default function Navbar({ items = [], profileMenu }: NavbarProps) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (items.length === 0 && !profileMenu && !currentUser) {
    return null;
  }

  return (
    <nav>
      <div className="flex items-center justify-end gap-3 sm:gap-4">
        {items.map((item) => (
          item.onClick ? (
            <button
              key={`${item.label}-action`}
              type="button"
              onClick={item.onClick}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              {item.label}
            </button>
            
          ) : (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href ?? "#"}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              {item.label}
            </Link>
          )
        ))}
        {currentUser ? (
          <>
            <span className="text-sm font-medium text-zinc-700">
              Welcome, {currentUser.name}
            </span>
            {/* <button
              type="button"
              onClick={handleLogout}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              Logout
            </button> */}
          </>
        ) : null}
        {profileMenu && <div className="ml-2">{profileMenu}</div>}
      </div>
    </nav>
  );
}
