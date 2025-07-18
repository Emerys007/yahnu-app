
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
      duration: 2,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 2,
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
            className="absolute -bottom-1/2 -left-1/2 w-[200%] h-[200%]"
            animate={{
              transform: [
                "translateX(0%) translateY(0%) rotate(0deg)",
                "translateX(10%) translateY(-10%) rotate(40deg)",
                "translateX(-10%) translateY(10%) rotate(-40deg)",
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
              background: `radial-gradient(ellipse at center, hsla(${color1}, 0.25) 0%, transparent 60%)`,
            }}
          />
          <motion.div
            className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%]"
            animate={{
              transform: [
                "translateX(0%) translateY(0%) rotate(0deg)",
                "translateX(-15%) translateY(5%) rotate(-50deg)",
                "translateX(5%) translateY(-15%) rotate(50deg)",
                "translateX(0%) translateY(0%) rotate(0deg)",
              ],
            }}
            transition={{
              duration: 35,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              background: `radial-gradient(ellipse at center, hsla(${color2}, 0.25) 0%, transparent 65%)`,
            }}
          />
           <motion.div
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
            animate={{
              transform: [
                "translateX(0%) translateY(0%) rotate(0deg)",
                "translateX(10%) translateY(10%) rotate(60deg)",
                "translateX(-5%) translateY(-5%) rotate(-60deg)",
                "translateX(0%) translateY(0%) rotate(0deg)",
              ],
            }}
            transition={{
              duration: 40,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
            style={{
              background: `radial-gradient(ellipse at center, hsla(${color3}, 0.25) 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 backdrop-blur-3xl"></div>
    </div>
  );
};
