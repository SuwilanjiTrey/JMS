// app/not-found.tsx
"use client";

import { motion } from "framer-motion";
import { Wrench, Construction } from "lucide-react"; // or any icons you like

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-6">
      {/* Animated Icon */}
      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 10 }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 1,
          ease: "easeInOut",
        }}
        className="mb-6"
      >
        <Construction className="h-20 w-20 text-orange-500" />
      </motion.div>

      {/* Text */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        Features for prototype are currently being worked on
      </h1>
      <p className="mt-4 text-gray-600">
        🚧 This section is under construction. Check back soon!
      </p>

      {/* Button to go Home */}
      <a
        href="/"
        className="mt-6 px-5 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition"
      >
        Back to Home
      </a>
    </div>
  );
}
