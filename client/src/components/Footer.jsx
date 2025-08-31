import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showPolicy, setShowPolicy] = useState({ type: null, show: false });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const showPolicyModal = (type) => {
    setShowPolicy({ type, show: true });
  };

  const PolicyModal = () => {
    if (!showPolicy.show) return null;
    
    const content = {
      privacy: "We collect and use your information to provide our services. We do not sell your personal data to third parties.",
      terms: "By using our service, you agree to our terms. Use the platform responsibly and respect other users.",
      cookie: "We use cookies to improve your experience. Essential cookies are required for the platform to function properly."
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4 capitalize">{showPolicy.type} Policy</h3>
          <p className="text-slate-600 mb-6">{content[showPolicy.type]}</p>
          <button
            onClick={() => setShowPolicy({ type: null, show: false })}
            className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <footer className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 group">
                <svg className="h-10 w-10 text-sky-400 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="text-xl font-bold tracking-tight">MapMates</span>
              </Link>
              <p className="mt-4 text-slate-300 leading-relaxed">
                The most powerful real-time location tracking platform for teams and organizations.
              </p>
              <div className="mt-6 flex space-x-4">
                {[
                  { name: 'Twitter', href: 'https://twitter.com', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { name: 'GitHub', href: 'https://github.com', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> },
                  { name: 'LinkedIn', href: 'https://linkedin.com', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                  { name: 'Instagram', href: 'https://instagram.com', svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> }
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-all duration-300 hover:bg-slate-700 hover:scale-110 hover:text-white"
                    aria-label={social.name}
                  >
                    {social.svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold">Product</h3>
              <ul className="mt-4 space-y-3">
                <li><Link to="/" className="text-slate-300 transition-colors hover:text-white hover:underline">Home</Link></li>
                <li><Link to="/dashboard" className="text-slate-300 transition-colors hover:text-white hover:underline">Dashboard</Link></li>
                <li><button onClick={() => alert('API Documentation coming soon!')} className="text-slate-300 transition-colors hover:text-white hover:underline">API Docs</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="mt-4 space-y-3">
                <li><Link to="/about" className="text-slate-300 transition-colors hover:text-white hover:underline">About Us</Link></li>
                <li><Link to="/contact" className="text-slate-300 transition-colors hover:text-white hover:underline">Contact Us</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold">Get in Touch</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sky-400">📧</span>
                  <a href="mailto:tp7047044@gmail.com" className="text-slate-300 transition-colors hover:text-white">
                    tp7047044@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sky-400">📞</span>
                  <a href="tel:+916355362202" className="text-slate-300 transition-colors hover:text-white">
                    +91 6355362202
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sky-400">📍</span>
                  <span className="text-slate-300">Gujarat, India</span>
                </div>
              </div>
              
              {/* Newsletter */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-200">Stay Updated</h4>
                {subscribed ? (
                  <div className="mt-2 p-3 bg-green-600 rounded-lg text-center">
                    <p className="text-sm font-medium">Thank you for subscribing! 🎉</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="mt-2 flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                    <button type="submit" className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:scale-105">
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} MapMates Inc. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-slate-400">
                <button onClick={() => showPolicyModal('privacy')} className="transition-colors hover:text-white hover:underline">Privacy Policy</button>
                <button onClick={() => showPolicyModal('terms')} className="transition-colors hover:text-white hover:underline">Terms of Service</button>
                <button onClick={() => showPolicyModal('cookie')} className="transition-colors hover:text-white hover:underline">Cookie Policy</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <PolicyModal />
    </>
  );
}