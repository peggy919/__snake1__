/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStatus, Difficulty } from '../types';
import { 
  Trophy, 
  Settings, 
  Volume2, 
  VolumeX, 
  Flame, 
  Gamepad2, 
  Info,
  Pause,
  Play
} from 'lucide-react';

interface ControlPanelProps {
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  score: number;
  highScore: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  difficulties: Difficulty[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  setStatus,
  difficulty,
  setDifficulty,
  score,
  highScore,
  isMuted,
  setIsMuted,
  difficulties
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row items-stretch justify-between gap-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      
      {/* 1. 當前與最高分數板 */}
      <div className="flex-1 flex items-center justify-around bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="text-center">
          <div className="text-xs text-slate-400 font-mono tracking-wider uppercase mb-1">SCORE</div>
          <div className="text-4xl font-black text-white font-mono animate-pulse-slow">
            {score}
          </div>
        </div>
        
        <div className="h-10 w-[1px] bg-slate-800" />

        <div className="text-center">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-400 font-mono tracking-wider uppercase mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>BEST</span>
          </div>
          <div className="text-4xl font-black text-amber-400 font-mono">
            {highScore}
          </div>
        </div>
      </div>

      {/* 2. 難度選擇器 */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
          <Settings className="w-4 h-4 text-slate-400" />
          <span>遊戲難度設置</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {difficulties.map((diff) => {
            const isSelected = diff.id === difficulty.id;
            return (
              <button
                id={`diff-btn-${diff.id.toLowerCase()}`}
                key={diff.id}
                disabled={status === 'PLAYING'}
                onClick={() => setDifficulty(diff)}
                className={`py-2 px-3 text-xs w-full font-bold rounded-lg border transition duration-200 cursor-pointer ${
                  isSelected
                    ? `${diff.color} border-current text-white cursor-default bg-slate-800/80`
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                } ${status === 'PLAYING' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-sans mb-0.5">{diff.name}</div>
                <div className="font-mono text-[9px] opacity-60">x{diff.scoreMultiplier} 倍數</div>
              </button>
            );
          })}
        </div>
        {status === 'PLAYING' && (
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center lg:text-left">
            * 遊戲進行中無法更改難度，重新挑戰時可切換。
          </p>
        )}
      </div>

      {/* 3. 控制與聲音開關 */}
      <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-2 min-w-[140px]">
        {/* 暫停 / 繼續按鈕 */}
        {status === 'PLAYING' ? (
          <button
            id="pause-control-btn"
            onClick={() => setStatus('PAUSED')}
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 active:scale-95 transition cursor-pointer"
          >
            <Pause className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold">暫停遊戲 P</span>
          </button>
        ) : status === 'PAUSED' ? (
          <button
            id="play-control-btn"
            onClick={() => setStatus('PLAYING')}
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400 active:scale-95 transition font-semibold cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="text-xs">繼續遊戲 Space</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center justify-center h-10 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 font-mono">
            等待挑戰
          </div>
        )}

        {/* 靜音 / 聲音按鈕 */}
        <button
          id="sound-toggle-btn"
          onClick={() => setIsMuted(!isMuted)}
          className={`flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg border transition cursor-pointer ${
            isMuted 
              ? 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300' 
              : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/30'
          }`}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="text-xs font-semibold">音效：關閉</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-xs font-semibold">音效：開啟</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
