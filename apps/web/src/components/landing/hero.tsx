"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <div className="w-full text-center border-b border-black py-16 overflow-hidden">
      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm tracking-widest uppercase text-neutral-500 mb-4"
      >
        Solana Automation Platform
      </motion.p>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-5xl md:text-6xl lg:text-7xl font-dynapuff font-bold tracking-tight mb-6"
      >
        Automate your
        <br />
        on-chain workflows
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-lg md:text-xl text-neutral-600 max-w-xl mx-auto mb-10 leading-relaxed"
      >
        Build visual workflows that respond to Solana events, execute actions, and send
        notifications. No code required.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/workflows/builder"
            className="inline-block px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Try Now
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/workflows"
            className="inline-block px-8 py-3 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            View Workflows
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
