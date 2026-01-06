"use client";

import { motion } from "framer-motion";

const useCases = [
  {
    title: "Dollar Cost Average",
    description: "Automate recurring token purchases at set intervals to reduce volatility impact.",
  },
  {
    title: "Whale Wallet Tracker",
    description:
      "Get instant alerts when whale wallets make moves. Stay ahead of market movements.",
  },
  {
    title: "Auto Funds Distribution",
    description: "Automatically distribute tokens to multiple wallets based on predefined rules.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function UseCases() {
  return (
    <motion.div
      className="w-full text-center border-b border-black grid md:grid-cols-3 grid-cols-1"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {useCases.map((useCase, index) => (
        <motion.div
          key={useCase.title}
          variants={cardVariants}
          className={`flex flex-col gap-y-5 items-center justify-between h-full w-full ${
            index === 1 ? "border-x border-black" : ""
          }`}
        >
          <div className="flex h-full w-full items-center justify-center border-b border-black">
            <div className="h-[400px] w-full bg-neutral-100 flex items-center justify-center">
              <UseCaseIcon type={index} />
            </div>
          </div>
          <div className="flex flex-col gap-y-1 px-5 pb-4 items-center w-full text-center">
            <div className="font-semibold tracking-tight text-lg">{useCase.title}</div>
            <div className="text-sm text-neutral-500">{useCase.description}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function UseCaseIcon({ type }: { type: number }) {
  const icons = [
    // DCA - recurring arrows
    <svg key="dca" viewBox="0 0 100 100" fill="none" className="w-24 h-24 text-neutral-400">
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
      <path
        d="M50 25v50M35 40l15-15 15 15M35 60l15 15 15-15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>,
    // Whale - eye watching
    <svg key="whale" viewBox="0 0 100 100" fill="none" className="w-24 h-24 text-neutral-400">
      <ellipse cx="50" cy="50" rx="35" ry="20" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </svg>,
    // Distribution - branching arrows
    <svg key="dist" viewBox="0 0 100 100" fill="none" className="w-24 h-24 text-neutral-400">
      <circle cx="50" cy="30" r="10" stroke="currentColor" strokeWidth="2" />
      <circle cx="25" cy="70" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="70" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="75" cy="70" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M50 40v10M42 55l-12 10M50 55v7M58 55l12 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>,
  ];

  return icons[type];
}
