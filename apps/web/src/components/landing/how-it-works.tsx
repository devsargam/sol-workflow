"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create Trigger",
    description:
      "Choose what event starts your workflow - wallet activity, cron schedule, or program logs.",
  },
  {
    number: "02",
    title: "Set Conditions",
    description:
      "Add filters to control when your workflow runs. Set thresholds, amounts, or specific addresses.",
  },
  {
    number: "03",
    title: "Get Notified",
    description:
      "Receive instant alerts via Discord, Telegram, or webhook when conditions are met.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function HowItWorks() {
  return (
    <motion.div
      className="w-full border-b border-black grid md:grid-cols-3 grid-cols-1"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {steps.map((step, index) => (
        <motion.div
          key={step.number}
          variants={itemVariants}
          className={`flex flex-col p-8 ${index !== 2 ? "md:border-r border-b md:border-b-0 border-black" : ""}`}
        >
          <motion.span
            className="text-4xl font-dynapuff font-bold text-neutral-300 mb-4"
            whileHover={{ scale: 1.1, color: "#171717" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {step.number}
          </motion.span>
          <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
          <p className="text-sm text-neutral-600">{step.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
