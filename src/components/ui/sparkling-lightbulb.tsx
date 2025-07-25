
"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export const SparklingLightbulb = () => {
    const sparkVariants = {
      rest: { scale: 0, opacity: 0, y: 0 },
      hover: (i: number) => ({
        scale: [0, 1.2, 0],
        opacity: [0, 1, 0],
        y: [0, -10 - (i % 2) * 5],
        transition: {
          duration: 0.8,
          delay: i * 0.1,
          ease: "circOut",
        },
      }),
    };

    const lightbulbVariants = {
        rest: { scale: 1, rotate: 0 },
        hover: { 
            scale: 1.1, 
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.4 }
        },
    }
  
    return (
      <motion.div
        className="relative h-12 w-12 mx-auto mb-4"
        initial="rest"
        whileHover="hover"
        whileInView="hover"
        viewport={{ once: true, amount: 0.8 }}
      >
        <motion.div variants={lightbulbVariants}>
            <Lightbulb className="h-full w-full text-primary" />
        </motion.div>
        
        <div className="absolute inset-0">
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i / 5) * 360;
            const x = 20 * Math.cos((angle * Math.PI) / 180);
            const y = 20 * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full"
                style={{
                  originX: `${-x}px`,
                  originY: `${-y}px`,
                }}
                variants={sparkVariants}
                custom={i}
              />
            );
          })}
        </div>
      </motion.div>
    );
};
