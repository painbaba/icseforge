"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

/* ─────────────────────────── types ─────────────────────────── */
interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  penText: string;
  icon: string;
  accentFrom: string;
  accentTo: string;
  accentVia?: string;
}

/* ─────────────────────────── data ─────────────────────────── */
const STEPS: OnboardingStep[] = [
  {
    id: 0,
    title: "Welcome to",
    subtitle: "Project Forge",
    description:
      "Your AI-powered companion for crafting stellar ICSE projects & mock papers — all forged from your own notes.",
    penText: "Hello, Scholar!",
    icon: "✦",
    accentFrom: "#6366f1",
    accentTo: "#a78bfa",
    accentVia: "#818cf8",
  },
  {
    id: 1,
    title: "Upload Your",
    subtitle: "Notes & PDFs",
    description:
      "Drop in your handwritten notes, textbook PDFs, or class recordings. Our AI digests it all into structured knowledge.",
    penText: "Upload → Forge",
    icon: "⬆",
    accentFrom: "#06b6d4",
    accentTo: "#22d3ee",
    accentVia: "#67e8f9",
  },
  {
    id: 2,
    title: "AI Forges Your",
    subtitle: "Complete Project",
    description:
      "From diagrams to references — get a polished, original ICSE project with proper formatting, bibliography & diagrams.",
    penText: "AI + You = A+",
    icon: "⚡",
    accentFrom: "#f59e0b",
    accentTo: "#fbbf24",
    accentVia: "#fcd34d",
  },
  {
    id: 3,
    title: "Practice with",
    subtitle: "Mock Papers",
    description:
      "Generate specimen-style mock papers trained on real ICSE board data. Timed practice, instant AI grading.",
    penText: "Ace Your Exams!",
    icon: "📝",
    accentFrom: "#ec4899",
    accentTo: "#f472b6",
    accentVia: "#f9a8d4",
  },
];

/* ─────────── SVG Handwriting Path Generator ─────────── */
function generateHandwritingPath(text: string): string {
  const paths: string[] = [];
  let x = 30;
  const y = 70;
  const charWidth = 38;

  for (let i = 0; i < text.length; i++) {
    const cx = x + i * charWidth;
    const char = text[i];
    if (char === " ") continue;

    // Generate organic-looking strokes per character
    const jitter = () => (Math.random() - 0.5) * 6;
    const strokeVariants = [
      // Vertical stroke
      `M ${cx + jitter()} ${y - 18 + jitter()} Q ${cx + 4 + jitter()} ${y - 5 + jitter()} ${cx + 2 + jitter()} ${y + 14 + jitter()}`,
      // Curve stroke
      `M ${cx - 5 + jitter()} ${y - 10 + jitter()} C ${cx + 8 + jitter()} ${y - 20 + jitter()} ${cx + 15 + jitter()} ${y + 5 + jitter()} ${cx + 3 + jitter()} ${y + 12 + jitter()}`,
      // Arc stroke
      `M ${cx - 2 + jitter()} ${y - 14 + jitter()} Q ${cx + 12 + jitter()} ${y - 18 + jitter()} ${cx + 18 + jitter()} ${y - 8 + jitter()} Q ${cx + 20 + jitter()} ${y + 4 + jitter()} ${cx + 6 + jitter()} ${y + 12 + jitter()}`,
    ];
    paths.push(strokeVariants[i % 3]);
  }
  return paths.join(" ");
}

