
"use client"

import { motion } from "framer-motion";

export const NorthernLightsBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(var(--primary), 0.2) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
          animate={{
            x: ["-25%", "25%", "0%", "-25%"],
            y: ["-25%", "0%", "25%", "-25%"],
            rotate: [0, 90, 0, -90],
          }}
          transition={{
            duration: 40,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
        <motion.div
          className="absolute h-[400px] w-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(var(--accent), 0.2) 0%, transparent 70%)",
            filter: "blur(120px)",
          }}
          animate={{
            x: ["25%", "-25%", "0%", "25%"],
            y: ["25%", "0%", "-25%", "25%"],
            rotate: [0, -90, 0, 90],
          }}
          transition={{
            duration: 50,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      </div>
    </div>
  );
};
