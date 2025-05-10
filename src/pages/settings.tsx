"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { doc, getDoc, updateDoc, deleteDoc, getDocs, setDoc } from "firebase/firestore"
import { auth, db, getLinkDocRef, getLinkMessagesCollection } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { uploadToCloudinary } from "../lib/cloudinary"
import { AnimatedButton } from "../components/animated-button"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { ArrowLeft, Upload, Trash2, AlertTriangle } from "lucide-react"
import "./settings.css"

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [link, setLink] = useState<any>(null)
  const [linkName, setLinkName] = useState("")
  const [formattedLinkName, setFormattedLinkName] = useState("")
  const [isPaused, setIsPaused] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()
  const { linkId } = useParams<{ linkId: string }>()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser)
      } else {
        // Redirect to login if not authenticated
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // Fetch link data
  useEffect(() => {
    const fetchLink = async () => {
      if (!linkId || !user) return

      try {
        const linkDocRef = getLinkDocRef(user.uid, linkId)
        const linkDoc = await getDoc(linkDocRef)

        if (!linkDoc.exists()) {
          navigate("/inbox")
          return
        }

        const linkData = linkDoc.data()

        // Check if user is the creator
        if (linkData.creatorId !== user.uid) {
          navigate("/inbox")
          return
        }

        setLink(linkData)
        setLinkName(linkData.name)
        setFormattedLinkName(linkData.formattedName)
        setIsPaused(linkData.isPaused || false)
        setPreviewUrl(linkData.imageUrl || null)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching link:", error)
        navigate("/inbox")
      }
    }

    if (user) {
      fetchLink()
    }
  }, [linkId, user, navigate])

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

  const handleBackClick = () => {
    navigate(`/inbox/${linkId}`)
  }

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
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!linkName) {
      setError("Please enter a name for your anonymous message link")
      return
    }

    if (!user || !linkId) {
      setError("An error occurred. Please try again.")
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = link.imageUrl

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

      // Check if link name has changed and needs to be updated
      if (formattedLinkName !== linkId) {
        // Create new document with new ID in user's collection
        const newLinkRef = getLinkDocRef(user.uid, formattedLinkName)

        // Copy all messages from old link to new link
        const messagesCollection = getLinkMessagesCollection(user.uid, linkId)
        const messagesSnapshot = await getDocs(messagesCollection)

        // Create new document with updated data
        await setDoc(newLinkRef, {
          name: linkName,
          formattedName: formattedLinkName,
          imageUrl,
          creatorId: user.uid,
          creatorUsername: user.displayName || "Anonymous User",
          isPaused,
          updatedAt: new Date(),
        })

        // Copy messages to new document
        const copyPromises = messagesSnapshot.docs.map(async (messageDoc) => {
          const messageData = messageDoc.data()
          const newMessageCollection = getLinkMessagesCollection(user.uid, formattedLinkName)
          await setDoc(doc(newMessageCollection, messageDoc.id), messageData)
        })

        await Promise.all(copyPromises)

        // Update the public reference
        await updateDoc(doc(db, "publicLinks", linkId), {
          linkId: formattedLinkName,
        })

        // Also create a new public reference if the ID changed
        await setDoc(doc(db, "publicLinks", formattedLinkName), {
          userId: user.uid,
          linkId: formattedLinkName,
          createdAt: new Date(),
        })

        // Delete old document
        await deleteDoc(getLinkDocRef(user.uid, linkId))

        // Redirect to new link
        navigate(`/settings/${formattedLinkName}`)

        setSuccess("Link updated successfully!")
      } else {
        // Update existing document
        await updateDoc(getLinkDocRef(user.uid, linkId), {
          name: linkName,
          imageUrl,
          isPaused,
          updatedAt: new Date(),
        })

        setSuccess("Link updated successfully!")
      }
    } catch (error: any) {
      console.error("Error updating link:", error)
      setError(error.message || "An error occurred while updating your link")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLink = async () => {
    if (!linkId || !user) return

    setIsSubmitting(true)

    try {
      // Delete all messages
      const messagesCollection = getLinkMessagesCollection(user.uid, linkId)
      const messagesSnapshot = await getDocs(messagesCollection)

      const deletePromises = messagesSnapshot.docs.map(async (messageDoc) => {
        await deleteDoc(doc(messagesCollection, messageDoc.id))
      })

      await Promise.all(deletePromises)

      // Delete link document from user's collection
      await deleteDoc(getLinkDocRef(user.uid, linkId))

      // Delete public reference
      await deleteDoc(doc(db, "publicLinks", linkId))

      navigate("/inbox")
    } catch (error) {
      console.error("Error deleting link:", error)
      setError("An error occurred while deleting your link")
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

        <main className="container p-4 md:p-8 flex-1">
          <div className="settings-container">
            <div className="settings-header">
              <button className="back-button" onClick={handleBackClick}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="settings-title">Link Settings</h1>
                <p className="settings-subtitle">{link.name}</p>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="settings-form">
              <div className="image-upload-section">
                <div className="image-preview">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Link"
                    className="link-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.onerror = null
                      target.src =
                        "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189b3ff4ccc%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189b3ff4ccc%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22157.1%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                    }}
                  />
                </div>
                <div className="image-upload">
                  <label htmlFor="imageUpload" className="upload-label">
                    <Upload size={20} />
                    Change Image
                  </label>
                  <input
                    type="file"
                    id="imageUpload"
                    className="file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isSubmitting || isUploading}
                  />

                  {isUploading && (
                    <div className="upload-progress-container">
                      <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      <span className="upload-progress-text">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="linkName" className="form-label">
                  Link Name
                </label>
                <input
                  type="text"
                  id="linkName"
                  className="form-input"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="Enter a name for your anonymous message link"
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
                <label className="toggle-label">
                  <span>Pause Responses</span>
                  <div className="toggle-container">
                    <input
                      type="checkbox"
                      checked={isPaused}
                      onChange={() => setIsPaused(!isPaused)}
                      disabled={isSubmitting || isUploading}
                      className="toggle-input"
                    />
                    <div className="toggle-switch"></div>
                  </div>
                </label>
                <p className="toggle-description">
                  When paused, users will not be able to send you messages through this link.
                </p>
              </div>

              <div className="form-actions">
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting || isUploading}
                  disabled={isSubmitting || isUploading || !linkName}
                  fullWidth
                >
                  Save Changes
                </AnimatedButton>
              </div>
            </form>

            <div className="danger-zone">
              <h2 className="danger-zone-title">Danger Zone</h2>

              {!showDeleteConfirm ? (
                <div className="delete-section">
                  <p className="delete-description">
                    Permanently delete this anonymous message link and all its messages. This action cannot be undone.
                  </p>
                  <AnimatedButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Link
                  </AnimatedButton>
                </div>
              ) : (
                <div className="delete-confirm">
                  <div className="delete-confirm-message">
                    <AlertTriangle size={24} className="warning-icon" />
                    <p>
                      <strong>{user?.displayName || "User"}</strong>, if you delete <strong>{link.name}</strong>, no one
                      can access and send you messages and you will lose all messages.
                    </p>
                  </div>
                  <div className="delete-confirm-actions">
                    <button
                      className="cancel-button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <AnimatedButton
                      type="button"
                      variant="outline"
                      onClick={handleDeleteLink}
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Proceed with Deletion
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
