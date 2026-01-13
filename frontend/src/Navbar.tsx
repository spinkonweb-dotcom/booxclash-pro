import { useState } from "react";
import { Link } from "react-router-dom";
import { navLinks } from "./constants/navBarLinks"; // Using the imported links

import logo from "/logowhite.svg"; // Use .webp for smaller, faster loading
import menuIcon from "/assets/menu.svg";
import closeIcon from "/assets/close.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(prev => !prev);

  const NavItems = () => (
    <ul className="nav-ul flex flex-col sm:flex-row text-white font-light gap-4 sm:gap-5">
      {navLinks.map(({ id, href, name }) => (
        <li
          key={id}
          className="nav-li border-2 border-white px-4 py-2 rounded transition duration-200 hover:bg-white hover:text-blue-600"
        >
          <Link
            to={href}
            className="nav-li_a block w-full h-full"
            onClick={() => setIsOpen(false)}
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-blue/70 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-5 py-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-neutral-400 font-light text-xl hover:text-white transition-colors"
          >
            <img src={logo} alt="BooxClash Logo" className="w-30 h-10 object-contain" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="text-neutral-400 hover:text-white focus:outline-none sm:hidden flex"
            aria-label="Toggle Menu"
          >
            <img src={isOpen ? closeIcon : menuIcon} alt="menu toggle" className="w-6 h-6" />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex">
            <NavItems />
          </nav>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-black/90 sm:hidden">
          <nav className="flex flex-col items-center py-5">
            <NavItems />
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
