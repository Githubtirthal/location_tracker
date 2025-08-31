import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { isAuthed, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className={`sticky top-0 z-50 transition-all ${
      isScrolled ? "backdrop-blur bg-white/70 shadow-sm" : "bg-white shadow-sm"
    }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <svg className="h-8 w-8 text-sky-600 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-lg font-semibold tracking-tight text-slate-900">MapMates</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-all duration-200 hover:scale-105"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthed ? (
              <>
                <span className="text-sm text-slate-600">Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-700 hover:text-red-600 transition-all duration-200 hover:scale-105"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-all duration-200 hover:scale-105"
                >
                  Log in
                </Link>
                <Link
                  to="/login"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow-lg transition-all duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onClick={() => setIsOpen((s) => !s)}
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-1 rounded-md border border-slate-200 bg-white p-3 shadow">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
                             <div className="mt-2 flex items-center gap-2">
                 {isAuthed ? (
                   <>
                     <span className="flex-1 text-center text-sm text-slate-600 px-3 py-2">
                       Welcome, {user?.username}
                     </span>
                     <button
                       onClick={() => {
                         handleLogout();
                         setIsOpen(false);
                       }}
                       className="flex-1 rounded px-3 py-2 text-center text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                     >
                       Logout
                     </button>
                   </>
                 ) : (
                   <>
                     <Link
                       to="/login"
                       className="flex-1 rounded px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                       onClick={() => setIsOpen(false)}
                     >
                       Log in
                     </Link>
                     <Link
                       to="/login"
                       className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-200"
                       onClick={() => setIsOpen(false)}
                     >
                       Sign Up
                     </Link>
                   </>
                 )}
               </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


