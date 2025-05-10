"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { ThemeToggle } from "../components/theme-provider"
import DecryptText from "../components/decrypt-text"
import LetterGlitch from "../components/letter-glitch"
import Preloader from "../components/preloader"
import { VenetianMask, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isEncoding, setIsEncoding] = useState(false)
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const passwordChars = useRef<HTMLSpanElement[]>([])
  const confirmPasswordChars = useRef<HTMLSpanElement[]>([])
  const navigate = useNavigate()

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !username) {
      setError("All fields are required")
      return false
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }

    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with username
      await updateProfile(user, {
        displayName: username,
      })

      // Send email verification
      await sendEmailVerification(user)

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        plan: "free", // Set default plan to free
        linkCount: 0, // Initialize link count to 0
        maxLinks: 5, // Set maximum links for free plan
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Sign out the user so they need to verify email before logging in
      await auth.signOut()

      // Redirect to login page with success message
      navigate("/login?signup=success")
    } catch (error: any) {
      let errorMessage = "An error occurred during signup"

      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email address is already in use"
          break
        case "auth/invalid-email":
          errorMessage = "Invalid email address format"
          break
        case "auth/weak-password":
          errorMessage = "Password is too weak"
          break
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled"
          break
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setIsEncoding(true)

    // Animate each character
    if (field === "password") {
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
    } else {
      const chars = confirmPassword.split("")
      chars.forEach((char, index) => {
        const element = confirmPasswordChars.current[index]
        if (element) {
          element.setAttribute("data-char", showConfirmPassword ? "•" : char)
          element.setAttribute("data-target", showConfirmPassword ? char : "•")
          element.classList.add("encrypting")

          setTimeout(() => {
            element.classList.remove("encrypting")
          }, 300)
        }
      })

      setTimeout(() => {
        setShowConfirmPassword(!showConfirmPassword)
        setIsEncoding(false)
      }, 300)
    }
  }

  // Set up password character refs
  const setPasswordCharRef = (el: HTMLSpanElement | null, index: number) => {
    if (el) {
      passwordChars.current[index] = el
    }
  }

  const setConfirmPasswordCharRef = (el: HTMLSpanElement | null, index: number) => {
    if (el) {
      confirmPasswordChars.current[index] = el
    }
  }

  return (
    <>
      <Preloader imagePath="/Ghost.gif" />

      <div className="min-h-screen flex flex-col md-flex-row">
        {/* Left side - Decorative */}
        <div className="flex-1 bg-primary hidden md-flex flex-col justify-center items-center p-8 relative overflow-hidden decorative-side">
          <div className="decorative-content">
            <div className="animate-float">
              <VenetianMask className="decorative-icon" />
            </div>

            <h2 className="decorative-title">Join Anonymously</h2>

            <p className="decorative-text">
              Create your anonymous identity and start connecting with other students. Your privacy is our priority.
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

        {/* Right side - Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 relative animate-fade-in">
          <ThemeToggle />

          <div className="form-container">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center mb-2">
                <VenetianMask className="h-10 w-10 text-primary mr-2" />
                <h1 className="text-3xl font-bold">Spotix Anonymous</h1>
              </div>
              <DecryptText originalText="Create anonymous account" finalText="Sign Up Today" className="text-muted" />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label className={`form-label ${usernameFocused || username ? "active" : ""}`} htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className={`form-input ${usernameFocused || username ? "with-label" : ""}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  required
                  autoComplete="username"
                />
              </div>

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
                  autoComplete="new-password"
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

                <button type="button" onClick={() => togglePasswordVisibility("password")} className="password-toggle">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="form-group password-field">
                <label
                  className={`form-label ${confirmPasswordFocused || confirmPassword ? "active" : ""}`}
                  htmlFor="confirm-password"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-input ${confirmPasswordFocused || confirmPassword ? "with-label" : ""} ${isEncoding ? "animate-encoding" : ""}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  required
                  autoComplete="new-password"
                  style={{ color: isEncoding ? "transparent" : undefined }}
                />

                {/* Confirm Password overlay for animation */}
                {isEncoding && (
                  <div className="password-overlay">
                    {confirmPassword.split("").map((char, i) => (
                      <span
                        key={i}
                        ref={(el) => setConfirmPasswordCharRef(el, i)}
                        className="password-char"
                        data-char={showConfirmPassword ? char : "•"}
                        data-target={showConfirmPassword ? "•" : char}
                      >
                        {showConfirmPassword ? char : "•"}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className={`btn btn-primary btn-full ${isLoading ? "btn-disabled" : ""}`}
                  disabled={isLoading || !email || !password || !confirmPassword || !username}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-muted">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
