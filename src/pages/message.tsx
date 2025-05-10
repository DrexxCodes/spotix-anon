"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { ArrowLeft, Share2, Maximize2, Minimize2, CheckCircle, XCircle, Lock, Crown, Copy } from "lucide-react"
import { AnimatedButton } from "../components/animated-button"
import html2canvas from "html2canvas"
import "./message.css"

export default function Message() {
  const [setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<any>(null)
  const [link, setLink] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [userPlan, setUserPlan] = useState<string>("free") // Default to free
  const messageBoxRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { linkId, messageId } = useParams<{ linkId: string; messageId: string }>()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser)

        // Fetch user's plan
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserPlan(userData.plan || "free")
          } else {
            setUserPlan("free")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserPlan("free")
        }
      } else {
        // Redirect to login if not authenticated
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // Fetch message and link data
  useEffect(() => {
    const fetchData = async () => {
      if (!linkId || !messageId) {
        navigate("/inbox")
        return
      }

      try {
        // Fetch link data
        const linkDoc = await getDoc(doc(db, "anonymousLinks", linkId))

        if (!linkDoc.exists()) {
          navigate("/inbox")
          return
        }

        const linkData = linkDoc.data()
        setLink(linkData)

        // Fetch message data
        const messageDoc = await getDoc(doc(db, "anonymousLinks", linkId, "messages", messageId))

        if (!messageDoc.exists()) {
          navigate(`/inbox/${linkId}`)
          return
        }

        const messageData = messageDoc.data()
        setMessage({
          id: messageId,
          ...messageData,
          createdAt: messageData.createdAt?.toDate() || new Date(),
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        navigate("/inbox")
      }
    }

    fetchData()
  }, [linkId, messageId, navigate])

  const handleBackClick = () => {
    navigate(`/inbox/${linkId}`)
  }

  const toggleReadStatus = async () => {
    if (!message || !linkId || !messageId) return

    try {
      const messageRef = doc(db, "anonymousLinks", linkId, "messages", messageId)
      await updateDoc(messageRef, {
        isRead: !message.isRead,
      })

      // Update local state
      setMessage({
        ...message,
        isRead: !message.isRead,
      })
    } catch (error) {
      console.error("Error updating message:", error)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const generateShareImage = async () => {
    if (!messageBoxRef.current) return

    setIsGeneratingImage(true)

    try {
      const canvas = await html2canvas(messageBoxRef.current, {
        backgroundColor: null,
        scale: 2,
      })

      const image = canvas.toDataURL("image/png")

      // Create a temporary link element to download the image
      const link = document.createElement("a")
      link.href = image
      link.download = `anonymous-message-${new Date().getTime()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // For sharing on mobile devices
      if (navigator.share) {
        const blob = await (await fetch(image)).blob()
        const file = new File([blob], "anonymous-message.png", { type: "image/png" })

        navigator
          .share({
            title: "Anonymous Message",
            text: "Check out this anonymous message I received!",
            files: [file],
          })
          .catch((error) => {
            console.error("Error sharing:", error)
          })
      }
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleUpgradeClick = () => {
    window.open("https://spotix.site/pricing", "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-subtle">Loading...</div>
      </div>
    )
  }

  const isPremium = userPlan === "premium"

  return (
    <>
      <Preloader imagePath="/Ghost.gif" />

      <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? "fullscreen-mode" : ""}`}>
        {!isFullscreen && <Header />}

        <main className={`container p-4 md:p-8 flex-1 ${isFullscreen ? "fullscreen-container" : ""}`}>
          <div className="message-container">
            {!isFullscreen && (
              <div className="message-header">
                <button className="back-button" onClick={handleBackClick}>
                  <ArrowLeft size={20} />
                </button>
                <h1 className="message-title">Anonymous Message</h1>
                <div className="message-actions">
                  <button
                    className={`read-status-button ${message.isRead ? "read" : "unread"}`}
                    onClick={toggleReadStatus}
                    title={message.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {message.isRead ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </button>
                  <button className="fullscreen-button" onClick={toggleFullscreen} title="Toggle fullscreen">
                    <Maximize2 size={20} />
                  </button>
                  <button
                    className="share-button"
                    onClick={generateShareImage}
                    disabled={isGeneratingImage}
                    title="Share as image"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className={`message-box-container ${isFullscreen ? "fullscreen" : ""}`} ref={messageBoxRef}>
              {isFullscreen && (
                <button className="exit-fullscreen-button" onClick={toggleFullscreen}>
                  <Minimize2 size={20} />
                </button>
              )}

              <div className="message-box">
                <div className="message-box-header">
                  <div className="message-logo">
                    <img
                      src={link.imageUrl || "/placeholder.svg"}
                      alt="Logo"
                      className="message-logo-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src =
                          "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189b3ff4ccc%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189b3ff4ccc%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22157.1%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                      }}
                    />
                  </div>
                  <div className="message-meta">
                    <h2 className="message-sender">Anonymous</h2>
                    <p className="message-time">{formatDate(message.createdAt)}</p>
                  </div>
                </div>

                <div className="message-content">
                  <p>{message.message}</p>
                </div>

                <div className="message-footer">
                  <div className="message-footer-branding">
                    <p className="message-footer-text">via Spotix Anonymous</p>
                    {isPremium && (
                      <span className="premium-badge">
                        <Crown size={14} /> Premium
                      </span>
                    )}
                  </div>
                  <div className="message-footer-pattern"></div>
                </div>
              </div>
            </div>

            {!isFullscreen && (
              <>
                <div className="message-metadata">
                  <h3 className="metadata-title">Message Details</h3>
                  <div className="metadata-item">
                    <span className="metadata-label">Received:</span>
                    <span className="metadata-value">{formatDate(message.createdAt)}</span>
                  </div>
                  {message.metadata && (
                    <>
                      <div className="metadata-item">
                        <span className="metadata-label">Device:</span>
                        <span className="metadata-value">
                          {isPremium ? (
                            message.metadata.device
                          ) : (
                            <span className="locked-info">
                              <Lock size={14} className="locked-icon" /> Hidden
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label">Browser:</span>
                        <span className="metadata-value">
                          {isPremium ? (
                            message.metadata.browser
                          ) : (
                            <span className="locked-info">
                              <Lock size={14} className="locked-icon" /> Hidden
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="metadata-item">
                    <span className="metadata-label">Anonymous Link:</span>
                    <div className="share-link-container">
                      <span className="metadata-value share-link-text">{`${window.location.origin}/response/${linkId}`}</span>
                      <button
                        className="copy-link-button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/response/${linkId}`)
                          alert("Link copied to clipboard!")
                        }}
                        title="Copy link"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="whatsapp-share-button"
                        onClick={() => {
                          const linkUrl = `${window.location.origin}/response/${linkId}`
                          const text = encodeURIComponent(
                            `Hey guys, I just made anonymous link. Oya make we start ${linkUrl}`,
                          )
                          window.open(`https://wa.me/?text=${text}`, "_blank")
                        }}
                        title="Share on WhatsApp"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {!isPremium && (
                  <div className="premium-upgrade-block">
                    <div className="premium-upgrade-content">
                      <div className="premium-icon-container">
                        <Crown size={32} className="premium-icon" />
                      </div>
                      <div className="premium-text">
                        <h3 className="premium-title">Upgrade to Premium</h3>
                        <p className="premium-description">
                          Get insights about your anonymous senders including their device and browser information.
                        </p>
                      </div>
                    </div>
                    <AnimatedButton onClick={handleUpgradeClick} variant="secondary" fullWidth>
                      Upgrade Now
                    </AnimatedButton>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {!isFullscreen && <Footer />}
      </div>
    </>
  )
}
