/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameStatus, Difficulty } from './types';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { 
  Gamepad2, 
  HelpCircle, 
  Zap, 
  Sparkles, 
  Volume2, 
  RotateCcw,
  Keyboard,
  Apple
} from 'lucide-react';

const DIFFICULTIES: Difficulty[] = [
  {
    id: 'EASY',
    name: '簡單 🍃',
    speed: 150,
    scoreMultiplier: 1.0,
    color: 'text-indigo-400 bg-indigo-950/30 border-indigo-500/50'
  },
  {
    id: 'MEDIUM',
    name: '中等 ⚡',
    speed: 100,
    scoreMultiplier: 1.5,
    color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/50'
  },
  {
    id: 'HARD',
    name: '困難 🔥',
    speed: 70,
    scoreMultiplier: 2.2,
    color: 'text-amber-400 bg-amber-950/30 border-amber-500/50'
  },
  {
    id: 'NIGHTMARE',
    name: '夢魘 💀',
    speed: 45,
    scoreMultiplier: 4.0,
    color: 'text-rose-400 bg-rose-950/30 border-rose-500/50'
  }
];

export default function App() {
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[1]); // 預設中等
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 初始化讀取最高分與音效設定
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  return (
    <div className="min-h-screen bg-artistic-gradient text-slate-100 flex flex-col justify-start items-center p-4 md:p-8 antialiased font-sans">
      
      {/* 雙欄／單欄 RWD 主版面 */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-10">
        
        {/* 左側 Sidebar 側邊欄 */}
        <aside className="flex flex-col justify-between space-y-8 md:border-r md:border-slate-800/60 md:pr-8">
          
          <div className="space-y-6">
            {/* 炫彩霓虹大標題 */}
            <div className="game-header text-left select-none">
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 rounded text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-2 font-bold">
                <Gamepad2 className="w-3 h-3" />
                <span>ARCADE REMASTER</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none text-neon-cyan uppercase font-sans">
                NEON<br />SNAKE
              </h1>
              <p className="text-slate-500 text-xs mt-2 font-mono tracking-tight leading-relaxed">
                ARTISTIC REVOLUTION v2.6.0
              </p>
            </div>

            {/* 比照設計圖的 Score Card */}
            <div className="stat-card bg-[#ffffff03]/40 border-l-[3px] border-[#39FF14] p-4 rounded-r-lg transition duration-300">
              <div className="stat-label font-mono text-[9px] uppercase tracking-widest text-[#39FF14]/70 mb-0.5">
                CURRENT SCORE
              </div>
              <div className="stat-value text-4xl font-light font-mono text-white tracking-tight">
                {score.toString().padStart(3, '0')}
              </div>
            </div>

            {/* 比照設計圖的 High Score Card (紫霓虹) */}
            <div className="stat-card bg-[#ffffff03]/40 border-l-[3px] border-[#BC13FE] p-4 rounded-r-lg transition duration-300">
              <div className="stat-label font-mono text-[9px] uppercase tracking-widest text-[#BC13FE]/70 mb-0.5">
                HIGH SCORE
              </div>
              <div className="stat-value text-4xl font-light font-mono text-neon-purple tracking-tight">
                {highScore.toString().padStart(3, '0')}
              </div>
            </div>
            
            {/* 簡易控制台嵌入以確保按鍵容易點擊 */}
            <div className="pt-2">
              <div className="flex gap-2">
                <button
                  id="side-sound-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex-1 py-2 px-3 text-xs font-mono rounded border transition flex items-center justify-center space-x-1 cursor-pointer ${
                    isMuted 
                      ? 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300' 
                      : 'bg-emerald-950/20 border-emerald-9900/40 text-[#39FF14] border-[#39FF14]/20 hover:bg-emerald-950/40'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>音效:{isMuted ? '關' : '開'}</span>
                </button>
                
                {status === 'PLAYING' && (
                  <button
                    id="side-pause-btn"
                    onClick={() => setStatus('PAUSED')}
                    className="flex-1 py-2 px-3 text-xs font-mono rounded border border-amber-500/20 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40 transition cursor-pointer"
                  >
                    暫停 P
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 側邊欄底部：極簡說明 & 操作按鍵提示 */}
          <div className="hidden md:block pt-8 border-t border-slate-900/60 font-mono text-[11px] text-slate-500 space-y-2.5">
            <p>
              USE <span className="text-[#00D2FF] border border-[#00D2FF]/30 px-1 py-0.5 rounded text-[10px]">↑</span> <span className="text-[#00D2FF] border border-[#00D2FF]/30 px-1 py-0.5 rounded text-[10px]">←</span> <span className="text-[#00D2FF] border border-[#00D2FF]/30 px-1 py-0.5 rounded text-[10px]">↓</span> <span className="text-[#00D2FF] border border-[#00D2FF]/30 px-1 py-0.5 rounded text-[10px]">→</span> TO NAVIGATE.
            </p>
            <p>
              COLLECT ENERGY CELLS [ <span className="text-neon-red font-bold">■</span> ] TO EXTEND CODEBASE.
            </p>
            <p>
              AVOID OUT-OF-BOUNDS WALLS AND SELF-COLLISION LOOPS.
            </p>
          </div>
        </aside>

        {/* 右側 Main Stage 遊戲舞台區 */}
        <section className="flex flex-col items-center justify-start space-y-6">
          
          {/* 難度選擇區與快速操作列 */}
          <div className="w-full bg-[#ffffff02]/20 border border-slate-900 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>系統難度核心脈衝：</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 justify-center">
              {DIFFICULTIES.map((diff) => {
                const isSelected = diff.id === difficulty.id;
                return (
                  <button
                    id={`diff-btn-${diff.id.toLowerCase()}`}
                    key={diff.id}
                    disabled={status === 'PLAYING'}
                    onClick={() => setDifficulty(diff)}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition duration-200 cursor-pointer ${
                      isSelected
                        ? `text-white bg-slate-900 border-neon-cyan`
                        : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    } ${status === 'PLAYING' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {diff.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 貪食蛇主畫布與虛擬方向按鍵 */}
          <GameBoard
            status={status}
            setStatus={setStatus}
            difficulty={difficulty}
            score={score}
            setScore={setScore}
            highScore={highScore}
            setHighScore={setHighScore}
            isMuted={isMuted}
          />

          {/* 移動端提示與輔助說明 */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-xs text-[#00D2FF] font-mono font-bold mb-1">🎮 SPACE / WASD CONTROL</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                無論是鍵盤滑動或底部的螢幕觸控輔助，皆支援 60Hz 快速暫停（P鍵 / Space鍵）與反應零延遲方向調整。
              </p>
            </div>
            
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-xs text-neon-red font-mono font-bold">★ GOLDEN RATIO</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                吃滿 4 顆普通能量體隨機出現「金蘋果」，提供高達四倍的積分，還附帶「縮身」福利助你突破極限！
              </p>
            </div>
          </div>

        </section>

      </div>

      {/* 底部 Footer */}
      <footer className="mt-16 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
        <p>SYSTEM REBOOT COMPLETE • DESIGNED BY ARTISTIC FLAIR THEME</p>
      </footer>
    </div>
  );
}
