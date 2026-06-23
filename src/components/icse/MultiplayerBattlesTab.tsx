'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Gamepad2, Users, Clock, Play, ArrowRight,
  Check, X, Crown, Loader2, Sparkles, Medal, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ICSE_SUBJECTS, CBSE_SUBJECTS } from './types';

interface Player {
  name: string;
  score: number;
  answers: Record<number, number>;
  answersAt: Record<number, number>;
}

interface Question {
  q: string;
  options: string[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  battlesPlayed: number;
  battlesWon: number;
}

export function MultiplayerBattlesTab({ board = 'ICSE' }: { board?: string }) {
  const subjectsList = board === 'CBSE' ? CBSE_SUBJECTS : ICSE_SUBJECTS;

  // Configuration States
  const [playerName, setPlayerName] = useState('Student');
  const [subject, setSubject] = useState(subjectsList[0] || 'Physics');
  const [className, setClassName] = useState('10');
  const [topic, setTopic] = useState('');
  
  // Game States
  const [gameState, setGameState] = useState<'lobby' | 'matchmaking' | 'waiting_for_start' | 'active' | 'completed'>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  // Result feedback from submit-answer
  const [submitFeedback, setSubmitFeedback] = useState<{
    correct: boolean;
    correctAnswerIndex: number;
    explanation: string;
    pointsEarned: number;
  } | null>(null);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Vibrate helper for tactile feedback
  const triggerHaptic = (type: 'click' | 'success' | 'error') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      if (type === 'click') window.navigator.vibrate(10);
      else if (type === 'success') window.navigator.vibrate([15, 30, 15]);
      else if (type === 'error') window.navigator.vibrate([60, 40, 60]);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/battles/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Main Polling Loop
  const startPolling = useCallback((code: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/battles/status?roomCode=${code}`);
        if (!res.ok) throw new Error('Status fetch failed');
        const data = await res.json();

        setActivePlayers(data.players);
        setTimer(data.timer);

        // Check if question index changed
        if (data.currentQuestionIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
          setSelectedAnswer(null);
          setSubmitFeedback(null);
          triggerHaptic('click');
        }

        // Check state transitions
        if (data.status !== gameState) {
          setGameState(data.status);
          if (data.status === 'active') {
            setQuestions(data.questions);
            triggerHaptic('success');
          } else if (data.status === 'completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            fetchLeaderboard();
            triggerHaptic('success');
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 1500);
  }, [gameState, currentQuestionIndex, fetchLeaderboard]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // API Call: Create Battle Room
  const handleCreateRoom = async () => {
    setLoading(true);
    triggerHaptic('click');
    try {
      const res = await fetch('/api/battles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, className, board })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      
      setRoomCode(data.roomCode);
      setIsHost(true);
      setActivePlayers(data.players);
      setSubject(data.subject);
      setTopic(data.topic);
      setGameState('waiting_for_start');
      startPolling(data.roomCode);
      toast.success(`Battle Room ${data.roomCode} created!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // API Call: Join Battle Room
  const handleJoinRoom = async (codeToJoin: string) => {
    if (!codeToJoin.trim()) {
      toast.error('Please enter a room code.');
      return;
    }
    setLoading(true);
    triggerHaptic('click');
    try {
      const res = await fetch('/api/battles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: codeToJoin, playerName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join room');

      setRoomCode(data.roomCode);
      setIsHost(false);
      setActivePlayers(data.players);
      setSubject(data.subject);
      setTopic(data.topic);
      setGameState('waiting_for_start');
      startPolling(data.roomCode);
      toast.success(`Joined room ${data.roomCode}!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // API Call: Start Battle
  const handleStartBattle = async () => {
    if (!isHost) return;
    setLoading(true);
    triggerHaptic('click');
    try {
      const res = await fetch('/api/battles/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start battle');

      setGameState('active');
      setQuestions(data.questions);
      toast.success('Battle has started! Prepare yourself!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // API Call: Submit Answer
  const handleSubmitAnswer = async (answerIdx: number) => {
    if (selectedAnswer !== null || submitFeedback) return;
    setSelectedAnswer(answerIdx);
    triggerHaptic('click');

    try {
      const res = await fetch('/api/battles/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerName,
          questionIndex: currentQuestionIndex,
          answerIndex: answerIdx
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Answer submission failed');

      setSubmitFeedback({
        correct: data.correct,
        correctAnswerIndex: data.correctAnswerIndex,
        explanation: data.explanation,
        pointsEarned: data.pointsEarned
      });

      if (data.correct) {
        triggerHaptic('success');
        toast.success(`Correct! +${data.pointsEarned} points!`);
      } else {
        triggerHaptic('error');
        toast.error('Wrong answer!');
      }

    } catch (e: any) {
      toast.error(e.message);
      setSelectedAnswer(null);
    }
  };

  // Exit game and reset states
  const handleExit = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setGameState('lobby');
    setRoomCode('');
    setIsHost(false);
    setSelectedAnswer(null);
    setSubmitFeedback(null);
    setActivePlayers([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    triggerHaptic('click');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      
      {/* Primary Battle Arena Screen */}
      <div className="space-y-4">
        
        {/* Lobby Setup */}
        {gameState === 'lobby' && (
          <Card className="border-muted/60 shadow-md">
            <CardHeader className="text-center pb-3">
              <div className="size-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2 animate-bounce-slow">
                <Gamepad2 className="size-6" />
              </div>
              <CardTitle className="text-xl">Multiplayer Battles Arena</CardTitle>
              <CardDescription>
                Engage in live competitive 10-question battles with classmates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="battle-player-name">Your Nickname</Label>
                <Input
                  id="battle-player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Aarav"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="battle-class">Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger id="battle-class" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['9', '10', '11', '12'].map((c) => (
                      <SelectItem key={c} value={c}>Class {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  The subject will be randomized automatically, and the battle questions will cover the entire syllabus.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <Button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold rounded-xl h-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                      Forging...
                    </>
                  ) : (
                    <>
                      <Play className="size-4 mr-1.5" />
                      Host Room
                    </>
                  )}
                </Button>
                
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Enter Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="text-center tracking-wider font-mono font-bold rounded-xl"
                    maxLength={6}
                  />
                  <Button
                    onClick={() => handleJoinRoom(roomCode)}
                    disabled={loading}
                    variant="secondary"
                    className="font-semibold rounded-xl px-3"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lobby: Waiting for Start */}
        {gameState === 'waiting_for_start' && (
          <Card className="border-muted/60 shadow-md">
            <CardHeader className="text-center border-b pb-4">
              <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest mb-1 mx-auto">
                ROOM CODE: {roomCode}
              </div>
              <CardTitle className="text-xl">Battle Room Lobby</CardTitle>
              <CardDescription>
                Topic: {topic} ({subject} • Class {className})
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Users className="size-4 text-brand" />
                  Players Joined ({activePlayers.length})
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activePlayers.map((player, idx) => (
                    <motion.div
                      key={player.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-3 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👨‍🎓</span>
                        <span className="font-semibold text-sm">{player.name}</span>
                      </div>
                      {idx === 0 && <Badge variant="secondary" className="scale-90 bg-amber-500/10 text-amber-700 border-amber-500/20">Host</Badge>}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <Button variant="outline" onClick={handleExit} className="rounded-xl">
                  Leave Room
                </Button>
                
                {isHost ? (
                  <Button
                    onClick={handleStartBattle}
                    disabled={loading || activePlayers.length < 1}
                    className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold rounded-xl px-5"
                  >
                    Start Battle
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin text-brand" />
                    Waiting for host to start...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Quiz Battle Arena */}
        {gameState === 'active' && questions.length > 0 && (
          <div className="space-y-4">
            
            {/* Countdown / Timer and Progress Banner */}
            <Card className="border-muted/60 shadow-md">
              <div className="h-1.5 w-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-brand"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timer / 15) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5 px-2">
                    Question {currentQuestionIndex + 1} of 10
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-brand font-bold text-sm">
                  <Clock className="size-4 animate-pulse" />
                  <span className="tabular-nums font-mono">{timer}s Left</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Question Statement */}
            <Card className="border-muted/60 shadow-md">
              <CardContent className="pt-6 pb-6">
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                  {questions[currentQuestionIndex]?.q}
                </h2>
              </CardContent>
            </Card>

            {/* Option Choices */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {questions[currentQuestionIndex]?.options.map((opt, optIdx) => {
                const optionLetter = String.fromCharCode(65 + optIdx);
                const isSelected = selectedAnswer === optIdx;
                
                let btnStyle = 'border-muted bg-card hover:bg-muted/10 text-foreground';
                let markIcon: React.ReactNode = null;

                if (submitFeedback) {
                  const isCorrectAnswer = optIdx === submitFeedback.correctAnswerIndex;
                  if (isCorrectAnswer) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold';
                    markIcon = <Check className="size-4 text-emerald-600 shrink-0" />;
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-bold';
                    markIcon = <X className="size-4 text-rose-600 shrink-0" />;
                  } else {
                    btnStyle = 'border-muted bg-card opacity-50';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-brand bg-brand-soft/30 text-brand font-bold';
                }

                return (
                  <motion.button
                    key={optIdx}
                    type="button"
                    disabled={selectedAnswer !== null || submitFeedback !== null}
                    onClick={() => handleSubmitAnswer(optIdx)}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm shadow-xs transition-all duration-200 cursor-pointer ${btnStyle}`}
                  >
                    <span className={`grid size-6 place-items-center rounded-full text-xs font-black ${
                      submitFeedback && optIdx === submitFeedback.correctAnswerIndex
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isSelected
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {optionLetter}
                    </span>
                    <span className="flex-1 leading-normal font-medium">{opt}</span>
                    {markIcon}
                  </motion.button>
                );
              })}
            </div>

            {/* Answer feedback & Explanation */}
            <AnimatePresence>
              {submitFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-brand/20 bg-card p-4 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Medal className={`size-5 ${submitFeedback.correct ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <h3 className={`font-extrabold text-sm ${submitFeedback.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                      {submitFeedback.correct ? `Correct! (+${submitFeedback.pointsEarned} pts)` : 'Incorrect Answer'}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {submitFeedback.explanation}
                  </p>
                  <div className="text-[11px] text-muted-foreground italic pt-2 border-t flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin text-brand" />
                    <span>Waiting for other players or timer to advance...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Battle Completed Scoreboard */}
        {gameState === 'completed' && (
          <Card className="border-muted/60 shadow-md">
            <CardHeader className="text-center pb-4 border-b">
              <div className="size-14 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2 animate-bounce-slow">
                <Trophy className="size-8" />
              </div>
              <CardTitle className="text-2xl font-black text-brand">Battle Report</CardTitle>
              <CardDescription>Topic: {topic}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Medal className="size-4 text-brand" />
                  Final Ranks
                </h3>
                
                <div className="space-y-2">
                  {[...activePlayers].sort((a,b) => b.score - a.score).map((player, idx) => {
                    const isWinner = idx === 0;
                    return (
                      <div
                        key={player.name}
                        className={`flex items-center justify-between p-3.5 border rounded-xl shadow-xs ${
                          isWinner ? 'border-brand bg-brand-soft/20' : 'border-muted bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold text-muted-foreground w-6">#{idx + 1}</span>
                          <span className="text-lg">{isWinner ? '👑' : '👨‍🎓'}</span>
                          <span className={`font-semibold text-sm ${isWinner ? 'text-brand font-black' : ''}`}>{player.name}</span>
                        </div>
                        <div className="font-mono font-bold text-sm">{player.score} pts</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button onClick={handleExit} className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold rounded-xl px-6">
                  Exit to Arena Lobby
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Sidebar: Real-time Player Status / Cumulative Leaderboard */}
      <div className="space-y-4">
        
        {/* Real-time Players List (only visible during active play) */}
        {gameState === 'active' && (
          <Card className="border-muted/60 shadow-md">
            <CardHeader className="py-3.5 border-b">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="size-4 text-brand" />
                Live Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {[...activePlayers].sort((a, b) => b.score - a.score).map((player, idx) => {
                const hasAnswered = player.answers[currentQuestionIndex] !== undefined;
                return (
                  <div key={player.name} className="flex items-center justify-between p-2 border rounded-lg bg-muted/20 text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                      <span>{idx === 0 ? '👑' : '👨‍🎓'}</span>
                      <span className="font-semibold truncate">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={hasAnswered ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0 px-1' : 'bg-amber-500/10 text-amber-600 border-amber-500/20 py-0 px-1'}>
                        {hasAnswered ? 'Done' : 'Thinking'}
                      </Badge>
                      <span className="font-bold font-mono">{player.score}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Cumulative Global Leaderboard */}
        <Card className="border-muted/60 shadow-md">
          <CardHeader className="py-3.5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Trophy className="size-4 text-brand" />
              Leaderboard
            </CardTitle>
            <Button size="icon" variant="ghost" className="size-7 rounded-full shrink-0" onClick={fetchLeaderboard} disabled={loadingLeaderboard}>
              <RefreshCw className={`size-3 text-muted-foreground ${loadingLeaderboard ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-3 space-y-2.5 max-h-[400px] overflow-y-auto pr-1 select-none">
            {leaderboard.length === 0 && !loadingLeaderboard ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic flex flex-col items-center gap-1">
                <AlertCircle className="size-5 text-muted-foreground/30" />
                No scores yet.
              </div>
            ) : (
              leaderboard.map((entry, idx) => {
                const isTop3 = idx < 3;
                const badges = ['🥇', '🥈', '🥉'];
                const badgeColor = idx === 0 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : idx === 1 ? 'text-slate-400 bg-slate-400/10 border-slate-400/20' : 'text-amber-700 bg-amber-700/10 border-amber-700/20';

                return (
                  <div key={entry.id} className="flex items-center justify-between p-2.5 border rounded-xl hover:bg-muted/15 transition-all text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[150px]">
                      {isTop3 ? (
                        <span className="text-sm shrink-0 w-4 text-center">{badges[idx]}</span>
                      ) : (
                        <span className="text-[10px] shrink-0 font-bold text-muted-foreground w-4 text-center">#{idx + 1}</span>
                      )}
                      <div className="truncate flex flex-col">
                        <span className="font-semibold truncate leading-tight">{entry.name}</span>
                        <span className="text-[9px] text-muted-foreground">Played: {entry.battlesPlayed} • Won: {entry.battlesWon}</span>
                      </div>
                    </div>
                    <Badge className={`font-mono font-bold shrink-0 ${isTop3 ? badgeColor : 'bg-muted text-muted-foreground border-transparent'}`}>
                      {entry.points} pts
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
