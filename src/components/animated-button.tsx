"use client"

import type React from "react"

import { motion } from "framer-motion"

interface AnimatedButtonProps {
  children: React.ReactNode
  type?: "button" | "submit" | "reset"
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline"
  isLoading?: boolean
  fullWidth?: boolean
  disabled?: boolean
}

export function AnimatedButton({
  children,
  type = "button",
  onClick,
  variant = "primary",
  isLoading = false,
  fullWidth = false,
  disabled = false,
}: AnimatedButtonProps) {
  const variants = {
    primary: "bg-primary-700 hover:bg-primary-800 text-white shadow-lg shadow-primary-700/30",
    secondary: "bg-anonymous-accent hover:bg-anonymous-accent/90 text-white shadow-lg shadow-anonymous-accent/30",
    outline: "bg-transparent border border-primary-700 text-primary-700 hover:bg-primary-700/10",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${variants[variant]} px-6 py-3 rounded-md font-medium transition-all duration-200 ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} flex items-center justify-center`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </div>
      ) : (
        children
      )}
    </motion.button>
  )
}
