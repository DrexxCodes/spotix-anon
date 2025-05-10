"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { VenetianMask, Menu, X } from "lucide-react"
import { ThemeToggle } from "./theme-provider"
import "./header.css"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    // Prevent scrolling when menu is open
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const navItems = [
    { name: "Home", path: "/home" },
    { name: "Create Link", path: "/create-link" },
    { name: "Inbox", path: "/inbox" },
    { name: "Profile", path: "/profile" },
    { name: "A.G.C", path: "/agc" },
  ]

  // Check if current path is a response page
  const isResponsePage = location.pathname.startsWith("/response/")

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <VenetianMask className="header-icon" />
          <h1 className="header-title">Spotix Anonymous</h1>
        </div>

        {/* Desktop Navigation - Only show if not on response page */}
        {!isResponsePage && (
          <nav className="header-nav desktop-nav">
            <ul className="nav-list">
              {navItems.map((item) => (
                <li key={item.name} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${
                      location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) ? "active" : ""
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="header-actions">
          {/* Theme toggle only visible on desktop */}
          {!isMobile && <ThemeToggle />}

          {/* Only show hamburger menu if not on response page */}
          {isMobile && !isResponsePage && (
            <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="mobile-nav-overlay">
          <div className="mobile-nav-container">
            <div className="mobile-nav-header">
              <button className="close-menu" onClick={closeMenu} aria-label="Close menu">
                <X size={24} />
              </button>
              <h2 className="mobile-nav-title">Menu</h2>
            </div>

            <nav className="mobile-nav">
              <ul className="mobile-nav-list">
                {navItems.map((item) => (
                  <li key={item.name} className="mobile-nav-item">
                    <Link
                      to={item.path}
                      className={`mobile-nav-link ${
                        location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) ? "active" : ""
                      }`}
                      onClick={closeMenu}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Theme toggle at the bottom of mobile menu */}
            <div className="mobile-theme-toggle">
              <div className="mobile-theme-toggle-container">
                <span className="mobile-theme-toggle-label">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
