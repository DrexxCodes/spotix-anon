"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db, getLinkDocRef, getLinkMessagesCollection } from "../lib/firebase"
import { AnimatedButton } from "../components/animated-button"
import DecryptText from "../components/decrypt-text"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { Send, PauseCircle } from "lucide-react"
import "./response.css"

// Function to get browser and device information
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent

  // Browser detection
  let browser = "Unknown"
  if (userAgent.indexOf("Firefox") > -1) {
    browser = "Firefox"
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    browser = "Samsung Browser"
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    browser = "Opera"
  } else if (userAgent.indexOf("Trident") > -1) {
    browser = "Internet Explorer"
  } else if (userAgent.indexOf("Edge") > -1) {
    browser = "Edge"
  } else if (userAgent.indexOf("Chrome") > -1) {
    browser = "Chrome"
  } else if (userAgent.indexOf("Safari") > -1) {
    browser = "Safari"
  }

  // Device detection
  let device = "Unknown"
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    device = "iOS"
  } else if (userAgent.indexOf("Android") > -1) {
    device = "Android"
  } else if (userAgent.indexOf("Win") > -1) {
    device = "Windows"
  } else if (userAgent.indexOf("Mac") > -1) {
    device = "Mac"
  } else if (userAgent.indexOf("Linux") > -1) {
    device = "Linux"
  }

  return { browser, device, userAgent }
}

export default function Response() {
  const { linkId } = useParams<{ linkId: string }>()
  const [loading, setLoading] = useState(true)
  const [linkData, setLinkData] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [ipAddress, setIpAddress] = useState<string>("Unknown")
  const navigate = useNavigate()

  // Get IP address
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json")
        const data = await response.json()
        setIpAddress(data.ip)
      } catch (error) {
        console.error("Error fetching IP address:", error)
      }
    }

    fetchIpAddress()
  }, [])

  useEffect(() => {
    const fetchLinkData = async () => {
      if (!linkId) {
        setError("Invalid link")
        setLoading(false)
        return
      }

      try {
        // First, get the user ID from the public links collection
        const publicLinkRef = doc(db, "publicLinks", linkId)
        const publicLinkDoc = await getDoc(publicLinkRef)

        if (!publicLinkDoc.exists()) {
          setError("This anonymous message link is either deleted or is incorrect.")
          setLoading(false)
          return
        }

        const publicLinkData = publicLinkDoc.data()
        const ownerId = publicLinkData.userId
        setUserId(ownerId)

        // Now get the actual link data from the user's collection
        const linkDocRef = getLinkDocRef(ownerId, linkId)
        const linkDoc = await getDoc(linkDocRef)

        if (linkDoc.exists()) {
          const data = linkDoc.data()
          setLinkData(data)

          // Check if link is paused
          if (data.isPaused) {
            setError(`${data.creatorUsername} has paused responses, try again later.`)
          }
        } else {
          setError("This anonymous message link is either deleted or is incorrect.")
        }
      } catch (error) {
        console.error("Error fetching link data:", error)
        setError("An error occurred while loading this page")
      } finally {
        setLoading(false)
      }
    }

    fetchLinkData()
  }, [linkId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!message.trim()) {
      setError("Please enter a message")
      return
    }

    if (!linkId || !linkData || !userId) {
      setError("Invalid link")
      return
    }

    // Check if link is paused
    if (linkData.isPaused) {
      setError(`${linkData.creatorUsername} has paused responses, try again later.`)
      return
    }

    setIsSubmitting(true)

    try {
      // Get device information
      const deviceInfo = getDeviceInfo()

      // Add message to Firestore in the user's collection
      const messagesCollection = getLinkMessagesCollection(userId, linkId)
      await addDoc(messagesCollection, {
        message,
        createdAt: serverTimestamp(),
        isRead: false,
        metadata: {
          ipAddress,
          browser: deviceInfo.browser,
          device: deviceInfo.device,
          userAgent: deviceInfo.userAgent,
        },
      })

      setSuccess("Your anonymous message has been sent!")
      setMessage("")
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError(error.message || "An error occurred while sending your message")
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

  // Show error page if link doesn't exist or is paused
  if (error && (!linkData || linkData.isPaused)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="error-container">
          {linkData?.isPaused && <PauseCircle size={48} className="pause-icon" />}
          <h2 className="error-title">Anonymous Unavailable</h2>
          <p className="error-message">{error}</p>
          <AnimatedButton onClick={() => navigate("/home")} variant="primary">
            Go Home
          </AnimatedButton>
        </div>
      </div>
    )
  }

  return (
    <>
      <Preloader imagePath="/Ghost.gif" />

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="container p-8 flex-1">
          <div className="response-container">
            <div className="response-header">
              <h1 className="response-title">
                <DecryptText
                  originalText={`Send ${linkData?.creatorUsername} a message`}
                  finalText={`Welcome to ${linkData?.creatorUsername}'s space`}
                  interval={4000}
                />
              </h1>
            </div>

            <div className="response-content">
              {linkData?.imageUrl && (
                <div className="response-image-container">
                  <img
                    src={linkData.imageUrl || "/placeholder.svg"}
                    alt="Message"
                    className="response-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.onerror = null
                      target.src =
                        "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189b3ff4ccc%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189b3ff4ccc%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22157.1%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                    }}
                  />
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleSubmit} className="response-form">
                <div className="message-input-container">
                  <textarea
                    className="message-input"
                    placeholder="Type your anonymous message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting || linkData?.isPaused}
                    required
                  ></textarea>
                  <div className="gradient-border"></div>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !message.trim() || linkData?.isPaused}
                  fullWidth
                >
                  <Send className="send-icon" size={18} />
                  Send Anonymous Message
                </AnimatedButton>
              </form>
            </div>

            <div className="cta-container">
              <div className="cta-block">
                <div className="cta-content">
                  <h3 className="cta-title">Like this?</h3>
                  <p className="cta-text">You can create yours easily just like {linkData?.creatorUsername}</p>
                </div>
                <AnimatedButton onClick={() => navigate("/signup")} variant="secondary">
                  Create Your Own
                </AnimatedButton>
              </div>

              <div className="cta-block">
                <div className="cta-content">
                  <h3 className="cta-title">Are you a party-goer or party-planner?</h3>
                  <p className="cta-text">Check out Spotix Event Platform</p>
                </div>
                <AnimatedButton onClick={() => window.open("https://spotix.com.ng", "_blank")} variant="outline">
                  Visit Spotix
                </AnimatedButton>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
