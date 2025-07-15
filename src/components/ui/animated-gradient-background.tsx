
"use client"

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/context/country-context";
import { FLAG_COLORS } from "@/lib/flag-colors";

const variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

export const AnimatedGradientBackground = () => {
  const { country } = useCountry();
  const [colors, setColors] = useState(FLAG_COLORS[country.theme]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setColors(FLAG_COLORS[country.theme]);
  }, [country.theme]);

  if (!mounted) {
    return <div className="absolute inset-0 bg-muted/40 z-0"></div>;
  }

  const [color1, color2, color3] = colors;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-muted/40">
      <AnimatePresence>
        <motion.div
          key={country.code}
          className="absolute inset-0"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="absolute inset-[-20%]"
            animate={{
              transform: [
                "translateX(0%) translateY(0%) rotate(0deg)",
                "translateX(10%) translateY(-10%) rotate(45deg)",
                "translateX(-10%) translateY(10%) rotate(-45deg)",
                "translateX(0%) translateY(0%) rotate(0deg)",
              ],
            }}
            transition={{
              duration: 20,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              background: `radial-gradient(circle, hsla(${color1}, 0.2) 0%, transparent 50%)`,
            }}
          />
          <motion.div
            className="absolute inset-[-20%]"
            animate={{
              transform: [
                "translateX(0%) translateY(0%) rotate(0deg)",
                "translateX(-15%) translateY(5%) rotate(-60deg)",
                "translateX(5%) translateY(-15%) rotate(60deg)",
                "translateX(0%) translateY(0%) rotate(0deg)",
              ],
            }}
            transition={{
              duration: 25,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              background: `radial-gradient(circle, hsla(${color2}, 0.2) 0%, transparent 55%)`,
            }}
          />
           <motion.div
            className="absolute inset-[-20%]"
            animate={{
              transform: [
                "translateX(0%) translateY(0%) rotate(0deg)",
                "translateX(10%) translateY(10%) rotate(30deg)",
                "translateX(-5%) translateY(-5%) rotate(-30deg)",
                "translateX(0%) translateY(0%) rotate(0deg)",
              ],
            }}
            transition={{
              duration: 30,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              background: `radial-gradient(circle, hsla(${color3}, 0.2) 0%, transparent 60%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 backdrop-blur-2xl"></div>
    </div>
  );
};
