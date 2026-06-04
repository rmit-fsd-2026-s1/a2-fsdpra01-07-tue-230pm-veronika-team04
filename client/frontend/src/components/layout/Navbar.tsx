import Link from "next/link";
import type { ReactNode } from "react";

import type { NavItem } from "./Layout";

type NavbarProps = {
  items?: NavItem[];
  profileMenu?: ReactNode;
};

export default function Navbar({ items = [], profileMenu }: NavbarProps) {
  if (items.length === 0 && !profileMenu) {
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
        {profileMenu && <div className="ml-2">{profileMenu}</div>}
      </div>
    </nav>
  );
}
