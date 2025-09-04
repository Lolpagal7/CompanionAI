import React, { useEffect, useState } from "react";
import "./Cursor.css";
import { motion } from "framer-motion";

const Cursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const springConfig = { stiffness: 300, damping: 15 };
  const radius = 100;

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      if (isPressed) {
        const dx = e.clientX - origin.x;
        const dy = e.clientY - origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let newMousePosition = { x: e.clientX, y: e.clientY };
        if (distance > radius) {
          const angle = Math.atan2(dy, dx);
          newMousePosition.x = origin.x + Math.cos(angle) * radius;
          newMousePosition.y = origin.y + Math.sin(angle) * radius;
        }
        setMousePosition(newMousePosition);
      } else {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };
    const mouseDown = (e: MouseEvent) => {
      setIsPressed(true);
      setOrigin({ x: e.clientX, y: e.clientY });
    };
    const mouseUp = () => setIsPressed(false);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mouseup", mouseUp);
    };
  }, [isPressed, origin]);

  const variants = {
    default: {
      x: mousePosition.x - 15,
      y: mousePosition.y - 15,
      scale: isPressed ? 0.6 : 1,
      transition: {
        x: { type: "tween", duration: 0.000001 },
        y: { type: "tween", duration: 0.000001 },
        scale: { type: "spring", ...springConfig },
      },
    },
  };
  const backgroundVariants = {
    default: {
      x: origin.x - radius,
      y: origin.y - radius,
      opacity: isPressed ? 0.05 : 0,
      scale: isPressed ? 1 : 0,
      transition: {
        x: { type: "tween", duration: 0.05 },
        y: { type: "tween", duration: 0.05 },
        scale: { type: "spring", ...springConfig },
      },
    },
  };
  return (
    <>
      <motion.div
        className="cursor-background"
        variants={backgroundVariants}
        animate="default"
      />
      <motion.div
        className="cursor"
        variants={variants}
        animate="default"
        style={{
          backgroundColor: isPressed ? "white" : "transparent",
          border: isPressed ? "none" : "2px solid white",
        }}
      />
    </>
  );
};
export default Cursor;
