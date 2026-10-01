"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PageFlags = {
  showTopNav: boolean;
  showSidebar: boolean;
  showFooter: boolean;
};

function resolvePage(pathname: string, pages: Record<string, PageFlags>) {
  if (pages[pathname]) return pages[pathname];

  const prefix = Object.keys(pages)
    .filter(
      (path) => path !== "/" && pathname.startsWith(`${path}/`),
    )
    .sort((a, b) => b.length - a.length)[0];

  return prefix ? pages[prefix] : undefined;
}

export default function PageChrome({
  pages,
  topNav,
  sidebar,
  footer,
  children,
}: {
  pages: Record<string, PageFlags>;
  topNav: ReactNode;
  sidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const page = resolvePage(pathname, pages);
  const showTopNav = page ? page.showTopNav : true;
  const showSidebar = page ? page.showSidebar : false;
  const showFooter = page ? page.showFooter : true;

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {showTopNav ? topNav : null}
      <div className="flex min-h-0 flex-1">
        {showSidebar ? sidebar : null}
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      {showFooter ? footer : null}
    </div>
  );
}
