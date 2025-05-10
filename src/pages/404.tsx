"use client"

import { Link } from "react-router-dom"
import { ThemeToggle } from "../components/theme-provider"
import { AnimatedButton } from "../components/animated-button"
import DecryptText from "../components/decrypt-text"
import { Ghost, Home, ArrowRight } from "lucide-react"
import "./404.css"

export default function NotFound() {
  return (
    <div className="not-found-container">
      <ThemeToggle />

      <div className="not-found-ghost">
        <Ghost size={100} className="ghost-icon" />
      </div>

      <h1 className="not-found-code">404</h1>

      <h2 className="not-found-title">
        <DecryptText originalText="Page Not Found" finalText="Nothing Here" interval={5000} />
      </h2>

      <p className="not-found-message">
        Hmmm, looks like we don't have anything for you here. Maybe you're trying to go to the home page? Let's help you
        find your way back.
      </p>

      <div className="not-found-actions">
        <Link to="/home">
          <AnimatedButton variant="primary">
            <Home size={18} className="mr-2" />
            Go to Home
          </AnimatedButton>
        </Link>

        <Link to="/login" className="login-link">
          <span>Or sign in</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
