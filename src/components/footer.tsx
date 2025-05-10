"use client"

import { useBatteryStatus, useDeviceOS } from "react-haiku"
import { Battery, Cpu } from "lucide-react"
import "./footer.css"

const Footer = () => {
  const { level, isCharging } = useBatteryStatus()
  const deviceOS = useDeviceOS()


  const formatBatteryLevel = (level: number | null) => {
    if (level === null) return "N/A"

    return Math.round(level * 1).toString()
  }

  const getBatteryIcon = () => {
    if (level === null) return null

    const batteryLevel = formatBatteryLevel(level)
    return (
      <div className="battery-indicator">
        <Battery className={`battery-icon ${isCharging ? "charging" : ""}`} />
        <span>{batteryLevel}%</span>
        {isCharging && <span className="charging-indicator">⚡</span>}
      </div>
    )
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section device-info">
          <div className="battery-status">
            {getBatteryIcon()}
            <span className="battery-text">
              {level !== null ? `Battery: ${formatBatteryLevel(level)}%` : "Battery info unavailable"}
              {isCharging && " (Charging)"}
            </span>
          </div>
        </div>

        <div className="footer-section os-info">
          <div className="os-status">
            <Cpu className="os-icon" />
            <span className="os-text">OS: {deviceOS || "Unknown"}</span>
          </div>
        </div>
        
        <div className="footer-section copyright">
          <p>© {new Date().getFullYear()} Spotix Anonymous. A product of Spotix PLC.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
