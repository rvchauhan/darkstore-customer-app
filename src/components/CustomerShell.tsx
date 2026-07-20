import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { signOut, useSession } from "@/lib/session";
import { getCartApi } from "@/lib/api";

/**
 * Layout shell for authenticated customer-app pages — header + bottom mobile
 * nav, translated from the Stitch mockup's Header/MobileNav into real
 * Link/useRouterState-driven nav. Same auth-guard idiom as the portal's
 * AppShell: redirect via useEffect if there's no session, render nothing
 * until then.
 */
export function CustomerShell({
  children,
  searchValue,
  onSearchChange,
}: {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCartApi,
    enabled: !!session,
  });
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    if (!session) navigate({ to: "/" });
  }, [session, navigate]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="glass-card fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between px-6 shadow-sm">
        <div className="flex flex-1 items-center gap-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-xl font-bold whitespace-nowrap text-primary"
          >
            <span className="material-symbols-outlined">bolt</span>
            Velocity Commerce
          </Link>
          {onSearchChange && (
            <div className="relative hidden w-full max-w-md sm:block">
              <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full rounded-full border border-outline-variant/30 bg-surface-container-low py-2.5 pr-4 pl-11 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search products..."
                type="text"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Link
            to="/checkout"
            className="relative cursor-pointer rounded-full p-2 transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-destructive text-[10px] font-bold text-destructive-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            to="/orders"
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined">receipt_long</span>
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="cursor-pointer rounded-full p-2 transition-colors hover:bg-primary-container"
            title="Sign out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="pt-20">{children}</main>

      <MobileNav pathname={pathname} />
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const navigate = useNavigate();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant/30 bg-white px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
      <NavItem
        icon="home"
        label="Home"
        active={isActive("/home")}
        onClick={() => navigate({ to: "/home" })}
      />
      <NavItem
        icon="receipt_long"
        label="Orders"
        active={isActive("/orders")}
        onClick={() => navigate({ to: "/orders" })}
      />
      <NavItem
        icon="shopping_cart"
        label="Checkout"
        active={isActive("/checkout")}
        onClick={() => navigate({ to: "/checkout" })}
      />
      <NavItem
        icon="logout"
        label="Logout"
        active={false}
        onClick={() => {
          signOut();
          navigate({ to: "/" });
        }}
      />
    </nav>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center gap-1 ${active ? "text-primary" : "text-on-surface-variant"}`}
    >
      <span
        className="material-symbols-outlined text-2xl"
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className="text-[11px] font-bold">{label}</span>
    </div>
  );
}
