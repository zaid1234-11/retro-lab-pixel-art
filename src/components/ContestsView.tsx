import React, { useState, useEffect } from 'react';
import { Award, Clock, Coins, Flame, Star, CheckCircle, PenTool, Check, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { Contest, ContestSubmission } from '../types';
import PixelEditor from './PixelEditor';
import DailyPrompt from './DailyPrompt';

interface ContestsViewProps {
  activeContest: Contest;
  pastContests: Contest[];
}

export default function ContestsView({ activeContest, pastContests }: ContestsViewProps) {
  const [submissions, setSubmissions] = useState<ContestSubmission[]>(activeContest.submissions);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [showSubmitCanvas, setShowSubmitCanvas] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({ days: 10, hours: 11, minutes: 21, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVote = (subId: string) => {
    const alreadyVoted = userVotes[subId] || false;
    setUserVotes(prev => ({ ...prev, [subId]: !alreadyVoted }));
    setSubmissions(prev =>
      prev.map(sub => {
        if (sub.id === subId) {
          return {
            ...sub,
            votes: sub.votes + (alreadyVoted ? -1 : 1)
          };
        }
        return sub;
      })
    );
  };

  const handleCanvasPublish = (newArt: {
    title: string;
    imageUrl: string;
  }) => {
    const newSubmission: ContestSubmission = {
      id: `sub-${Date.now()}`,
      title: newArt.title,
      imageUrl: newArt.imageUrl,
      artistName: 'You (Anon Artist)',
      votes: 1, // start with self-vote
      submittedAt: new Date().toISOString().split('T')[0]
    };

    setSubmissions(prev => [newSubmission, ...prev]);
    setSubmissionSuccess(true);
    setTimeout(() => {
      setSubmissionSuccess(false);
      setShowSubmitCanvas(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 pb-16 select-none animate-fadeIn">
      
      {/* Daily Pixel Art Prompts */}
      <DailyPrompt />

      {/* Active Contest Banner Card */}
      <div className="bg-brand-charcoal border border-brand-cream/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Absolute Ribbon */}
        <div className="absolute top-0 right-0 bg-brand-cream text-brand-charcoal font-pixel text-[9px] font-bold px-6 py-1.5 rotate-45 translate-x-8 translate-y-3 shadow-sm select-none">
          ACTIVE CHALLENGE
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-5 border-b border-brand-cream/15">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-brand-cream" />
              <span className="font-pixel text-[10px] tracking-wider text-brand-cream/55 uppercase">Monthly Challenge</span>
            </div>
            <h2 className="font-pixel text-lg md:text-xl text-brand-cream leading-tight">
              Theme: {activeContest.theme}
            </h2>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-brand-dark/60 border border-brand-cream/25 rounded-lg p-3 font-mono text-xs shadow-inner">
            <Clock className="w-4 h-4 text-brand-cream/70 animate-pulse" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-brand-cream/40 font-pixel">CLOSES IN:</span>
              <span className="text-brand-cream font-bold mt-0.5">
                {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>

        {/* Requirements & Description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 text-xs">
          <div className="md:col-span-2">
            <h4 className="font-pixel text-[10px] text-brand-cream/60 uppercase mb-1.5">Challenge Objective</h4>
            <p className="font-sans text-brand-cream/80 leading-relaxed bg-brand-dark/20 p-3.5 rounded border border-brand-cream/5">
              {activeContest.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 justify-between bg-brand-dark/40 border border-brand-cream/10 p-3 rounded">
            <div>
              <h4 className="font-pixel text-[9px] text-brand-cream/50 uppercase mb-1">REQUISITES</h4>
              <ul className="font-sans space-y-1 text-brand-cream/75 leading-tight">
                <li>• Dimensions: <span className="font-mono text-brand-cream font-semibold">{activeContest.dimensions}</span></li>
                <li>• File: Static PNG / Pixelated</li>
                <li>• Max submissions: 1 per author</li>
              </ul>
            </div>
            <div>
              <h4 className="font-pixel text-[9px] text-brand-cream/50 uppercase mb-1">PRIZE POOL</h4>
              <div className="flex items-center gap-1.5 text-brand-cream font-mono font-bold text-xs mt-0.5">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span>{activeContest.prizePool}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Required Palette colors */}
        <div className="mt-5 pt-4 border-t border-brand-cream/10">
          <h4 className="font-pixel text-[9px] text-brand-cream/50 uppercase mb-2">REQUIRED CHALLENGE PALETTE:</h4>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeContest.palette.map((color) => (
              <div
                key={color}
                className="w-12 h-6 rounded border border-brand-cream/15 flex items-center justify-center font-mono text-[8px] font-bold shadow-xs cursor-help"
                style={{
                  backgroundColor: color,
                  color: ['#FFFFFF', '#49FF9F', '#00F0FF', '#FFE57F'].includes(color) ? '#181816' : '#E8E8C6'
                }}
                title={color}
              >
                {color.slice(1, 5)}
              </div>
            ))}
          </div>
        </div>

        {/* Submission Drawing Button */}
        <div className="mt-6 flex justify-center">
          {!showSubmitCanvas ? (
            <button
              onClick={() => {
                setShowSubmitCanvas(true);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="px-6 py-2.5 bg-brand-cream hover:bg-brand-light text-brand-charcoal font-pixel text-xs font-bold rounded flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <PenTool className="w-4 h-4 text-brand-charcoal" />
              <span>DRAW & SUBMIT ENTRY</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitCanvas(false)}
              className="text-brand-cream/60 hover:text-brand-cream font-mono text-xs transition-all"
            >
              Close drawing board
            </button>
          )}
        </div>

      </div>

      {/* DRAWING BOARD POPUP COLLAPSE */}
      {showSubmitCanvas && (
        <div className="mt-8 bg-brand-dark/40 border-2 border-dashed border-brand-cream/35 p-6 rounded-xl relative animate-fadeIn">
          <div className="mb-4">
            <h3 className="font-pixel text-xs text-brand-cream flex items-center gap-2">
              <PenTool className="w-4 h-4 text-brand-cream animate-bounce" />
              <span>Challenge Canvas: Neon Drizzle theme</span>
            </h3>
            <p className="font-sans text-xs text-brand-cream/60 mt-0.5">
              Draw your custom piece using the preset cool-tone palette below. Name it and hit publish!
            </p>
          </div>

          {submissionSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center bg-brand-charcoal/40 border border-green-500/30 rounded-lg text-center gap-2">
              <CheckCircle className="w-10 h-10 text-green-400 animate-bounce" />
              <h4 className="font-pixel text-xs text-brand-cream uppercase">ENTRY REGISTERED!</h4>
              <p className="font-sans text-xs text-brand-cream/60">Your submission has been appended to the active community entries.</p>
            </div>
          ) : (
            <PixelEditor
              onPublish={handleCanvasPublish}
              initialPalette={activeContest.palette}
              initialDimensions="32x32"
            />
          )}
        </div>
      )}

      {/* Active Submissions Section */}
      <div className="mt-12">
        <h3 className="font-pixel text-xs tracking-wider uppercase text-brand-cream mb-6 flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand-cream animate-pulse" />
          <span>Active Submissions ({submissions.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {submissions.map((sub, idx) => {
            const hasVoted = userVotes[sub.id] || false;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ 
                  y: -5,
                  scale: 1.02,
                  borderColor: "rgba(237, 233, 224, 0.4)",
                  boxShadow: "0 10px 20px -3px rgba(0, 0, 0, 0.3)"
                }}
                className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-3 flex flex-col justify-between shadow-md transition-all duration-300"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-brand-dark border border-brand-cream/10">
                  <img
                    src={sub.imageUrl}
                    alt={sub.title}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-brand-dark/80 border border-brand-cream/20 px-2 py-0.5 rounded text-[8px] font-pixel text-brand-cream/65">
                    {sub.submittedAt}
                  </div>
                </div>

                <div className="mt-3.5 flex flex-col gap-0.5 select-none">
                  <span className="font-pixel text-[11px] font-bold text-brand-cream truncate leading-tight">{sub.title}</span>
                  <span className="font-sans text-[10px] text-brand-cream/55">by {sub.artistName}</span>
                </div>

                {/* Vote mechanics */}
                <div className="mt-4 pt-2.5 border-t border-brand-cream/10 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-brand-cream/45">
                    ⭐ {sub.votes} votes
                  </span>
                  
                  <button
                    onClick={() => handleVote(sub.id)}
                    className={`px-3 py-1 border text-[9px] uppercase tracking-wider font-pixel font-bold rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                      hasVoted
                        ? 'bg-brand-cream text-brand-charcoal border-brand-cream scale-102'
                        : 'bg-transparent text-brand-cream border-brand-cream/30 hover:border-brand-cream'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                    <span>{hasVoted ? 'voted' : 'vote'}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Past Contest Winners Podium (Mockup Tribute) */}
      <div className="mt-16 border-t border-brand-cream/15 pt-12">
        <h3 className="font-pixel text-xs tracking-wider uppercase text-brand-cream mb-8 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-brand-cream" />
          <span>Past Winners Hall of Fame</span>
        </h3>

        {pastContests.map((contest) => (
          <div key={contest.id} className="bg-brand-dark/40 border border-brand-cream/15 rounded-xl p-5 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-brand-cream/10 mb-5">
              <span className="font-pixel text-[10px] text-brand-cream">Theme: {contest.theme}</span>
              <span className="font-mono text-[9px] text-brand-cream/45">ENDED // JUNE 2026</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {contest.pastWinners?.map((winner) => (
                <motion.div
                  key={winner.place}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: winner.place === 1 ? 1.05 : 1 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: winner.place === 1 ? 1.08 : 1.03,
                    y: -4,
                    borderColor: winner.place === 1 ? "rgba(250, 204, 21, 0.7)" : "rgba(237, 233, 224, 0.4)"
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`border rounded-xl p-4 flex flex-col justify-between items-center relative text-center shadow ${
                    winner.place === 1
                      ? 'bg-brand-charcoal border-yellow-400/40 md:scale-105'
                      : winner.place === 2
                      ? 'bg-brand-charcoal/80 border-slate-300/30'
                      : 'bg-brand-charcoal/60 border-amber-600/20'
                  }`}
                >
                  {/* Ribbon/Place label */}
                  <div className={`absolute -top-3.5 px-3 py-0.5 rounded-full border text-[8px] font-pixel font-bold shadow ${
                    winner.place === 1
                      ? 'bg-yellow-400 text-brand-charcoal border-yellow-400 animate-pulse'
                      : winner.place === 2
                      ? 'bg-slate-300 text-brand-charcoal border-slate-300'
                      : 'bg-amber-600 text-white border-amber-600'
                  }`}>
                    {winner.place === 1 ? '🥇 1ST PLACE' : winner.place === 2 ? '🥈 2ND PLACE' : '🥉 3RD PLACE'}
                  </div>

                  <div className="w-32 aspect-square rounded-lg overflow-hidden bg-brand-dark border border-brand-cream/10 my-2">
                    <img
                      src={winner.imageUrl}
                      alt={winner.artTitle}
                      className="w-full h-full object-cover animate-pulse-subtle"
                      style={{ imageRendering: 'pixelated' }}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="mt-2.5 flex flex-col items-center select-none">
                    <span className="font-pixel text-[10px] text-brand-cream font-bold leading-tight">{winner.artTitle}</span>
                    <span className="font-sans text-[10px] text-brand-cream/55 mt-0.5">by {winner.artistName}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
