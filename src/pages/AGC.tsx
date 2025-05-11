// I can't think 🤣"use client"

import { useEffect, useRef } from "react"
import { Users, Lock, Globe } from "lucide-react"
import Header from "../components/header"
import Footer from "../components/footer"
import "./agc.css"

const AGC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const publicBlockRef = useRef<HTMLDivElement>(null)
  const privateBlockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add animation classes after component mounts
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.classList.add("animate-in")
      }
      if (descriptionRef.current) {
        descriptionRef.current.classList.add("animate-in")
      }
    }, 300)

    setTimeout(() => {
      if (publicBlockRef.current) {
        publicBlockRef.current.classList.add("animate-in")
      }
    }, 600)

    setTimeout(() => {
      if (privateBlockRef.current) {
        privateBlockRef.current.classList.add("animate-in")
      }
    }, 900)
  }, [])

  return (
      <div className="agc-container">
        <Header />
      <div className="agc-header">
        <h1 ref={titleRef} className="agc-title">
          Anonymous Group Chat
        </h1>
        <p ref={descriptionRef} className="agc-description">
          A feature that allows you to anonymously chat with people you may or may not know.
        </p>
      </div>

      <div className="agc-blocks">
        <div ref={publicBlockRef} className="agc-block public-block">
          <div className="block-icon">
            <Globe size={40} />
          </div>
          <h2 className="block-title">Public Chat Server</h2>
          <p className="block-description">
            Everyone on the Spotix Anonymous can see and enter your chat space. Create open discussions and meet new
            people in a completely anonymous environment.
          </p>
          <button className="block-button public-button">
            Create Public Server
            <span className="coming-soon-label">Coming Soon</span>
          </button>
        </div>

        <div ref={privateBlockRef} className="agc-block private-block">
          <div className="block-icon">
            <Lock size={40} />
          </div>
          <h2 className="block-title">Private Server</h2>
          <p className="block-description">
            Only users with your server ID can see and enter your chat space. Perfect for private conversations with
            friends or specific groups.
          </p>
          <button className="block-button private-button">
            Create Private Server
            <span className="coming-soon-label">Coming Soon</span>
          </button>
        </div>
      </div>

      <div className="agc-features">
        <h2 className="features-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <Users size={24} />
            </div>
            <h3 className="feature-title">Complete Anonymity</h3>
            <p className="feature-description">Chat without revealing your identity. Your privacy is our priority.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <Lock size={24} />
            </div>
            <h3 className="feature-title">End-to-End Encryption</h3>
            <p className="feature-description">All messages are encrypted to ensure maximum security.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <Globe size={24} />
            </div>
            <h3 className="feature-title">Global Reach</h3>
            <p className="feature-description">Connect with people from all around the world anonymously.</p>
          </div>
        </div>
      </div>

      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
<Footer />
    </div>
  )
}

export default AGC
