import type { ReactNode } from "react";

import Footer from "./Footer";
import Header from "./Header";
import Navbar from "./Navbar";
import ProfileMenu from "../ProfileMenu";
import { useAuth } from "@/context/AuthContext";

export type NavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type LayoutProps = {
  children: ReactNode;
  headerTitle?: string;
  footerText?: string;
  navItems?: NavItem[];
  showHeader?: boolean;
  showNavbar?: boolean;
  showFooter?: boolean;
  mainClassName?: string;
};

export default function Layout({
  children,
  headerTitle,
  footerText,
  navItems,
  showHeader = true,
  showNavbar = true,
  showFooter = true,
  mainClassName = "",
}: LayoutProps) {
  const { currentUser } = useAuth();
  
  return (
    
    <div
      className="flex min-h-screen flex-col text-black"
      style={{ backgroundColor: "#fffaf3" }}
    >
      {showHeader || showNavbar ? (
        <div className="relative z-10 border-b border-black/10 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-5">
            {showHeader ? <Header title={headerTitle} /> : <div />}
            {showNavbar ? <Navbar 
              items={navItems} 
              profileMenu={currentUser ? <ProfileMenu /> : undefined}/> : null
            }
          </div>
        </div>
      ) : null}
      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-5 ${mainClassName}`.trim()}
        style={{ backgroundColor: "#fffaf3" }}
      >
        {children}
      </main>
      {showFooter ? <Footer text={footerText} /> : null}
    </div>
  );
}
