
"use client";

import { motion } from "framer-motion";
import { Target, MoveRight } from "lucide-react";

export const BullseyeAnimation = () => {
  const arrowVariants = {
    rest: { x: -40, opacity: 0, scale: 0.8, rotate: -10 },
    hover: {
      x: -1,
      opacity: [0, 1, 1, 0],
      scale: 0.5,
      rotate: 0,
      transition: { duration: 1.2, ease: "easeInOut", times: [0, 0.4, 0.8, 1] },
    },
  };

  const bullseyeVariants = {
    rest: { scale: 1 },
    hover: {
      scale: [1, 1.3, 1],
      transition: { delay: 0.4, duration: 0.3, ease: "circOut" },
    },
  };

  return (
    <motion.div
      className="relative h-12 w-12 mx-auto mb-4"
      initial="rest"
      whileHover="hover"
      whileInView="hover"
      viewport={{ once: true, amount: 0.8 }}
    >
      <motion.div variants={bullseyeVariants}>
        <Target className="h-full w-full text-primary" />
      </motion.div>
      <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
        <motion.div variants={arrowVariants}>
          <MoveRight className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
};
