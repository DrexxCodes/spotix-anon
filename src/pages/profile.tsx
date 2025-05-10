"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  onAuthStateChanged,
  signOut,
  updateEmail,
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { AnimatedButton } from "../components/animated-button"
import { User, Mail, Key, Save, AlertTriangle, LogOut, Crown, Trash2 } from "lucide-react"
import "./profile.css"

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isResetingPassword, setIsResetingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser)
        setEmail(currentUser.email || "")

        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData(data)
            setUsername(data.username || currentUser.displayName || "")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        navigate("/login")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const updateUsername = async () => {
    if (!user || !username.trim()) return

    setIsUpdatingUsername(true)
    setError(null)
    setSuccess(null)

    try {
      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        username,
        updatedAt: new Date(),
      })

      setSuccess("Username updated successfully!")
    } catch (error: any) {
      console.error("Error updating username:", error)
      setError(error.message || "Failed to update username")
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const updateUserEmail = async () => {
    if (!user || !email.trim() || !currentPassword.trim()) return

    setIsUpdatingEmail(true)
    setError(null)
    setSuccess(null)

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email || "", currentPassword)

      await reauthenticateWithCredential(user, credential)

      // Update email in Firebase Auth
      await updateEmail(user, email)

      // Update email in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        email,
        updatedAt: new Date(),
      })

      setSuccess("Email update initiated. Please check your inbox for verification.")
      setCurrentPassword("")
    } catch (error: any) {
      console.error("Error updating email:", error)

      if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.")
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use by another account.")
      } else {
        setError(error.message || "Failed to update email")
      }
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const resetPassword = async () => {
    if (!user || !user.email) return

    setIsResetingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      await sendPasswordResetEmail(auth, user.email)
      setSuccess("Password reset email sent. Please check your inbox.")
    } catch (error: any) {
      console.error("Error sending password reset:", error)
      setError(error.message || "Failed to send password reset email")
    } finally {
      setIsResetingPassword(false)
    }
  }

  const deleteAccount = async () => {
    if (!user || !currentPassword.trim()) return

    setIsDeleting(true)
    setError(null)

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email || "", currentPassword)

      await reauthenticateWithCredential(user, credential)

      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", user.uid))

      // Delete user from Firebase Auth
      await deleteUser(user)

      // Redirect to login
      navigate("/login")
    } catch (error: any) {
      console.error("Error deleting account:", error)

      if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.")
      } else {
        setError(error.message || "Failed to delete account")
      }

      setIsDeleting(false)
    }
  }

  const isPremium = userData?.plan === "premium"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-subtle">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Preloader imagePath="/Ghost.gif" />

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="container p-8 flex-1">
          <div className="profile-container">
            <div className="profile-header">
              <h1 className="profile-title">Your Profile</h1>
              <div className="profile-subtitle">
                Manage your account settings
                {isPremium && (
                  <span className="premium-badge">
                    <Crown size={14} /> Premium
                  </span>
                )}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="profile-section">
              <h2 className="section-title">
                <User size={20} className="section-icon" />
                Profile Information
              </h2>

              <div className="form-group">
                <div className="input-with-button">
                  <input
                    type="text"
                    id="username"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                  />
                  <AnimatedButton
                    onClick={updateUsername}
                    isLoading={isUpdatingUsername}
                    disabled={isUpdatingUsername || !username.trim()}
                    variant="primary"
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </AnimatedButton>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2 className="section-title">
                <Key size={20} className="section-icon" />
                Authentication Settings
              </h2>

              <div className="form-group">
                <div className="input-with-button">
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-with-button">
                  <input
                    type="password"
                    id="current-password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                  <AnimatedButton
                    onClick={updateUserEmail}
                    isLoading={isUpdatingEmail}
                    disabled={isUpdatingEmail || !email.trim() || !currentPassword.trim()}
                    variant="primary"
                  >
                    <Mail size={16} className="mr-2" />
                    Update Email
                  </AnimatedButton>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password Reset</label>
                <p className="form-description">
                  Need to change your password? We'll send you a reset link to your email address.
                </p>
                <AnimatedButton
                  onClick={resetPassword}
                  isLoading={isResetingPassword}
                  disabled={isResetingPassword}
                  variant="outline"
                >
                  <Key size={16} className="mr-2" />
                  Send Password Reset Email
                </AnimatedButton>
              </div>
            </div>

            <div className="profile-section danger-zone">
              <h2 className="section-title danger-title">
                <AlertTriangle size={20} className="section-icon" />
                Danger Zone
              </h2>

              {!showDeleteConfirm ? (
                <div className="danger-action">
                  <div className="danger-info">
                    <h3 className="danger-action-title">Delete Account</h3>
                    <p className="danger-description">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <AnimatedButton
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Account
                  </AnimatedButton>
                </div>
              ) : (
                <div className="delete-confirm">
                  <div className="delete-warning">
                    <AlertTriangle size={24} className="warning-icon" />
                    <p>
                      <strong>Warning:</strong> This will permanently delete your account, all your anonymous links, and
                      messages. This action cannot be undone.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="delete-password" className="form-label">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      id="delete-password"
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Your current password"
                    />
                  </div>

                  <div className="delete-actions">
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setCurrentPassword("")
                      }}
                    >
                      Cancel
                    </button>
                    <AnimatedButton
                      onClick={deleteAccount}
                      isLoading={isDeleting}
                      disabled={isDeleting || !currentPassword.trim()}
                      variant="outline"
                    //   className="danger-button"
                    >
                      Permanently Delete My Account
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </div>

            <div className="profile-footer">
              <AnimatedButton onClick={handleSignOut} variant="outline">
                <LogOut size={16} className="mr-2" />
                Sign Out
              </AnimatedButton>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
