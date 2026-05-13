import React from "react";
import { motion } from "framer-motion";
import logoIcon from "../assets/logo only.png";
import "./Loader.css";

const LogoLoader = ({ message = "Synchronizing Data..." }) => {
  return (
    <div className="branded-loader-wrapper">
      {/* Background Atmosphere */}
      <div className="loader-atmosphere">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="atmosphere-core-glow"
        />
      </div>

      <div className="loader-main-content">
        {/* Compact Rotating Core */}
        <div className="compact-rotating-core">
          {/* Ring 1: Outer Dashed */}
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
            className="ring-inner-glow"
          />

          {/* 3D Rotating Logo */}
          <div className="logo-3d-perspective">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="logo-3d-inner"
            >
              <img
                src={logoIcon}
                alt="Nexus"
                className="loader-logo-img"
              />
            </motion.div>
          </div>
        </div>

        {/* Branding & Status */}
        <div className="loader-typography">
          <h3 className="brand-text-sharp">
            EvalAI <span>Nexus</span>
          </h3>

          <div className="status-module">
            <span className="micro-status-text">
              {message}
            </span>

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

export default LogoLoader;
