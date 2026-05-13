import React from "react";
import { motion } from "framer-motion";
import logoIcon from "../assets/logo only.png";
import "./Loader.css";

const Loader = ({ message = "Loading...", className = "" }) => {
  return (
    <div className={`branded-loader-wrapper ${className}`}>
      {/* 1. Background Atmosphere (Tiny & Subtle) */}
      <div className="loader-atmosphere">
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="atmosphere-core-glow"
        />
      </div>

      {/* Main Content Wrapper - Very Tight Spacing */}
      <div className="loader-main-content">
        {/* === The Ultra-Compact Rotating Core === */}
        <div className="compact-rotating-core">
          {/* Ring 1: Outer Dashed (Very Thin) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="ring-outer-dashed"
          />

          {/* Ring 2: The Tracker Arc */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="ring-tracker-arc"
          />

          {/* Ring 3: Inner Glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="ring-inner-glow"
          />

          {/* The 3D Rotating Logo (Tiny) */}
          <div className="logo-3d-perspective">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="logo-3d-inner"
            >
              <img
                src={logoIcon}
                alt="EvalAI Nexus"
                className="loader-logo-img"
              />
            </motion.div>
          </div>
        </div>

        {/* === Typography & Status === */}
        <div className="loader-typography">
          <motion.h3
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="brand-text-sharp"
          >
            EvalAI <span>Nexus</span>
          </motion.h3>

          <div className="status-module">
            {/* Loading Message - Micro Text */}
            <span className="micro-status-text">
              {message}
            </span>

            {/* Micro Progress Bar */}
            <div className="micro-progress-track">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="micro-progress-pill"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loader;
