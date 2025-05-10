"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../lib/firebase"
import { ThemeToggle } from "../components/theme-provider"
import DecryptText from "../components/decrypt-text"
import LetterGlitch from "../components/letter-glitch"
import Preloader from "../components/preloader"
import { VenetianMask, UserRoundX, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isEncoding, setIsEncoding] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const passwordChars = useRef<HTMLSpanElement[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  // Check for success message from signup
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get("signup") === "success") {
      setSuccess("Account created successfully! Please verify your email before logging in.")
    }
  }, [location])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if email is verified
      if (!user.emailVerified) {
        setError("Please verify your email before logging in. Check your inbox for a verification link.")
        await auth.signOut() // Sign out if email is not verified
        setIsLoading(false)
        return
      }

      // Successful login
      navigate("/home")
    } catch (error: any) {
      let errorMessage = "An error occurred during login"

      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address format"
          break
        case "auth/user-disabled":
          errorMessage = "This account has been disabled"
          break
        case "auth/user-not-found":
          errorMessage = "No account found with this email"
          break
        case "auth/wrong-password":
          errorMessage = "Incorrect password"
          break
        case "auth/too-many-requests":
          errorMessage = "Too many failed login attempts. Please try again later"
          break
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setIsEncoding(true)

    // Animate each character
    const chars = password.split("")
    chars.forEach((char, index) => {
      const element = passwordChars.current[index]
      if (element) {
        element.setAttribute("data-char", showPassword ? "•" : char)
        element.setAttribute("data-target", showPassword ? char : "•")
        element.classList.add("encrypting")

        setTimeout(() => {
          element.classList.remove("encrypting")
        }, 300)
      }
    })

    setTimeout(() => {
      setShowPassword(!showPassword)
      setIsEncoding(false)
    }, 300)
  }

  // Set up password character refs
  const setPasswordCharRef = (el: HTMLSpanElement | null, index: number) => {
    if (el) {
      passwordChars.current[index] = el
    }
  }

  return (
    <>
      <Preloader imagePath="/Ghost.gif" />

      <div className="min-h-screen flex flex-col md-flex-row">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 relative animate-fade-in">
          <ThemeToggle />

          <div className="form-container">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center mb-2">
                <VenetianMask className="h-10 w-10 text-primary mr-2" />
                <h1 className="text-3xl font-bold">Spotix Anonymous</h1>
              </div>
              <DecryptText
                originalText="Sign in to your account"
                finalText="Login to your account"
                className="text-muted"
              />
            </div>

            {success && (
              <div className="success-message">
                <AlertCircle className="success-icon" size={20} />
                {success}
              </div>
            )}

            {error && (
              <div className="error-message">
                <UserRoundX className="error-icon" size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className={`form-label ${emailFocused || email ? "active" : ""}`} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${emailFocused || email ? "with-label" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group password-field">
                <label className={`form-label ${passwordFocused || password ? "active" : ""}`} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${passwordFocused || password ? "with-label" : ""} ${isEncoding ? "animate-encoding" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  autoComplete="current-password"
                  style={{ color: isEncoding ? "transparent" : undefined }}
                />

                {/* Password overlay for animation */}
                {isEncoding && (
                  <div className="password-overlay">
                    {password.split("").map((char, i) => (
                      <span
                        key={i}
                        ref={(el) => setPasswordCharRef(el, i)}
                        className="password-char"
                        data-char={showPassword ? char : "•"}
                        data-target={showPassword ? "•" : char}
                      >
                        {showPassword ? char : "•"}
                      </span>
                    ))}
                  </div>
                )}

                <button type="button" onClick={togglePasswordVisibility} className="password-toggle">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="checkbox-container">
                  <input id="remember-me" name="remember-me" type="checkbox" className="checkbox" />
                  <label htmlFor="remember-me" className="text-sm">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-full ${isLoading ? "btn-disabled" : ""}`}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              <p className="mt-4 text-center text-sm text-muted">
                Don't have an account? <Link to="/signup">Sign up</Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right side - Decorative */}
        <div className="flex-1 bg-primary hidden md-flex flex-col justify-center items-center p-8 relative overflow-hidden decorative-side">
          <div className="decorative-content">
            <div className="animate-float">
              <VenetianMask className="decorative-icon" />
            </div>

            <h2 className="decorative-title">Stay Anonymous</h2>

            <p className="decorative-text">
              Connect with other students without revealing your identity. Share thoughts, ask questions, and express
              yourself freely.
            </p>
          </div>

          <div className="absolute inset-0 z-0">
            <LetterGlitch
              glitchColors={["#9158c7", "#6b2fa5", "#491c6e"]}
              glitchSpeed={50}
              outerVignette={true}
              centerVignette={false}
              smooth={true}
            />
          </div>
        </div>
      </div>
    </>
  )
}
