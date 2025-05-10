"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface PreloaderProps {
  imagePath: string
}

const Preloader: React.FC<PreloaderProps> = ({ imagePath }) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`preloader ${isLoading ? "" : "hidden"}`}>
      <img src={imagePath || "/Ghost.gif"} alt="Loading..." />
    </div>
  )
}

export default Preloader