/* ─────────── Floating Particle ─────────── */
function Particle({ delay, size, color }: { delay: number; size: number; color: string }) {
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
      }}
      animate={{
        y: [0, -30, 10, -20, 0],
        x: [0, 15, -10, 20, 0],
        opacity: [0, 0.8, 0.4, 0.9, 0],
        scale: [0.5, 1.2, 0.8, 1, 0.5],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─────────── Ink Splatter Effect ─────────── */
function InkSplatter({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ scale: 0, opacity: 0.7 }}
      animate={{ scale: [0, 1.5, 1.2], opacity: [0.7, 0.3, 0] }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{
        width: 120,
        height: 120,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        borderRadius: "60% 40% 50% 40% / 50% 60% 40% 50%",
        background: `radial-gradient(circle, ${color}40, transparent)`,
        filter: "blur(8px)",
      }}
    />
  );
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isWriting, setIsWriting] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [penPaths, setPenPaths] = useState<string[]>([]);
  const [showInkSplat, setShowInkSplat] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [0, 800], [8, -8]);
  const rotateY = useTransform(mouseX, [0, 1400], [-8, 8]);

  const step = STEPS[currentStep];

  // Generate pen paths when step changes
  useEffect(() => {
    const newPaths: string[] = [];
    for (let i = 0; i < 3; i++) {
      newPaths.push(generateHandwritingPath(step.penText));
    }
    setPenPaths(newPaths);
    setIsWriting(true);
    setShowContent(false);
    setShowInkSplat(true);

    const timer1 = setTimeout(() => setShowInkSplat(false), 1200);
    const timer2 = setTimeout(() => {
      setIsWriting(false);
      setShowContent(true);
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [currentStep, step.penText]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    },
    [mouseX, mouseY]
  );

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const goToApp = () => {
    window.location.href = "/";
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentStep((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && currentStep === STEPS.length - 1) {
        goToApp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${step.accentFrom}12 0%, transparent 50%),
                     radial-gradient(ellipse at 70% 80%, ${step.accentTo}10 0%, transparent 50%),
                     linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 30%, #080818 60%, #0a0a12 100%)`,
      }}
    >
      {/* ───── Top Progress Bar ───── */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-50 bg-white/[0.03]">
        <motion.div
          className="h-full rounded-r-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `linear-gradient(90deg, ${step.accentFrom}, ${step.accentTo})`,
            boxShadow: `0 0 20px ${step.accentFrom}60, 0 0 40px ${step.accentFrom}30`,
          }}
        />
      </div>

      {/* ───── Floating Particles Layer ───── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.3}
            size={2 + Math.random() * 4}
            color={i % 2 === 0 ? step.accentFrom : step.accentTo}
          />
        ))}
      </div>

      {/* ───── Grid overlay ───── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${step.accentFrom}30 1px, transparent 1px),
                           linear-gradient(90deg, ${step.accentFrom}30 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ───── Notebook lines background (subtle) ───── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 31px,
            ${step.accentFrom}40 31px,
            ${step.accentFrom}40 32px
          )`,
          backgroundPositionY: "15px",
        }}
      />

      {/* ───── Main 3D Container ───── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
        style={{ perspective: "1200px" }}>
        
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="w-full max-w-5xl"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, z: -100, rotateY: 15 }}
              animate={{ opacity: 1, z: 0, rotateY: 0 }}
              exit={{ opacity: 0, z: 100, rotateY: -15 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* ═══ LEFT: 3D Pen Writing Canvas ═══ */}
              <motion.div
                className="relative"
                style={{ transformStyle: "preserve-3d", transform: "translateZ(40px)" }}
              >
                {/* Canvas Card */}
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid rgba(255,255,255,0.06)`,
                    boxShadow: `
                      0 0 80px ${step.accentFrom}15,
                      0 25px 60px rgba(0,0,0,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.05)
                    `,
                    aspectRatio: "4/3",
                    minHeight: "320px",
                  }}
                >
                  {/* Paper texture lines */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 27px,
                        rgba(255,255,255,0.15) 27px,
                        rgba(255,255,255,0.15) 28px
                      )`,
                      backgroundPositionY: "20px",
                    }}
                  />

                  {/* Red margin line */}
                  <div
                    className="absolute top-0 bottom-0 opacity-[0.12]"
                    style={{
                      left: "60px",
                      width: "2px",
                      background: `linear-gradient(to bottom, transparent, #ef4444, #ef4444, transparent)`,
                    }}
                  />

                  {/* Ink splatter on step change */}
                  {showInkSplat && <InkSplatter color={step.accentFrom} />}

                  {/* SVG Handwriting Animation */}
                  <svg
                    viewBox="0 0 600 200"
                    className="absolute inset-0 w-full h-full"
                    style={{ padding: "15% 10%" }}
                  >
                    <defs>
                      <linearGradient id={`penGrad-${currentStep}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={step.accentFrom} />
                        {step.accentVia && <stop offset="50%" stopColor={step.accentVia} />}
                        <stop offset="100%" stopColor={step.accentTo} />
                      </linearGradient>
                      <filter id="penGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {penPaths.map((d, i) => (
                      <motion.path
                        key={`${currentStep}-${i}`}
                        d={d}
                        fill="none"
                        stroke={`url(#penGrad-${currentStep})`}
                        strokeWidth={2.5 - i * 0.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#penGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 - i * 0.2 }}
                        transition={{
                          pathLength: {
                            duration: 1.8,
                            delay: i * 0.15,
                            ease: [0.22, 1, 0.36, 1],
                          },
                          opacity: { duration: 0.3, delay: i * 0.15 },
                        }}
                      />
                    ))}

                    {/* Actual readable text that fades in after writing */}
                    <motion.text
                      x="300"
                      y="130"
                      textAnchor="middle"
                      fill={`url(#penGrad-${currentStep})`}
                      fontFamily="'Georgia', 'Times New Roman', serif"
                      fontSize="32"
                      fontStyle="italic"
                      fontWeight="bold"
                      initial={{ opacity: 0, y: 140 }}
                      animate={{ opacity: isWriting ? 0 : 1, y: isWriting ? 140 : 130 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                      {step.penText}
                    </motion.text>
                  </svg>

                  {/* 3D Pen / Nib */}
                  <motion.div
                    className="absolute pointer-events-none"
                    initial={{ x: "10%", y: "30%", rotate: -35, opacity: 0, scale: 0.8 }}
                    animate={
                      isWriting
                        ? {
                            x: ["10%", "30%", "55%", "75%", "85%"],
                            y: ["30%", "40%", "35%", "45%", "38%"],
                            rotate: [-35, -30, -38, -32, -35],
                            opacity: 1,
                            scale: 1,
                          }
                        : { x: "90%", y: "15%", rotate: -20, opacity: 0.4, scale: 0.9 }
                    }
                    transition={{
                      duration: isWriting ? 2 : 0.6,
                      ease: isWriting ? "easeInOut" : "easeOut",
                    }}
                    style={{ transformStyle: "preserve-3d", transform: "translateZ(30px)" }}
                  >
                    {/* Pen body */}
                    <div
                      className="relative"
                      style={{
                        width: "120px",
                        height: "14px",
                        background: `linear-gradient(90deg, #1a1a2e, #2d2d4f, #1a1a2e)`,
                        borderRadius: "7px 2px 2px 7px",
                        boxShadow: `
                          0 4px 15px rgba(0,0,0,0.4),
                          0 2px 4px rgba(0,0,0,0.3),
                          inset 0 1px 0 rgba(255,255,255,0.08)
                        `,
                      }}
                    >
                      {/* Pen grip section */}
                      <div
                        className="absolute right-0 top-0 bottom-0"
                        style={{
                          width: "35px",
                          background: `linear-gradient(90deg, transparent, ${step.accentFrom}60, ${step.accentTo}80)`,
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                      {/* Pen clip */}
                      <div
                        className="absolute -top-[3px] left-[15px]"
                        style={{
                          width: "40px",
                          height: "4px",
                          background: `linear-gradient(90deg, ${step.accentFrom}, ${step.accentTo})`,
                          borderRadius: "2px",
                          boxShadow: `0 0 8px ${step.accentFrom}60`,
                        }}
                      />
                      {/* Nib */}
                      <div
                        className="absolute -right-[10px] top-1/2 -translate-y-1/2"
                        style={{
                          width: 0,
                          height: 0,
                          borderTop: "5px solid transparent",
                          borderBottom: "5px solid transparent",
                          borderLeft: `12px solid ${step.accentFrom}`,
                          filter: `drop-shadow(0 0 4px ${step.accentFrom})`,
                        }}
                      />
                    </div>
                    {/* Ink trail drip */}
                    {isWriting && (
                      <motion.div
                        className="absolute -right-[12px] top-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: step.accentFrom,
                          boxShadow: `0 0 12px ${step.accentFrom}, 0 0 20px ${step.accentFrom}60`,
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  {/* Step counter badge */}
                  <div
                    className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, ${step.accentFrom}20, ${step.accentTo}15)`,
                      border: `1px solid ${step.accentFrom}30`,
                      color: step.accentTo,
                    }}
                  >
                    {String(currentStep + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                  </div>
                </div>

                {/* Reflection / Shadow */}
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full blur-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${step.accentFrom}20, ${step.accentTo}20, transparent)`,
                  }}
                />
              </motion.div>

              {/* ═══ RIGHT: Content Panel ═══ */}
              <motion.div
                className="flex flex-col justify-center space-y-6 lg:space-y-8"
                style={{ transformStyle: "preserve-3d", transform: "translateZ(20px)" }}
              >
                {/* Floating icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", damping: 12 }}
                  className="text-5xl w-20 h-20 flex items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${step.accentFrom}20, ${step.accentTo}10)`,
                    border: `1px solid ${step.accentFrom}25`,
                    boxShadow: `0 0 30px ${step.accentFrom}15`,
                  }}
                >
                  {step.icon}
                </motion.div>

                {/* Title */}
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: showContent ? 1 : 0.3, x: showContent ? 0 : 30 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-base sm:text-lg font-medium tracking-wide"
                    style={{ color: `${step.accentTo}90` }}
                  >
                    {step.title}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: showContent ? 1 : 0.2, x: showContent ? 0 : 40 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
                    style={{
                      background: `linear-gradient(135deg, #ffffff, ${step.accentTo})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {step.subtitle}
                  </motion.h1>
                </div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 0.7 : 0, y: showContent ? 0 : 20 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="text-base sm:text-lg leading-relaxed max-w-md"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {step.description}
                </motion.p>

                {/* Feature pills */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 15 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="flex flex-wrap gap-2"
                >
                  {["AI-Powered", "ICSE Board", "Instant"].map((tag, i) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium tracking-wide"
                      style={{
                        background: `${step.accentFrom}12`,
                        border: `1px solid ${step.accentFrom}20`,
                        color: `${step.accentTo}cc`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>

                {/* Navigation Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="flex items-center gap-4 pt-4"
                >
                  {currentStep > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={prevStep}
                      className="px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      ← Back
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: `0 0 40px ${step.accentFrom}40, 0 0 80px ${step.accentFrom}20`,
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={currentStep === STEPS.length - 1 ? goToApp : nextStep}
                    className="group relative px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide overflow-hidden cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${step.accentFrom}, ${step.accentTo})`,
                      color: "#0a0a0f",
                      boxShadow: `0 0 30px ${step.accentFrom}30, 0 4px 15px rgba(0,0,0,0.3)`,
                    }}
                  >
                    <span className="relative z-10">
                      {currentStep === STEPS.length - 1 ? "Start Forging →" : "Continue →"}
                    </span>
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />
                  </motion.button>

                  {currentStep === STEPS.length - 1 && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      whileHover={{ opacity: 0.9 }}
                      onClick={goToApp}
                      className="text-xs underline underline-offset-4 cursor-pointer"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Skip intro
                    </motion.button>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* ═══ Step Indicator Dots ═══ */}
          <div className="flex items-center justify-center gap-3 mt-12 lg:mt-16">
            {STEPS.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                className="relative cursor-pointer"
              >
                <motion.div
                  className="rounded-full transition-all duration-500"
                  animate={{
                    width: i === currentStep ? 36 : 10,
                    height: 10,
                    background:
                      i === currentStep
                        ? `linear-gradient(90deg, ${step.accentFrom}, ${step.accentTo})`
                        : i < currentStep
                        ? `${step.accentFrom}50`
                        : "rgba(255,255,255,0.12)",
                  }}
                  style={{
                    boxShadow:
                      i === currentStep ? `0 0 15px ${step.accentFrom}50` : "none",
                  }}
                />
                {i === currentStep && (
                  <motion.div
                    layoutId="activeDotGlow"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `${step.accentFrom}20`,
                      filter: "blur(8px)",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* ═══ Bottom branding ═══ */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 1.5 }}
            className="text-center text-xs tracking-[0.2em] uppercase mt-8 font-mono"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            ICSE Project Forge • Powered by AI
          </motion.p>
        </motion.div>
      </div>

      {/* ═══ Corner decorative elements ═══ */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
        <motion.div
          className="absolute top-6 left-6 w-16 h-[1px]"
          style={{ background: `linear-gradient(90deg, ${step.accentFrom}40, transparent)` }}
          animate={{ scaleX: [0, 1], opacity: [0, 0.5] }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.div
          className="absolute top-6 left-6 w-[1px] h-16"
          style={{ background: `linear-gradient(180deg, ${step.accentFrom}40, transparent)` }}
          animate={{ scaleY: [0, 1], opacity: [0, 0.5] }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none">
        <motion.div
          className="absolute bottom-6 right-6 w-16 h-[1px]"
          style={{ background: `linear-gradient(270deg, ${step.accentTo}40, transparent)` }}
          animate={{ scaleX: [0, 1], opacity: [0, 0.5] }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        <motion.div
          className="absolute bottom-6 right-6 w-[1px] h-16"
          style={{ background: `linear-gradient(0deg, ${step.accentTo}40, transparent)` }}
          animate={{ scaleY: [0, 1], opacity: [0, 0.5] }}
          transition={{ duration: 1, delay: 0.7 }}
        />
      </div>

      {/* ═══ Keyboard navigation hint ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.2, y: 0 }}
        transition={{ delay: 3 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        <kbd className="px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">←</kbd>
        <kbd className="px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[10px]">→</kbd>
        <span className="ml-1">to navigate</span>
      </motion.div>
    </div>
  );
}
