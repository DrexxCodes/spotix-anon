"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"

interface AnimatedInputProps {
  id: string
  label: string
  type: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  autoComplete?: string
}

export function AnimatedInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  autoComplete,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isEncoding, setIsEncoding] = useState(false)

  const togglePasswordVisibility = () => {
    setIsEncoding(true)
    setTimeout(() => {
      setShowPassword(!showPassword)
      setIsEncoding(false)
    }, 300)
  }

  const inputType = type === "password" && showPassword ? "text" : type

  return (
    <div className="mb-4">
      <motion.label
        initial={{ y: 0 }}
        animate={{ y: isFocused || value ? -25 : 0 }}
        className="block text-sm font-medium text-foreground absolute ml-3 transition-all duration-200"
        htmlFor={id}
      >
        {label}
        {required && <span className="text-anonymous-accent ml-1">*</span>}
      </motion.label>
      <div className="relative">
        <motion.input
          whileFocus={{ scale: 1.01 }}
          id={id}
          type={inputType}
          className={`w-full px-4 py-3 rounded-md border ${
            error ? "border-anonymous-accent" : "border-border focus:border-primary-600"
          } bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${
            isFocused || value ? "pt-6 pb-2" : "py-4"
          }`}
          placeholder={isFocused ? placeholder : ""}
          value={isEncoding ? "••••••••" : value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
        />
        {type === "password" && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-anonymous-muted hover:text-primary-600 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </motion.button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-anonymous-accent"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
