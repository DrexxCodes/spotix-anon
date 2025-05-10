"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { AnimatedButton } from "../components/animated-button"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { MoreVertical, ArrowLeft, CheckCircle, XCircle, Settings, Copy, Share2 } from "lucide-react"
import "./inbox.css"

export default function Inbox() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState<any[]>([])
  const [selectedLink, setSelectedLink] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null)
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

  // Fetch user's links
  useEffect(() => {
    const fetchLinks = async () => {
      if (!user) return

      try {
        const q = query(collection(db, "anonymousLinks"), where("creatorId", "==", user.uid))
        const querySnapshot = await getDocs(q)

        const linksData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const linkData = docSnapshot.data()

            // Get message count for each link
            const messagesQuery = collection(db, "anonymousLinks", docSnapshot.id, "messages")
            const messagesSnapshot = await getDocs(messagesQuery)

            return {
              id: docSnapshot.id,
              ...linkData,
              messageCount: messagesSnapshot.size,
              unreadCount: messagesSnapshot.docs.filter((doc) => !doc.data().isRead).length,
            }
          }),
        )

        setLinks(linksData)

        // If linkId is provided in URL, select that link
        if (linkId) {
          const selectedLinkData = linksData.find((link) => link.id === linkId)
          if (selectedLinkData) {
            setSelectedLink(selectedLinkData)
            fetchMessages(linkId)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching links:", error)
        setLoading(false)
      }
    }

    if (user) {
      fetchLinks()
    }
  }, [user, linkId])

  // Fetch messages for a selected link
  const fetchMessages = async (linkId: string) => {
    try {
      const q = query(collection(db, "anonymousLinks", linkId, "messages"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const messagesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }))

      setMessages(messagesData)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleLinkClick = (link: any) => {
    setSelectedLink(link)
    fetchMessages(link.id)
    navigate(`/inbox/${link.id}`)
  }

  const handleBackClick = () => {
    setSelectedLink(null)
    setMessages([])
    navigate("/inbox")
  }

  const toggleMenu = (linkId: string) => {
    if (menuOpen === linkId) {
      setMenuOpen(null)
    } else {
      setMenuOpen(linkId)
    }
  }

  const handleSettingsClick = (linkId: string) => {
    navigate(`/settings/${linkId}`)
  }

  const handleMessageClick = (messageId: string) => {
    if (!selectedLink) return
    navigate(`/message/${selectedLink.id}/${messageId}`)
  }

  const markMessageAsRead = async (messageId: string, isRead: boolean) => {
    if (!selectedLink) return

    try {
      const messageRef = doc(db, "anonymousLinks", selectedLink.id, "messages", messageId)
      await updateDoc(messageRef, {
        isRead: !isRead,
      })

      // Update local state
      setMessages(messages.map((message) => (message.id === messageId ? { ...message, isRead: !isRead } : message)))

      // Update unread count in links
      setLinks(
        links.map((link) =>
          link.id === selectedLink.id
            ? {
                ...link,
                unreadCount: isRead ? link.unreadCount + 1 : link.unreadCount - 1,
              }
            : link,
        ),
      )

      // Update selected link
      if (selectedLink) {
        setSelectedLink({
          ...selectedLink,
          unreadCount: isRead ? selectedLink.unreadCount + 1 : selectedLink.unreadCount - 1,
        })
      }
    } catch (error) {
      console.error("Error updating message:", error)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return days[date.getDay()]
    }

    // Otherwise show date
    return date.toLocaleDateString()
  }

  const handleCopyLink = (linkId: string) => {
    const linkUrl = `${window.location.origin}/response/${linkId}`
    navigator.clipboard.writeText(linkUrl)
    setCurrentLinkId(linkId)
    setShowShareDialog(true)
    setMenuOpen(null)
  }

  const handleWhatsAppShare = () => {
    if (!currentLinkId) return

    const linkUrl = `${window.location.origin}/response/${currentLinkId}`
    const text = encodeURIComponent(`Hey guys, I just made anonymous link. Oya make we start ${linkUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
    setShowShareDialog(false)
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
          <div className="inbox-container">
            {!selectedLink ? (
              // Links view
              <>
                <div className="inbox-header">
                  <h1 className="inbox-title">Your Anonymous Links</h1>
                  <p className="inbox-subtitle">Manage your anonymous message links</p>
                </div>

                {links.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't created any anonymous message links yet.</p>
                    <AnimatedButton onClick={() => navigate("/create-link")} variant="primary">
                      Create Your First Link
                    </AnimatedButton>
                  </div>
                ) : (
                  <div className="links-list">
                    {links.map((link) => (
                      <div key={link.id} className="link-block">
                        <div className="link-content" onClick={() => handleLinkClick(link)}>
                          <div className="link-image-container">
                            <img
                              src={link.imageUrl || "/placeholder.svg"}
                              alt={link.name}
                              className="link-image"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.onerror = null
                                target.src =
                                  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189b3ff4ccc%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189b3ff4ccc%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22157.1%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                              }}
                            />
                            {link.unreadCount > 0 && <span className="unread-badge">{link.unreadCount}</span>}
                          </div>
                          <div className="link-details">
                            <h3 className="link-name">{link.name}</h3>
                            <p className="link-message-count">
                              {link.messageCount} {link.messageCount === 1 ? "response" : "responses"}
                            </p>
                            {link.isPaused && <span className="paused-badge">Paused</span>}
                          </div>
                        </div>
                        <div className="link-actions">
                          <button
                            className="menu-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMenu(link.id)
                            }}
                          >
                            <MoreVertical size={20} />
                          </button>
                          {menuOpen === link.id && (
                            <div className="menu-dropdown">
                              <button
                                className="menu-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSettingsClick(link.id)
                                }}
                              >
                                <Settings size={16} />
                                Settings
                              </button>
                              <button
                                className="menu-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyLink(link.id)
                                }}
                              >
                                <Copy size={16} />
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Messages view for selected link
              <>
                <div className="inbox-header with-back">
                  <button className="back-button" onClick={handleBackClick}>
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="inbox-title">{selectedLink.name}</h1>
                    <p className="inbox-subtitle">
                      {messages.length} {messages.length === 1 ? "response" : "responses"}
                    </p>
                  </div>
                  <button className="settings-button" onClick={() => handleSettingsClick(selectedLink.id)}>
                    <Settings size={20} />
                  </button>
                </div>

                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet. Share your link to get responses!</p>
                    <div className="share-link">
                      <p className="share-link-text">
                        {window.location.origin}/response/{selectedLink.id}
                      </p>
                      <AnimatedButton
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/response/${selectedLink.id}`)
                          alert("Link copied to clipboard!")
                        }}
                        variant="primary"
                      >
                        Copy Link
                      </AnimatedButton>
                    </div>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((message) => (
                      <div key={message.id} className="message-block" onClick={() => handleMessageClick(message.id)}>
                        <div className="message-content">
                          <h3 className="message-sender">Anonymous</h3>
                          <p className="message-preview">
                            {message.message.length > 100 ? `${message.message.substring(0, 100)}...` : message.message}
                          </p>
                          <span className="message-time">{formatDate(message.createdAt)}</span>
                        </div>
                        <button
                          className={`read-status ${message.isRead ? "read" : "unread"}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            markMessageAsRead(message.id, message.isRead)
                          }}
                        >
                          {message.isRead ? <CheckCircle size={24} /> : <XCircle size={24} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
      {showShareDialog && (
        <div className="share-dialog-overlay" onClick={() => setShowShareDialog(false)}>
          <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="share-dialog-content">
              <CheckCircle size={40} className="success-icon" />
              <h3 className="share-dialog-title">Link copied successfully!</h3>
              <p className="share-dialog-message">Want to share it on WhatsApp?</p>
            </div>
            <div className="share-dialog-actions">
              <button className="cancel-button" onClick={() => setShowShareDialog(false)}>
                Close
              </button>
              <button className="whatsapp-button" onClick={handleWhatsAppShare}>
                <Share2 size={16} className="mr-2" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
