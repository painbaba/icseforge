import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import {
  GraduationCap, Sparkles, BookOpenCheck, BrainCircuit, Wand2,
  ChevronRight, ChevronLeft, Check, HelpCircle, Lightbulb,
  FlaskConical, BookOpen, Gamepad2, Rocket, Trophy, Code,
  Music, Film, Compass, Cpu, Coins, Loader2, ArrowRight,
  Target, AlertCircle, Award, Compass as BuddyIcon, ShieldAlert,
  Flame, BookOpenCheck as SpecimenIcon, User, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  board: string;
  className: string;
}

interface OnboardingWizardProps {
  initialUser: AuthUser | null;
  onComplete: (user: AuthUser) => void;
}

/* ─────────────────────────── Intro Step Definition ─────────────────────────── */
interface OnboardingIntroStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  penText: string;
  icon: string;
  accentFrom: string;
  accentTo: string;
  accentVia?: string;
  tags: string[];
}

const INTRO_STEPS: OnboardingIntroStep[] = [
  {
    id: 1,
    title: "Welcome to",
    subtitle: "Project Forge",
    description: "Your AI-powered companion for crafting stellar board-level projects & mock papers — all forged from your own notes.",
    penText: "Hello, Scholar!",
    icon: "✦",
    accentFrom: "#6366f1",
    accentTo: "#a78bfa",
    accentVia: "#818cf8",
    tags: ["Workspace", "Multi-Agent AI", "Board-Ready"]
  },
  {
    id: 2,
    title: "Ingest Your Study Material",
    subtitle: "RAG Knowledge Base",
    description: "Drop in your handwritten notes, syllabus PDFs, or textbook chapters. Our RAG system structures and indexes it instantly.",
    penText: "Notes → Ingested",
    icon: "📚",
    accentFrom: "#06b6d4",
    accentTo: "#22d3ee",
    accentVia: "#67e8f9",
    tags: ["RAG Search", "PDF Parser", "Smart Index"]
  },
  {
    id: 3,
    title: "Generate Complete Projects",
    subtitle: "Multi-Agent Forge",
    description: "Our specialized AI agents outline, write, illustrate, and verify fully cited school projects with detailed bibliography.",
    penText: "Forge Completed!",
    icon: "⚡",
    accentFrom: "#f59e0b",
    accentTo: "#fbbf24",
    accentVia: "#fcd34d",
    tags: ["Bibliography", "Auto-Diagrams", "Self-Correction"]
  },
  {
    id: 4,
    title: "Study Smarter with",
    subtitle: "AI Tutor & Partner",
    description: "Chat with a customized AI Tutor matching your favorite learning style, or study alongside an interactive Partner.",
    penText: "Learn Active!",
    icon: "🧠",
    accentFrom: "#ec4899",
    accentTo: "#f472b6",
    accentVia: "#f9a8d4",
    tags: ["Socratic Tutor", "Peer Partner", "Custom Style"]
  },
  {
    id: 5,
    title: "Compete in Live",
    subtitle: "Multiplayer Battles",
    description: "Engage in timed, 10-question syllabus-wide battles with classmates. Earn gamified speed points and top the leaderboard!",
    penText: "Battle Arena!",
    icon: "🎮",
    accentFrom: "#10b981",
    accentTo: "#34d399",
    accentVia: "#6ed7b1",
    tags: ["Live Short-Polling", "Real-Time Sync", "Full Syllabus"]
  },
  {
    id: 6,
    title: "Consolidated Suite of",
    subtitle: "Smart Study Tools",
    description: "Plan your routine with the Timetable, manage homework Tasks, test yourself with Active Recall, and run Virtual Labs.",
    penText: "Full Toolkit!",
    icon: "🛠️",
    accentFrom: "#8b5cf6",
    accentTo: "#c084fc",
    accentVia: "#a78bfa",
    tags: ["Routine Planner", "Virtual Lab", "Recall Flashcards"]
  }
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

    const jitter = () => (Math.random() - 0.5) * 6;
    const strokeVariants = [
      `M ${cx + jitter()} ${y - 18 + jitter()} Q ${cx + 4 + jitter()} ${y - 5 + jitter()} ${cx + 2 + jitter()} ${y + 14 + jitter()}`,
      `M ${cx - 5 + jitter()} ${y - 10 + jitter()} C ${cx + 8 + jitter()} ${y - 20 + jitter()} ${cx + 15 + jitter()} ${y + 5 + jitter()} ${cx + 3 + jitter()} ${y + 12 + jitter()}`,
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

// ─── Vibration helper ──────────────────────────────────────────────────────────
function vibrate(pattern: number | number[] = 30) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const ONBOARD_LEARNING_STYLES = [
  { id: 'Socratic', name: 'Socratic Method', description: 'Guided questioning that helps you discover answers yourself.', icon: HelpCircle, color: 'from-indigo-500 to-violet-600', glow: 'rgba(99, 102, 241, 0.5)' },
  { id: 'Analogy', name: 'Analogy-based', description: 'Relates concepts to gaming, sports, or music.', icon: Lightbulb, color: 'from-pink-500 to-rose-600', glow: 'rgba(244, 63, 94, 0.5)' },
  { id: 'Practical', name: 'Practical Focus', description: 'Emphasizes experiments, labs, and real-world tools.', icon: FlaskConical, color: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.5)' },
  { id: 'Visual', name: 'Visual Schema', description: 'Structured layouts, flowcharts, and mental diagrams.', icon: Wand2, color: 'from-sky-500 to-cyan-600', glow: 'rgba(14, 165, 233, 0.5)' },
  { id: 'Direct', name: 'Direct & Concise', description: 'Crisp notes, clear formulas, direct answers.', icon: BookOpen, color: 'from-amber-500 to-orange-600', glow: 'rgba(245, 158, 11, 0.5)' }
];

const ONBOARD_INTERESTS = [
  { id: 'gaming', label: 'Gaming & eSports', icon: Gamepad2 },
  { id: 'space', label: 'Space & Astronomy', icon: Rocket },
  { id: 'sports', label: 'Sports & Cricket', icon: Trophy },
  { id: 'coding', label: 'Coding & Tech', icon: Code },
  { id: 'music', label: 'Music & Arts', icon: Music },
  { id: 'movies', label: 'Movies & Anime', icon: Film },
  { id: 'history', label: 'History & Stories', icon: Compass },
  { id: 'robotics', label: 'Robotics & AI', icon: Cpu },
  { id: 'finance', label: 'Finance & Money', icon: Coins }
];

const SUBJECTS_BY_BOARD: Record<string, string[]> = {
  ICSE: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Applications', 'English Literature', 'History & Civics', 'Geography'],
  CBSE: ['Science', 'Mathematics', 'Social Science', 'English']
};

const TARGET_GOALS = [
  { id: '95%+', label: 'Score 95%+', desc: 'Focus on high-yield exam rubrics.', icon: Award, color: 'from-yellow-500 to-amber-600', glow: 'rgba(234, 179, 8, 0.5)' },
  { id: 'mastery', label: 'Master Fundamentals', desc: 'Deep scientific understanding.', icon: BrainCircuit, color: 'from-indigo-500 to-violet-600', glow: 'rgba(99, 102, 241, 0.5)' },
  { id: 'problems', label: 'Solve Hard Problems', desc: 'Numericals & analytical reasoning.', icon: Target, color: 'from-pink-500 to-rose-600', glow: 'rgba(244, 63, 94, 0.5)' },
  { id: 'consistency', label: 'Stay Consistent', desc: 'Step-by-step revision routine.', icon: Flame, color: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.5)' }
];

const STUDY_CHALLENGES = [
  { id: 'formulas', label: 'Formulas & Terms', desc: 'Active recall struggles.', icon: AlertCircle, color: 'from-amber-500 to-orange-600', glow: 'rgba(245, 158, 11, 0.5)' },
  { id: 'derivations', label: 'Theories & Derivations', desc: 'Conceptual detail gaps.', icon: BookOpen, color: 'from-sky-500 to-cyan-600', glow: 'rgba(14, 165, 233, 0.5)' },
  { id: 'mock-tests', label: 'Mock Test Timing', desc: 'Time pressure issues.', icon: SpecimenIcon, color: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.5)' },
  { id: 'scheduling', label: 'Time Management', desc: 'Planning & consistency.', icon: Coins, color: 'from-violet-500 to-purple-600', glow: 'rgba(139, 92, 246, 0.5)' }
];

const TUTOR_PERSONAS = [
  { id: 'Encouraging Teacher', label: 'Encouraging Teacher', desc: 'Warm, patient, motivational.', avatar: '🌟', color: 'from-yellow-500 to-amber-600', glow: 'rgba(234, 179, 8, 0.5)' },
  { id: 'Strict Inspector', label: 'Strict Exam Inspector', desc: 'Rigorous, exam-focused.', avatar: '📋', color: 'from-red-500 to-rose-600', glow: 'rgba(239, 68, 68, 0.5)' },
  { id: 'Research Scientist', label: 'Research Scientist', desc: 'In-depth, theory-driven.', avatar: '🧬', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.5)' },
  { id: 'Peer Buddy', label: 'Peer Study Buddy', desc: 'Casual, uses study hacks.', avatar: '💬', color: 'from-sky-500 to-cyan-600', glow: 'rgba(14, 165, 233, 0.5)' }
];

// ─── Card transition variants ──────────────────────────────────────────────────
const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.85,
    rotateY: direction > 0 ? 25 : -25,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -400 : 400,
    opacity: 0,
    scale: 0.85,
    rotateY: direction > 0 ? -25 : 25,
  }),
};

const cardTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Total question cards (welcome + 8 questions + calibration = 10 steps)
const TOTAL_QUESTIONS = 8;

export function OnboardingWizard({ initialUser, onComplete }: OnboardingWizardProps) {
  // step 0 = welcome/auth, steps 1-6 = intro, steps 7-14 = questions, step 15 = calibration
  const [step, setStep] = useState<number>(initialUser ? 1 : 0);
  const [direction, setDirection] = useState(1);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [submitting, setSubmitting] = useState(false);

  // Form selections
  const [name, setName] = useState(initialUser?.name || '');
  const [board, setBoard] = useState<'ICSE' | 'CBSE'>(initialUser?.board as any || 'ICSE');
  const [className, setClassName] = useState(initialUser?.className || '10');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [targetGoal, setTargetGoal] = useState('');
  const [studyChallenge, setStudyChallenge] = useState('');
  const [tutorPersona, setTutorPersona] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Calibration
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  // Background particles
  const [particles, setParticles] = useState<any[]>([]);

  // 3D handwriting states
  const [isWriting, setIsWriting] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [penPaths, setPenPaths] = useState<string[]>([]);
  const [showInkSplat, setShowInkSplat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [0, 800], isMobile ? [0, 0] : [8, -8]);
  const rotateY = useTransform(mouseX, [0, 1400], isMobile ? [0, 0] : [-8, 8]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate pen paths when step changes (for steps 1-6)
  useEffect(() => {
    if (step < 1 || step > 6) return;
    const introStep = INTRO_STEPS[step - 1];
    if (!introStep) return;

    const newPaths: string[] = [];
    for (let i = 0; i < 3; i++) {
      newPaths.push(generateHandwritingPath(introStep.penText));
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
  }, [step]);

  const toggleSubject = (sub: string) => {
    vibrate(25);
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const toggleInterest = (id: string) => {
    vibrate(20);
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const goNext = () => {
    vibrate(40);
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    vibrate(20);
    setDirection(-1);
    setStep((s) => s - 1);
  };

  useEffect(() => {
    const count = 10;
    const shapes = Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 250 + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * -20,
      color: i % 4 === 0 ? 'bg-indigo-500/8' : i % 4 === 1 ? 'bg-teal-500/8' : i % 4 === 2 ? 'bg-fuchsia-500/8' : 'bg-amber-500/6'
    }));
    setParticles(shapes);
  }, []);

  // Load Google Client for step 0
  useEffect(() => {
    if (step !== 0) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '316632173309-bs8qv8g1gk1fhnh8k84rg6kafsub2mrc.apps.googleusercontent.com',
            callback: handleGoogleLoginCallback,
          });
          (window as any).google.accounts.id.renderButton(
            document.getElementById('google-signin-btn-onboard'),
            { theme: 'outline', size: 'large', width: 280 }
          );
        } catch (e) {
          console.error('Failed to init google sign-in:', e);
        }
      }
    };
    return () => { try { document.body.removeChild(script); } catch {} };
  }, [step]);

  const handleGoogleLoginCallback = async (response: any) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error || 'Google Sign-in failed'); return; }
      setUser(data.user);
      setName(data.user.name || '');
      setBoard(data.user.board || 'ICSE');
      setClassName(data.user.className || '10');
      vibrate([30, 50, 30]);
      toast.success(`Welcome ${data.user.name || data.user.email}!`);

      // Check if user is already onboarded
      try {
        const pRes = await fetch('/api/profile');
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData?.profile) {
            const interests = JSON.parse(pData.profile.interests || '[]');
            const strengths = JSON.parse(pData.profile.strengths || '[]');
            if (interests.length > 0 || strengths.length > 0) {
              onComplete(data.user);
              return;
            }
          }
        }
      } catch (profileErr) {
        console.warn('Onboarding check failed, falling back to full flow:', profileErr);
      }

      setDirection(1);
      setStep(1);
    } catch { toast.error('Network error during Google Sign-in'); }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (board === 'CBSE' && !['4', '5', '6', '7', '8', '9', '10'].includes(className)) setClassName('10');
    else if (board === 'ICSE' && !['8', '9', '10', '11', '12'].includes(className)) setClassName('10');
    const defaults = SUBJECTS_BY_BOARD[board] || [];
    setSelectedSubjects(defaults.slice(0, 3));
  }, [board]);

  const startCalibration = () => {
    vibrate([50, 80, 50]);
    setDirection(1);
    setStep(15);
    setCalibrationProgress(0);
    const interval = setInterval(() => {
      setCalibrationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          void completeOnboarding();
          return 100;
        }
        return prev + 2;
      });
    }, 55);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          board,
          className,
          learningStyle: learningStyle || 'Analogy',
          interests,
          strengths: selectedSubjects,
          weaknesses: (SUBJECTS_BY_BOARD[board] || []).filter(s => !selectedSubjects.includes(s)),
          targetScore: targetGoal || '95%+',
          painPoint: studyChallenge || 'formulas',
          tutorPersona: tutorPersona || 'Encouraging Teacher'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      vibrate([30, 100, 30, 100, 50]);
      onComplete(data.user);
      toast.success('Your AI Partner is calibrated! 🚀');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save settings.');
      setStep(14);
    }
  };

  // Keyboard navigation for feature tour steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step < 1 || step > 6) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        vibrate(20);
        setDirection(1);
        setStep((s) => Math.min(s + 1, 7));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        vibrate(20);
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  // Question step labels for progress
  const questionLabels = [
    'Welcome',
    'Feature Tour', 'Feature Tour', 'Feature Tour', 'Feature Tour', 'Feature Tour', 'Feature Tour',
    'Your Name', 'Board', 'Class', 'Subjects',
    'Goal', 'Challenge', 'AI Persona', 'Learning Style & Interests',
    'Calibrating'
  ];

  const canProceed = (s: number): boolean => {
    if (s >= 1 && s <= 6) return true;
    switch (s) {
      case 7: return name.trim().length > 0;
      case 8: return !!board;
      case 9: return !!className;
      case 10: return selectedSubjects.length > 0;
      case 11: return !!targetGoal;
      case 12: return !!studyChallenge;
      case 13: return !!tutorPersona;
      case 14: return !!learningStyle;
      default: return true;
    }
  };

  const progress = step === 0 ? 0 : step >= 15 ? 100 : Math.round(((step - 6) / 8) * 100);

  // ─── Render ────────────────────────────────────────────────────────────────────

  const backgroundStyle = step >= 1 && step <= 6 && INTRO_STEPS[step - 1]
    ? {
        background: `radial-gradient(ellipse at 30% 20%, ${INTRO_STEPS[step - 1].accentFrom}12 0%, transparent 50%),
                     radial-gradient(ellipse at 70% 80%, ${INTRO_STEPS[step - 1].accentTo}10 0%, transparent 50%),
                     linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 30%, #080818 60%, #0a0a12 100%)`
      }
    : {
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)'
      };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-700 ease-out"
      style={{ ...backgroundStyle, perspective: '1200px' }}
      onMouseMove={handleMouseMove}
    >
      
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((sh) => (
          <motion.div
            key={sh.id}
            className={`absolute rounded-full blur-[100px] ${sh.color}`}
            style={{ width: sh.size, height: sh.size, left: `${sh.x}%`, top: `${sh.y}%` }}
            animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.2, 0.85, 1] }}
            transition={{ duration: sh.duration, delay: sh.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Progress bar — top */}
      {step > 0 && step < 15 && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="h-1 bg-slate-800/60">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              animate={{ width: `${step <= 6 ? (step / 6) * 100 : ((step - 6) / 8) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-center gap-2 py-3">
            {step <= 6 ? (
              Array.from({ length: 6 }, (_, i) => (
                <motion.div
                  key={`tour-dot-${i}`}
                  className={`rounded-full transition-all duration-300 ${
                    i + 1 === step
                      ? 'w-8 h-2 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                      : i + 1 < step
                      ? 'w-2 h-2 bg-indigo-400/70'
                      : 'w-2 h-2 bg-slate-700'
                  }`}
                  layout
                />
              ))
            ) : (
              Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={`calib-dot-${i}`}
                  className={`rounded-full transition-all duration-300 ${
                    i + 7 === step
                      ? 'w-8 h-2 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      : i + 7 < step
                      ? 'w-2 h-2 bg-purple-400/70'
                      : 'w-2 h-2 bg-slate-700'
                  }`}
                  layout
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Step label */}
      {step > 0 && step < 15 && (
        <div className="absolute top-12 left-0 right-0 z-20 flex justify-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            {step <= 6 ? `Tour: ${step} / 6` : `Calibration: ${step - 6} / 8`} — {questionLabels[step]}
          </span>
        </div>
      )}

      {/* Main card container */}
      <div
        className={`relative w-full z-10 px-4 transition-all duration-500 ease-in-out ${
          step >= 1 && step <= 6 ? 'max-w-5xl' : 'max-w-lg'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <AnimatePresence mode="wait" custom={direction}>

          {/* ─── STEP 0: Welcome & Auth ─────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                  className="relative size-24 flex items-center justify-center bg-indigo-500/10 rounded-full border border-indigo-500/30"
                  animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.2)', '0 0 40px rgba(99,102,241,0.4)', '0 0 20px rgba(99,102,241,0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <GraduationCap className="size-12 text-indigo-400 relative z-10" />
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-teal-300 bg-clip-text text-transparent">
                    Forge Your Board Success
                  </h1>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    8 quick questions to calibrate your personalized AI study partner.
                  </p>
                </div>

                <div className="grid gap-3 w-full max-w-sm text-left bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Sparkles className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300"><strong>AI Agent Workbooks</strong>: 8,000+ word, 15+ section academic projects.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpenCheck className="size-4 text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300"><strong>Interactive Partner</strong>: Chat tutor calibrated to your style.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 pt-2 w-full max-w-xs">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">SIGN IN TO BEGIN</span>
                  <div id="google-signin-btn-onboard" className="min-h-[40px] flex justify-center shadow-lg rounded-xl overflow-hidden"></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEPS 1-6: 3D FEATURE TOUR ─────────────────────── */}
          {step >= 1 && step <= 6 && INTRO_STEPS[step - 1] && (
            <motion.div
              key={`intro-step-${step}`}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* ═══ LEFT: 3D Pen Writing Canvas ═══ */}
              <motion.div
                className="relative"
                style={{ transformStyle: "preserve-3d", transform: "translateZ(40px)" }}
                animate={isMobile ? { y: [0, -6, 0] } : {}}
                transition={isMobile ? { repeat: Infinity, duration: 4, ease: "easeInOut" } : {}}
              >
                {/* Canvas Card */}
                <div
                  className="relative rounded-3xl overflow-hidden transition-all duration-300"
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid rgba(255,255,255,0.06)`,
                    boxShadow: `
                      0 0 80px ${INTRO_STEPS[step - 1].accentFrom}15,
                      0 25px 60px rgba(0,0,0,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.05)
                    `,
                    aspectRatio: isMobile ? "2/1" : "4/3",
                    minHeight: isMobile ? "200px" : "340px",
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
                      left: isMobile ? "40px" : "60px",
                      width: "2px",
                      background: `linear-gradient(to bottom, transparent, #ef4444, #ef4444, transparent)`,
                    }}
                  />

                  {/* Ink splatter on step change */}
                  {showInkSplat && <InkSplatter color={INTRO_STEPS[step - 1].accentFrom} />}

                  {/* SVG Handwriting Animation */}
                  <svg
                    viewBox="0 0 600 200"
                    className="absolute inset-0 w-full h-full"
                    style={{ padding: isMobile ? "6% 4%" : "15% 10%" }}
                  >
                    <defs>
                      <linearGradient id={`penGrad-${step}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={INTRO_STEPS[step - 1].accentFrom} />
                        {INTRO_STEPS[step - 1].accentVia && <stop offset="50%" stopColor={INTRO_STEPS[step - 1].accentVia} />}
                        <stop offset="100%" stopColor={INTRO_STEPS[step - 1].accentTo} />
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
                        key={`${step}-${i}`}
                        d={d}
                        fill="none"
                        stroke={`url(#penGrad-${step})`}
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
                      fill={`url(#penGrad-${step})`}
                      fontFamily="'Georgia', 'Times New Roman', serif"
                      fontSize={isMobile ? "24" : "32"}
                      fontStyle="italic"
                      fontWeight="bold"
                      initial={{ opacity: 0, y: 140 }}
                      animate={{ opacity: isWriting ? 0 : 1, y: isWriting ? 140 : 130 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                      {INTRO_STEPS[step - 1].penText}
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
                            scale: isMobile ? 0.7 : 1,
                          }
                        : { x: "90%", y: "15%", rotate: -20, opacity: 0.4, scale: isMobile ? 0.6 : 0.9 }
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
                        width: isMobile ? "80px" : "120px",
                        height: isMobile ? "10px" : "14px",
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
                          width: isMobile ? "25px" : "35px",
                          background: `linear-gradient(90deg, transparent, ${INTRO_STEPS[step - 1].accentFrom}60, ${INTRO_STEPS[step - 1].accentTo}80)`,
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                      {/* Pen clip */}
                      <div
                        className="absolute -top-[3px] left-[15px]"
                        style={{
                          width: isMobile ? "25px" : "40px",
                          height: isMobile ? "3px" : "4px",
                          background: `linear-gradient(90deg, ${INTRO_STEPS[step - 1].accentFrom}, ${INTRO_STEPS[step - 1].accentTo})`,
                          borderRadius: "2px",
                          boxShadow: `0 0 8px ${INTRO_STEPS[step - 1].accentFrom}60`,
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
                          borderLeft: `12px solid ${INTRO_STEPS[step - 1].accentFrom}`,
                          filter: `drop-shadow(0 0 4px ${INTRO_STEPS[step - 1].accentFrom})`,
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
                          background: INTRO_STEPS[step - 1].accentFrom,
                          boxShadow: `0 0 12px ${INTRO_STEPS[step - 1].accentFrom}, 0 0 20px ${INTRO_STEPS[step - 1].accentFrom}60`,
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
                      background: `linear-gradient(135deg, ${INTRO_STEPS[step - 1].accentFrom}20, ${INTRO_STEPS[step - 1].accentTo}15)`,
                      border: `1px solid ${INTRO_STEPS[step - 1].accentFrom}30`,
                      color: INTRO_STEPS[step - 1].accentTo,
                    }}
                  >
                    {String(step).padStart(2, "0")} / 06
                  </div>
                </div>

                {/* Reflection / Shadow */}
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full blur-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${INTRO_STEPS[step - 1].accentFrom}20, ${INTRO_STEPS[step - 1].accentTo}20, transparent)`,
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
                    background: `linear-gradient(135deg, ${INTRO_STEPS[step - 1].accentFrom}20, ${INTRO_STEPS[step - 1].accentTo}10)`,
                    border: `1px solid ${INTRO_STEPS[step - 1].accentFrom}25`,
                    boxShadow: `0 0 30px ${INTRO_STEPS[step - 1].accentFrom}15`,
                  }}
                >
                  {INTRO_STEPS[step - 1].icon}
                </motion.div>

                {/* Title */}
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: showContent ? 1 : 0.3, x: showContent ? 0 : 30 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-base sm:text-lg font-medium tracking-wide"
                    style={{ color: `${INTRO_STEPS[step - 1].accentTo}90` }}
                  >
                    {INTRO_STEPS[step - 1].title}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: showContent ? 1 : 0.2, x: showContent ? 0 : 40 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
                    style={{
                      background: `linear-gradient(135deg, #ffffff, ${INTRO_STEPS[step - 1].accentTo})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {INTRO_STEPS[step - 1].subtitle}
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
                  {INTRO_STEPS[step - 1].description}
                </motion.p>

                {/* Feature pills */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 15 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="flex flex-wrap gap-2"
                >
                  {INTRO_STEPS[step - 1].tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium tracking-wide"
                      style={{
                        background: `${INTRO_STEPS[step - 1].accentFrom}12`,
                        border: `1px solid ${INTRO_STEPS[step - 1].accentFrom}20`,
                        color: `${INTRO_STEPS[step - 1].accentTo}cc`,
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
                  <motion.button
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goBack}
                    className="px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    ← Back
                  </motion.button>

                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: `0 0 40px ${INTRO_STEPS[step - 1].accentFrom}40, 0 0 80px ${INTRO_STEPS[step - 1].accentFrom}20`,
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goNext}
                    className="group relative px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide overflow-hidden cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${INTRO_STEPS[step - 1].accentFrom}, ${INTRO_STEPS[step - 1].accentTo})`,
                      color: "#0a0a0f",
                      boxShadow: `0 0 30px ${INTRO_STEPS[step - 1].accentFrom}30, 0 4px 15px rgba(0,0,0,0.3)`,
                    }}
                  >
                    <span className="relative z-10">
                      {step === 6 ? "Calibrate AI Partner →" : "Continue →"}
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

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    whileHover={{ opacity: 0.9 }}
                    onClick={() => { vibrate(30); setDirection(1); setStep(7); }}
                    className="text-xs underline underline-offset-4 cursor-pointer"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Skip intro
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ─── STEP 7: Name ─────────────────────────────────── */}
          {step === 7 && (
            <motion.div
              key="name"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <User className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">What's your name?</h2>
                  <p className="text-xs text-slate-400">Your AI partner will use this to personalize chats.</p>
                </div>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); vibrate(10); }}
                  placeholder="e.g. Aarav Sharma"
                  autoFocus
                  className="bg-slate-800/60 border-slate-700 text-center text-lg h-14 rounded-2xl focus:border-indigo-500 text-white placeholder:text-slate-600 max-w-xs"
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button
                    onClick={goNext}
                    disabled={!canProceed(7)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-12 text-sm font-bold gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.03] transition-transform"
                  >
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 8: Board ────────────────────────────────── */}
          {step === 8 && (
            <motion.div
              key="board"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <GraduationCap className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">Which board?</h2>
                  <p className="text-xs text-slate-400">We'll align your syllabus and question patterns accordingly.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  {(['ICSE', 'CBSE'] as const).map((b) => {
                    const active = board === b;
                    return (
                      <motion.button
                        key={b}
                        onClick={() => { setBoard(b); vibrate(35); }}
                        whileTap={{ scale: 0.93 }}
                        className={`relative h-24 rounded-2xl border-2 text-lg font-extrabold flex flex-col items-center justify-center gap-1 transition-all duration-200 overflow-hidden ${
                          active
                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="board-glow"
                            className="absolute inset-0 bg-indigo-500/10 rounded-2xl"
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          />
                        )}
                        <span className="relative z-10">{b}</span>
                        <span className="relative z-10 text-[10px] font-medium opacity-60">Board</span>
                        {active && <Check className="absolute top-2 right-2 size-4 text-indigo-400" />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button onClick={goNext} disabled={!canProceed(8)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg disabled:opacity-40 hover:scale-[1.03] transition-transform">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 9: Class ────────────────────────────────── */}
          {step === 9 && (
            <motion.div
              key="class"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <BookOpen className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">What class are you in?</h2>
                  <p className="text-xs text-slate-400">This determines your syllabus scope and difficulty level.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {(board === 'CBSE' ? ['4','5','6','7','8','9','10'] : ['8','9','10','11','12']).map((c) => {
                    const active = className === c;
                    return (
                      <motion.button
                        key={c}
                        onClick={() => { setClassName(c); vibrate(30); }}
                        whileTap={{ scale: 0.88 }}
                        className={`relative size-14 rounded-2xl border-2 text-sm font-extrabold flex items-center justify-center transition-all duration-200 ${
                          active
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {c}
                        {active && <motion.div layoutId="class-ring" className="absolute inset-0 border-2 border-amber-400 rounded-2xl" transition={{ type: 'spring', stiffness: 400, damping: 25 }} />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button onClick={goNext} disabled={!canProceed(9)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg disabled:opacity-40 hover:scale-[1.03] transition-transform">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 10: Subjects ─────────────────────────────── */}
          {step === 10 && (
            <motion.div
              key="subjects"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <BookOpenCheck className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">Pick your subjects</h2>
                  <p className="text-xs text-slate-400">Select one or more subjects you want to focus on.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {(SUBJECTS_BY_BOARD[board] || []).map((sub) => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <motion.button
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        whileTap={{ scale: 0.92 }}
                        className={`h-11 px-3 text-xs font-bold rounded-xl border-2 flex items-center justify-between transition-all duration-200 ${
                          isSelected
                            ? 'border-pink-500 bg-pink-500/15 text-pink-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span>{sub}</span>
                        {isSelected && <Check className="size-4 text-pink-400 stroke-[3]" />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button onClick={goNext} disabled={!canProceed(10)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg disabled:opacity-40 hover:scale-[1.03] transition-transform">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 11: Target Goal ──────────────────────────── */}
          {step === 11 && (
            <motion.div
              key="goal"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <Target className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">What's your goal?</h2>
                  <p className="text-xs text-slate-400">This shapes how your AI prioritizes content.</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                  {TARGET_GOALS.map((goal, idx) => {
                    const active = targetGoal === goal.id;
                    return (
                      <motion.button
                        key={goal.id}
                        onClick={() => { setTargetGoal(goal.id); vibrate(35); }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`relative p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all duration-200 ${
                          active
                            ? 'border-amber-500/70 bg-amber-500/10 shadow-[0_0_25px_rgba(234,179,8,0.2)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`size-10 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center shrink-0 shadow-md`}>
                          <goal.icon className="size-5 text-white" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{goal.label}</h4>
                          <p className="text-[10px] text-slate-500">{goal.desc}</p>
                        </div>
                        {active && <Check className="size-5 text-amber-400 ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button onClick={goNext} disabled={!canProceed(11)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg disabled:opacity-40 hover:scale-[1.03] transition-transform">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 12: Study Challenge ──────────────────────── */}
          {step === 12 && (
            <motion.div
              key="challenge"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <AlertCircle className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">Biggest challenge?</h2>
                  <p className="text-xs text-slate-400">Your AI will focus extra on overcoming this.</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                  {STUDY_CHALLENGES.map((ch, idx) => {
                    const active = studyChallenge === ch.id;
                    return (
                      <motion.button
                        key={ch.id}
                        onClick={() => { setStudyChallenge(ch.id); vibrate(35); }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`relative p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all duration-200 ${
                          active
                            ? 'border-rose-500/70 bg-rose-500/10 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`size-10 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center shrink-0 shadow-md`}>
                          <ch.icon className="size-5 text-white" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{ch.label}</h4>
                          <p className="text-[10px] text-slate-500">{ch.desc}</p>
                        </div>
                        {active && <Check className="size-5 text-rose-400 ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button onClick={goNext} disabled={!canProceed(12)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg disabled:opacity-40 hover:scale-[1.03] transition-transform">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 13: AI Persona ───────────────────────────── */}
          {step === 13 && (
            <motion.div
              key="persona"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <BrainCircuit className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-white">Pick your AI persona</h2>
                  <p className="text-xs text-slate-400">Choose how your AI partner communicates.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {TUTOR_PERSONAS.map((p, idx) => {
                    const active = tutorPersona === p.id;
                    return (
                      <motion.button
                        key={p.id}
                        onClick={() => { setTutorPersona(p.id); vibrate(35); }}
                        whileTap={{ scale: 0.92 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center h-28 transition-all duration-200 overflow-hidden ${
                          active
                            ? 'border-violet-500/70 bg-violet-500/10 shadow-[0_0_25px_rgba(139,92,246,0.25)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-3xl mb-1.5">{p.avatar}</span>
                        <h4 className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{p.label}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">{p.desc}</p>
                        {active && <Check className="absolute top-2 right-2 size-4 text-violet-400" />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button onClick={goNext} disabled={!canProceed(13)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg disabled:opacity-40 hover:scale-[1.03] transition-transform">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 14: Learning Style & Interests ───────────── */}
          {step === 14 && (
            <motion.div
              key="style"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={cardTransition}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-8 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <motion.div
                  className="size-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <Wand2 className="size-8 text-white" />
                </motion.div>
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white">How do you learn best?</h2>
                  <p className="text-xs text-slate-400">Pick a style + your hobbies for better analogies.</p>
                </div>

                {/* Learning styles */}
                <div className="grid grid-cols-1 gap-1.5 w-full max-w-sm max-h-[180px] overflow-y-auto pr-1">
                  {ONBOARD_LEARNING_STYLES.map((style, idx) => {
                    const active = learningStyle === style.id;
                    return (
                      <motion.button
                        key={style.id}
                        onClick={() => { setLearningStyle(style.id); vibrate(30); }}
                        whileTap={{ scale: 0.96 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className={`p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all duration-200 ${
                          active
                            ? 'border-sky-500/70 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                        }`}
                      >
                        <div className={`size-8 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center shrink-0`}>
                          <style.icon className="size-4 text-white" />
                        </div>
                        <div>
                          <h4 className={`text-[11px] font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{style.name}</h4>
                          <p className="text-[9px] text-slate-500 line-clamp-1">{style.description}</p>
                        </div>
                        {active && <Check className="size-4 text-sky-400 ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Interests */}
                <div className="w-full max-w-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Hobbies (for better analogies)</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {ONBOARD_INTERESTS.map((int) => {
                      const isSelected = interests.includes(int.id);
                      return (
                        <motion.button
                          key={int.id}
                          onClick={() => toggleInterest(int.id)}
                          whileTap={{ scale: 0.9 }}
                          className={`h-8 px-2.5 text-[10px] font-bold rounded-full border flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                              : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <int.icon className="size-3" />
                          {int.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" onClick={goBack} className="rounded-2xl px-4 h-11 text-xs text-slate-400 hover:text-white">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button
                    onClick={startCalibration}
                    disabled={!canProceed(14)}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 hover:from-indigo-500 hover:via-purple-500 hover:to-teal-400 text-white rounded-2xl px-8 h-11 text-sm font-bold gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-40 hover:scale-[1.03] transition-transform"
                  >
                    <Zap className="size-4" /> Calibrate & Launch
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 15: Calibration ──────────────────────────── */}
          {step === 15 && (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-slate-900/70 border border-slate-800/80 rounded-3xl backdrop-blur-2xl p-10 md:p-14 shadow-2xl"
            >
              <div className="flex flex-col items-center justify-center space-y-7 text-center">
                <div className="relative size-28 flex items-center justify-center bg-indigo-500/10 rounded-full border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-2 border-teal-400 border-b-transparent opacity-60"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <BrainCircuit className="size-12 text-indigo-400 relative z-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white tracking-wide">Syncing Your AI Brain</h3>
                  <p className="text-xs text-slate-400 font-mono h-5">
                    {calibrationProgress < 20 && 'Resolving board spec files...'}
                    {calibrationProgress >= 20 && calibrationProgress < 40 && `Seeding target: ${targetGoal}...`}
                    {calibrationProgress >= 40 && calibrationProgress < 60 && `Tuning challenge buffers...`}
                    {calibrationProgress >= 60 && calibrationProgress < 80 && `Calibrating ${tutorPersona} tone...`}
                    {calibrationProgress >= 80 && calibrationProgress < 95 && `Mapping ${learningStyle} method...`}
                    {calibrationProgress >= 95 && '✓ Synchronization complete!'}
                  </p>
                </div>

                <div className="w-full max-w-xs bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                    animate={{ width: `${calibrationProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                <span className="text-sm font-extrabold text-indigo-400 font-mono bg-indigo-950/40 px-4 py-1.5 rounded-full border border-indigo-900/40">
                  {calibrationProgress}%
                </span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Corner decorative elements for Tour */}
      {step >= 1 && step <= 6 && INTRO_STEPS[step - 1] && (
        <>
          <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
            <motion.div
              className="absolute top-6 left-6 w-16 h-[1px]"
              style={{ background: `linear-gradient(90deg, ${INTRO_STEPS[step - 1].accentFrom}40, transparent)` }}
              animate={{ scaleX: [0, 1], opacity: [0, 0.5] }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.div
              className="absolute top-6 left-6 w-[1px] h-16"
              style={{ background: `linear-gradient(180deg, ${INTRO_STEPS[step - 1].accentFrom}40, transparent)` }}
              animate={{ scaleY: [0, 1], opacity: [0, 0.5] }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none">
            <motion.div
              className="absolute bottom-6 right-6 w-16 h-[1px]"
              style={{ background: `linear-gradient(270deg, ${INTRO_STEPS[step - 1].accentTo}40, transparent)` }}
              animate={{ scaleX: [0, 1], opacity: [0, 0.5] }}
              transition={{ duration: 1, delay: 0.7 }}
            />
            <motion.div
              className="absolute bottom-6 right-6 w-[1px] h-16"
              style={{ background: `linear-gradient(0deg, ${INTRO_STEPS[step - 1].accentTo}40, transparent)` }}
              animate={{ scaleY: [0, 1], opacity: [0, 0.5] }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
          
          {/* Keyboard navigation hint */}
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
        </>
      )}
    </div>
  );
}

