// src/components/Footer.jsx

import { Link, useLocation } from "react-router-dom";
import {
  FaLinkedin,
  FaGithub,
  FaInstagram
} from "react-icons/fa";

function Footer() {
  const location = useLocation();

  const hideFooterRoutes = [
    "/login",
    "/register"
  ];

  if (hideFooterRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Brand */}
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
            Spanish Learning Platform
          </h2>

          <p className="text-sm leading-relaxed text-gray-400 max-w-2xl mx-auto">
            Learn Spanish through levels, lessons, real-life topics,
            interactive missions and guided practice.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Platform */}
          <div className="text-left">
            <h3 className="text-white font-semibold mb-4">
              Platform
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/welcome"
                  className="hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  to="/curso"
                  className="hover:text-white transition-colors"
                >
                  Courses
                </Link>
              </li>

              <li>
                <Link
                  to="/temas"
                  className="hover:text-white transition-colors"
                >
                  Topics
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-left">
            <h3 className="text-white font-semibold mb-4">
              Legal
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  to="/security"
                  className="hover:text-white transition-colors"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="col-span-2 lg:col-span-1 text-center lg:text-left">
            <h3 className="text-white font-semibold mb-4">
              Community
            </h3>

            <div className="flex justify-center lg:justify-start gap-5 mb-5">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={22} />
              </a>

              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <FaGithub size={22} />
              </a>

              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={22} />
              </a>
            </div>

            <p className="text-sm leading-relaxed text-gray-400 max-w-sm mx-auto lg:mx-0">
              AI-powered learning assistance, guided practice and
              interactive educational experiences.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs sm:text-sm text-gray-500">
          © {new Date().getFullYear()} Spanish Learning Platform.
          All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;