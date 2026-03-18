import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  isSpeaking?: boolean;
  className?: string;
}

export function AIAvatar({ isSpeaking, className }: AvatarProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Speaking Animation Rings */}
      {isSpeaking && (
        <>
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-indigo-500/20"
          />
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full bg-indigo-500/10"
          />
        </>
      )}
      
      <div className="relative z-10 p-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/20">
        <Bot className={cn("w-12 h-12 text-white", isSpeaking && "animate-pulse")} />
      </div>
    </div>
  );
}
