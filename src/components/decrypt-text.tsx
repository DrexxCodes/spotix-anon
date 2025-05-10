"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface DecryptTextProps {
  originalText: string
  finalText: string
  interval?: number
  className?: string
}

const DecryptText: React.FC<DecryptTextProps> = ({ originalText, finalText, interval = 10000, className = "" }) => {
  const [currentText, setCurrentText] = useState(originalText)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const charactersRef = useRef<HTMLSpanElement[]>([])
  const cycleCountRef = useRef(0)

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/"

  useEffect(() => {
    const startDecryption = () => {
      setIsDecrypting(true)

      // Get max length of both texts to ensure all characters are animated
      const maxLength = Math.max(originalText.length, finalText.length)

      // Determine which text to show next based on cycle count
      const isEvenCycle = cycleCountRef.current % 2 === 0
      const targetText = isEvenCycle ? finalText : originalText
      const sourceText = isEvenCycle ? originalText : finalText

      // Ensure both texts have the same length by padding with spaces
      const paddedSourceText = sourceText.padEnd(maxLength, " ")
      const paddedTargetText = targetText.padEnd(maxLength, " ")

      // Animate each character with a staggered delay
      for (let i = 0; i < maxLength; i++) {
        const charElement = charactersRef.current[i]
        if (!charElement) continue

        // Determine target character
        const targetChar = paddedTargetText[i]

        // Start with original character or space
        const startChar = paddedSourceText[i]

        // Set initial character
        charElement.textContent = startChar

        // Animate through random characters
        let step = 0
        const totalSteps = 15 // Increased from 10 for more steps
        const stepInterval = 50 // Increased from 30 for slower animation

        const animateChar = () => {
          if (step < totalSteps) {
            // Show random character during animation
            const randomChar = characters[Math.floor(Math.random() * characters.length)]
            charElement.textContent = randomChar
            step++
            setTimeout(animateChar, stepInterval)
          } else {
            // Set final character
            charElement.textContent = targetChar
          }
        }

        // Start animation with staggered delay - slower staggering
        setTimeout(animateChar, i * 80) // Increased from 50 for slower staggering
      }

      // Set the final text after all animations complete - increased delay
      setTimeout(
        () => {
          setCurrentText(targetText)
          setIsDecrypting(false)

          // Increment cycle count
          cycleCountRef.current++

          // Schedule next animation
          timeoutRef.current = setTimeout(startDecryption, interval / 2)
        },
        maxLength * 80 + 800, // Increased delay to match slower animation
      )
    }

    // Start the cycle
    const cycleTimeout = setTimeout(startDecryption, interval / 2)

    return () => {
      clearTimeout(cycleTimeout)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [originalText, finalText, interval])

  // Create refs for each character span
  const setCharRef = (el: HTMLSpanElement | null, index: number) => {
    if (el) {
      charactersRef.current[index] = el
    }
  }

  // Ensure we're displaying the text with proper spacing
  const displayText = currentText.padEnd(Math.max(originalText.length, finalText.length), " ")

  return (
    <span
      className={`decrypt-text ${className} ${isDecrypting ? "decrypting" : ""}`}
      style={{ display: "inline-block", whiteSpace: "normal" }}
    >
      {Array.from(displayText).map((char, index) => (
        <span
          key={index}
          ref={(el) => setCharRef(el, index)}
          className={`decrypt-char ${char === " " ? "decrypt-space" : ""}`}
          style={{
            display: "inline-block",
            marginRight: "0.1em",
            width: char === " " ? "0.5em" : "auto",
          }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

export default DecryptText
