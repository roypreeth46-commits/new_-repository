import React from 'react';
import { motion } from 'framer-motion';

export default function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex justify-end mb-6"
    >
      <div className="max-w-[70%]">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl rounded-tr-xl px-6 py-4 shadow-lg">
          <p className="text-white leading-relaxed">{message}</p>
        </div>
        <p className="text-xs text-gray-400 mt-2 mr-2 text-right">You</p>
      </div>
    </motion.div>
  );
}