"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import Preloader from "../components/preloader"
import Header from "../components/header"
import Footer from "../components/footer"
import { AnimatedButton } from "../components/animated-button"
import { LogOut, Crown, Plus, Ticket, ArrowRight } from "lucide-react"
import "./home.css"

// Welcome translations
const welcomeTranslations = [
  { language: "English", text: "Welcome" },
  { language: "Igbo", text: "Nnọọ" },
  { language: "Yoruba", text: "Káàbọ̀" },
  { language: "Hausa", text: "Barka da zuwa" },
  { language: "Pidgin", text: "You don land" },
  { language: "French", text: "Bienvenue" },
  { language: "Spanish", text: "Bienvenido" },
  { language: "German", text: "Willkommen" },
  { language: "Chinese", text: "欢迎" },
  { language: "Arabic", text: "مرحبا" },
]

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentWelcomeIndex, setCurrentWelcomeIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser)

        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data())
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

  // Rotate welcome messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWelcomeIndex((prevIndex) => (prevIndex + 1) % welcomeTranslations.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
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
          <div className="home-container">
            <div className="greeting-section">
              <h2 className="greeting-title">
                {getGreeting()}, {userData?.username || user?.displayName || "User"}!
              </h2>

              <div className="welcome-translations">
                {welcomeTranslations.map((translation, index) => (
                  <div
                    key={translation.language}
                    className={`welcome-item ${index === currentWelcomeIndex ? "active" : ""}`}
                  >
                    <span className="welcome-text">{translation.text}</span>
                    <span className="welcome-language">({translation.language})</span>
                  </div>
                ))}
              </div>
            </div>

            {!isPremium && (
              <div className="premium-promo">
                <div className="premium-promo-content">
                  <div className="premium-icon-wrapper">
                    <Crown className="premium-icon" />
                  </div>
                  <div className="premium-text-content">
                    <h3 className="premium-promo-title">Upgrade to Premium</h3>
                    <p className="premium-promo-description">
                      You no go like see small hint of people wey dey send anonymous, get access to early features and
                      remove all limits?
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  onClick={() => window.open("https://spotix.site/pricing", "_blank")}
                  variant="secondary"
                >
                  Upgrade Now
                </AnimatedButton>
              </div>
            )}

            <div className="action-cards">
              <div className="action-card create-anonymous">
                <div className="action-card-content">
                  <div className="action-icon-wrapper">
                    <Plus className="action-icon" />
                  </div>
                  <div className="action-text">
                    <h3 className="action-title">Create Anonymous Link</h3>
                    <p className="action-description">
                      Create a new anonymous message link to share with friends and receive anonymous messages.
                    </p>
                  </div>
                </div>
                <AnimatedButton onClick={() => navigate("/create-link")} variant="primary">
                  Create Now
                </AnimatedButton>
              </div>

              <div className="action-card spotix-advert">
                <div className="action-card-content">
                  <div className="action-icon-wrapper">
                    <Ticket className="action-icon" />
                  </div>
                  <div className="action-text">
                    <h3 className="action-title">Spotix Ticket Platform</h3>
                    <p className="action-description">
                      Need a centralized platform to host events and arrange tickets orderly? Look no further!
                    </p>
                  </div>
                </div>
                <AnimatedButton onClick={() => window.open("https://spotix.com.ng", "_blank")} variant="outline">
                  Visit Spotix <ArrowRight size={16} className="ml-2" />
                </AnimatedButton>
              </div>
            </div>

            <div className="home-footer">
              <button onClick={handleSignOut} className="sign-out-btn">
                <LogOut className="sign-out-icon" size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
