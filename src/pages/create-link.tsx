"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore"
import { auth, db, getUserLinksCollection } from "../lib/firebase"
import { uploadToCloudinary } from "../lib/cloudinary"
import { AnimatedButton } from "../components/animated-button"
import DecryptText from "../components/decrypt-text"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { Upload, X, Lock } from "lucide-react"
import "./create-link.css"

export default function CreateLink() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [linkName, setLinkName] = useState("")
  const [formattedLinkName, setFormattedLinkName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const navigate = useNavigate()
  const [copyUrl, setCopyUrl] = useState<string | null>(null)
  const [reachedLimit, setReachedLimit] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser)

        // Fetch user data to check link count and plan
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserData(userData)

            // Check if user has reached their link limit
            if (userData.plan === "free" && userData.linkCount >= userData.maxLinks) {
              setReachedLimit(true)
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        // Redirect to login if not authenticated
        navigate("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  // Format link name (replace spaces with hyphens)
  useEffect(() => {
    if (linkName) {
      const formatted = linkName
        .toLowerCase()
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, "") // Remove special characters
      setFormattedLinkName(formatted)
    } else {
      setFormattedLinkName("")
    }
  }, [linkName])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setUploadProgress(0)

    if (file) {
      const fileReader = new FileReader()
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string)
      }
      fileReader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
  }

  const handleCopyUrl = () => {
    if (!copyUrl) return
    navigator.clipboard.writeText(copyUrl)
    alert("Link copied to clipboard!")
  }

  // Navigate to upgrade page
  const handleUpgrade = () => {
    navigate("/settings?tab=subscription")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formattedLinkName) {
      setError("Please enter a name for your anonymous message link")
      return
    }

    if (!user) {
      setError("You must be logged in to create an anonymous message link")
      return
    }

    // Check if user has reached their link limit
    if (userData.plan === "free" && userData.linkCount >= userData.maxLinks) {
      setError("You've reached your limit of 5 links. Upgrade to create more!")
      setReachedLimit(true)
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = null

      // Upload image if selected
      if (selectedFile) {
        setIsUploading(true)
        try {
          // Generate a unique file name
          const fileName = `${formattedLinkName}_${Date.now()}`

          // Upload to Cloudinary
          imageUrl = await uploadToCloudinary(selectedFile, fileName, (progress) => {
            setUploadProgress(progress)
          })

          if (!imageUrl) {
            throw new Error("Failed to upload image")
          }
        } catch (uploadError: any) {
          setError(`Upload error: ${uploadError.message}`)
          setIsSubmitting(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      // Create document in Firestore under the user's collection
      const linkId = formattedLinkName
      const userLinksCollection = getUserLinksCollection(user.uid)
      await setDoc(doc(userLinksCollection, linkId), {
        name: linkName,
        formattedName: formattedLinkName,
        imageUrl,
        creatorId: user.uid,
        creatorUsername: user.displayName || "Anonymous User",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Also create a public reference for anonymous access
      await setDoc(doc(db, "publicLinks", linkId), {
        userId: user.uid,
        linkId: formattedLinkName,
        createdAt: serverTimestamp(),
      })

      // Increment the user's link count
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        linkCount: increment(1),
        updatedAt: serverTimestamp(),
      })

      // Update local state
      setUserData({
        ...userData,
        linkCount: userData.linkCount + 1,
      })

      // Check if user has now reached their limit
      if (userData.plan === "free" && userData.linkCount + 1 >= userData.maxLinks) {
        setReachedLimit(true)
      }

      const linkUrl = `${window.location.origin}/response/${linkId}`
      setSuccess("Your anonymous message link has been created!")
      setCopyUrl(linkUrl)

      // Reset form
      setLinkName("")
      setSelectedFile(null)
      setPreviewUrl(null)
      setUploadProgress(0)
    } catch (error: any) {
      console.error("Error creating link:", error)
      setError(error.message || "An error occurred while creating your anonymous message link")
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <div className="create-link-container">
            <div className="create-link-header">
              <h1 className="create-link-title">
                <DecryptText
                  originalText="Create Anonymous Message"
                  finalText="Get Anonymous Responses"
                  interval={10000}
                />
              </h1>
              <div className="create-link-subtitle">
                <DecryptText
                  originalText="Share your link with friends"
                  finalText="Real people, Anonymous messages"
                  interval={10000}
                />
              </div>
            </div>

            {userData && userData.plan === "free" && (
              <div className="link-limit-info">
                <div className="link-count">
                  <span>Links created: </span>
                  <span className={userData.linkCount >= userData.maxLinks ? "text-red-500" : ""}>
                    {userData.linkCount} / {userData.maxLinks}
                  </span>
                </div>
                <div className="link-limit-progress">
                  <div
                    className="link-limit-bar"
                    style={{
                      width: `${Math.min((userData.linkCount / userData.maxLinks) * 100, 100)}%`,
                      backgroundColor:
                        userData.linkCount >= userData.maxLinks ? "var(--color-error)" : "var(--color-primary)",
                    }}
                  ></div>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {reachedLimit && (
              <div className="limit-reached-box">
                <div className="limit-reached-icon">
                  <Lock size={32} />
                </div>
                <h3 className="limit-reached-title">Link Limit Reached</h3>
                <p className="limit-reached-message">
                  You've used all 5 links available on the free plan. Upgrade to our premium plan for unlimited links
                  and additional features.
                </p>
                <button onClick={handleUpgrade} className="upgrade-button">
                  Upgrade Now
                </button>
              </div>
            )}

            {copyUrl && (
              <div className="copy-url-box" onClick={handleCopyUrl}>
                <p className="copy-url-text">{copyUrl}</p>
                <p className="copy-url-hint">Tap to copy</p>
              </div>
            )}

            {!reachedLimit && (
              <form onSubmit={handleSubmit} className="create-link-form">
                <div className="form-group">
                  <input
                    type="text"
                    id="linkName"
                    className="form-input"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Name your link"
                    disabled={isSubmitting || isUploading}
                    required
                  />
                  {formattedLinkName && (
                    <div className="formatted-link-preview">
                      Your link will be: <span className="formatted-link">{formattedLinkName}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <div className="file-upload-container">
                    {!previewUrl ? (
                      <div className="file-upload-area">
                        <input
                          type="file"
                          id="imageUpload"
                          className="file-input"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isSubmitting || isUploading}
                        />
                        <label htmlFor="imageUpload" className="file-upload-label">
                          <Upload className="upload-icon" />
                          <span>Click to upload an image</span>
                          <span className="file-upload-hint">PNG, JPG or GIF (max. 5MB)</span>
                        </label>
                      </div>
                    ) : (
                      <div className="file-preview">
                        <div className="file-preview-image-container">
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Preview"
                            className="file-preview-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.onerror = null
                              target.src =
                                "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189b3ff4ccc%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189b3ff4ccc%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22157.1%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                            }}
                          />
                          <button
                            type="button"
                            className="remove-file-button"
                            onClick={handleRemoveFile}
                            disabled={isSubmitting || isUploading}
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <span className="file-name">{selectedFile?.name}</span>

                        {/* Upload progress bar */}
                        {isUploading && (
                          <div className="upload-progress-container">
                            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                            <span className="upload-progress-text">{uploadProgress}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting || isUploading}
                    disabled={isSubmitting || isUploading || !formattedLinkName}
                    fullWidth
                  >
                    Create Anonymous Message Link
                  </AnimatedButton>
                </div>
              </form>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
