/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Point, Direction, GameStatus, Difficulty, Particle, SpecialFood } from '../types';
import { soundFX } from '../utils/audio';
import { Sparkles, Trophy, RotateCcw, Play, Pause, Zap } from 'lucide-react';

interface GameBoardProps {
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
  difficulty: Difficulty;
  score: number;
  setScore: (score: React.SetStateAction<number>) => void;
  highScore: number;
  setHighScore: (highScore: number) => void;
  isMuted: boolean;
}

// 網格配置
const GRID_SIZE_X = 40; // 40格寬
const GRID_SIZE_Y = 30; // 30格高
const CELL_SIZE = 20;   // 每格 20x20 像素

export const GameBoard: React.FC<GameBoardProps> = ({
  status,
  setStatus,
  difficulty,
  score,
  setScore,
  highScore,
  setHighScore,
  isMuted
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 遊戲物理與邏輯狀態（用 Ref 來防止在 requestAnimationFrame 閉包中讀取到舊狀態）
  const snakeRef = useRef<Point[]>([]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT'); // 緩衝鍵盤方向，防止在一個 Tick 內自我反轉
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const specialFoodRef = useRef<SpecialFood | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastMoveTimeRef = useRef<number>(0);
  const foodEatenCountRef = useRef<number>(0); // 吃了多少次普通食物

  // 特殊屬性：吃金色食物後的短暫無敵或加速時間
  const [specialEffect, setSpecialEffect] = useState<string | null>(null);

  // 初始化音效靜音狀態
  useEffect(() => {
    soundFX.toggle(!isMuted);
  }, [isMuted]);

  // 產生隨機且不在蛇身上的點
  const getRandomPoint = useCallback((snakeBody: Point[]): Point => {
    while (true) {
      const rx = Math.floor(Math.random() * GRID_SIZE_X);
      const ry = Math.floor(Math.random() * GRID_SIZE_Y);
      
      // 確定新點沒有跟蛇重疊
      const onSnake = snakeBody.some(segment => segment.x === rx && segment.y === ry);
      if (!onSnake) {
        return { x: rx, y: ry };
      }
    }
  }, []);

  // 建立粒子效果
  const createExplosion = (x: number, y: number, color: string, count: number = 15) => {
    const canvasX = x * CELL_SIZE + CELL_SIZE / 2;
    const canvasY = y * CELL_SIZE + CELL_SIZE / 2;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x: canvasX,
        y: canvasY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: Math.random() * 3 + 2,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  };

  // 1. 初始化 / 重置遊戲
  const resetGame = useCallback(() => {
    // 蛇初始長度 4 節，在畫布中央偏左
    const initialSnake: Point[] = [
      { x: 10, y: 15 },
      { x: 9, y: 15 },
      { x: 8, y: 15 },
      { x: 7, y: 15 }
    ];
    snakeRef.current = initialSnake;
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    
    // 初始化食物
    foodRef.current = getRandomPoint(initialSnake);
    specialFoodRef.current = null;
    particlesRef.current = [];
    foodEatenCountRef.current = 0;
    
    setScore(0);
    setSpecialEffect(null);
    lastMoveTimeRef.current = 0;
  }, [getRandomPoint, setScore]);

  // 當選擇了不同難度時重置
  useEffect(() => {
    if (status === 'IDLE' || status === 'GAME_OVER') {
      resetGame();
    }
  }, [difficulty, status, resetGame]);

  // 開始遊戲
  const startGame = () => {
    if (status === 'GAME_OVER') {
      resetGame();
    }
    setStatus('PLAYING');
  };

  // 2. 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免玩家在玩遊戲時網頁上下捲動
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && status === 'PLAYING') {
        e.preventDefault();
      }

      if (status !== 'PLAYING') {
        if (e.code === 'Space') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      const currentDir = directionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
        case 'p':
        case 'P':
        case 'Escape':
          setStatus('PAUSED');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, difficulty]);

  // 3. 手動觸發方向（給虛擬鍵盤/方向按鍵使用）
  const changeDirectionFromButton = (newDir: Direction) => {
    if (status !== 'PLAYING') return;
    const currentDir = directionRef.current;
    if (newDir === 'UP' && currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
    if (newDir === 'DOWN' && currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
    if (newDir === 'LEFT' && currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (newDir === 'RIGHT' && currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
  };

  // 4. 遊戲主 Loop (requestAnimationFrame)
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const progress = timestamp - lastTime;
      lastTime = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // 如果是播放中，且到達難度對應的時間，才移動蛇一格
      if (status === 'PLAYING') {
        if (!lastMoveTimeRef.current) lastMoveTimeRef.current = timestamp;
        const timeSinceLastMove = timestamp - lastMoveTimeRef.current;
        
        // 取得當前速度，如果有特殊食物加速/減速效果可調整
        let currentSpeed = difficulty.speed;
        
        if (timeSinceLastMove >= currentSpeed) {
          moveSnake();
          lastMoveTimeRef.current = timestamp;
        }

        // 減少特殊食物生命
        if (specialFoodRef.current) {
          specialFoodRef.current.timeLeft -= 1 / 60; // 每一幀 (大概 1/60 秒)
          if (specialFoodRef.current.timeLeft <= 0) {
            specialFoodRef.current = null;
          }
        }
      }

      // 每一幀不論在什麼遊戲狀態都要畫（因為粒子在播放，或遊戲結束遮罩等）
      draw(ctx);
      animationId = requestAnimationFrame(gameLoop);
    };

    // 蛇的物理位置移動邏輯
    const moveSnake = () => {
      const snake = [...snakeRef.current];
      if (snake.length === 0) return;

      // 更新方向（防抖更新）
      directionRef.current = nextDirectionRef.current;
      const head = snake[0];
      const dir = directionRef.current;

      // 計算下一個頭部位置
      let newHead = { ...head };
      switch (dir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // 檢查邊界碰撞
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE_X || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE_Y
      ) {
        triggerGameOver(snake);
        return;
      }

      // 檢查撞到自己 (排除蛇尾，因為蛇尾會在此 Tick 移動)
      const collisionIndex = snake.findIndex((segment, index) => {
        // 第一格不考慮，排除最後一格（因為若沒吃到食物，最後一格通常會移開）
        if (index === 0) return false;
        if (index === snake.length - 1) return false;
        return segment.x === newHead.x && segment.y === newHead.y;
      });

      if (collisionIndex !== -1) {
        triggerGameOver(snake);
        return;
      }

      // 把新蛇頭插入最前
      snake.unshift(newHead);

      // 檢查是否吃到普通食物
      const ateNormalFood = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
      
      // 檢查是否吃到特殊隨機食物
      const ateSpecialFood = specialFoodRef.current && 
        newHead.x === specialFoodRef.current.point.x && 
        newHead.y === specialFoodRef.current.point.y;

      if (ateNormalFood) {
        // 吃到普通食物的粒子與計分
        soundFX.playEat();
        createExplosion(foodRef.current.x, foodRef.current.y, '#10B981', 12); // 粉綠色
        
        const addedScore = 10 * difficulty.scoreMultiplier;
        setScore(prev => prev + addedScore);
        
        foodEatenCountRef.current += 1;

        // 生成新的食物
        foodRef.current = getRandomPoint(snake);

        // 每吃滿 4 個食物，有 35% 機率產生一個特殊黃金食物
        if (foodEatenCountRef.current % 4 === 0 && Math.random() < 0.4) {
          const goldPoint = getRandomPoint(snake);
          specialFoodRef.current = {
            point: goldPoint,
            type: 'GOLDEN',
            timeLeft: 8.0, // 存活 8 秒
            color: '#F59E0B', // 金黃色
            points: 50 * difficulty.scoreMultiplier
          };
        }

        // 不移除尾端，代表蛇長大
      } else if (ateSpecialFood && specialFoodRef.current) {
        // 吃到金色特殊食物的粒子與計分
        soundFX.playSpecialEat();
        createExplosion(specialFoodRef.current.point.x, specialFoodRef.current.point.y, '#F59E0B', 25); // 黃金粉末
        
        const addedScore = specialFoodRef.current.points;
        setScore(prev => prev + addedScore);
        
        // 縮小福利：蛇若大於 4 節，會將最後一節移去，使其靈活，否則不變
        if (snake.length > 4) {
          snake.pop(); // 移除最尾
          snake.pop(); // 再移一格，達到「瘦身減肥」靈活效果，這是有趣的遊戲機制！
        }

        specialFoodRef.current = null;
        // 除了剛剛插入的頭，不移除尾端代表生長。因為我們移除了尾端兩節，總長度會瘦身一節！
      } else {
        // 正常的移動：移除蛇尾
        snake.pop();
      }

      snakeRef.current = snake;
    };

    // 觸發遊戲結束
    const triggerGameOver = (currentSnake: Point[]) => {
      soundFX.playGameOver();
      setStatus('GAME_OVER');
      
      // 讓整條蛇在不同地方爆炸，特別是蛇頭
      if (currentSnake.length > 0) {
        createExplosion(currentSnake[0].x, currentSnake[0].y, '#EF4444', 30); // 鮮紅色蛇頭
        // 身體隨機炸幾段
        for (let i = 1; i < Math.min(currentSnake.length, 10); i += 2) {
          createExplosion(currentSnake[i].x, currentSnake[i].y, '#059669', 10);
        }
      }

      // 更新最高分
      setScore(prevScore => {
        if (prevScore > highScore) {
          setHighScore(prevScore);
          localStorage.setItem('snake_high_score', prevScore.toString());
        }
        return prevScore;
      });
    };

    // 主要 Canvas 繪製函式
    const draw = (ctx: CanvasRenderingContext2D) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      // 1. 清空與繪製深黑底座
      ctx.fillStyle = '#0a0a0a'; // Artistic 暗黑底色
      ctx.fillRect(0, 0, width, height);

      // 繪製極淡的網格底線，增添科技感
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'; // 設計圖超極細透白線
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. 繪製粒子特效 (Particles)
      particlesRef.current = particlesRef.current.filter(p => {
        // 更新位置
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        
        if (p.alpha <= 0) return false;

        // 繪製粒子
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });

      const snake = snakeRef.current;

      // 3. 繪製食物
      if (status !== 'IDLE' && snake.length > 0) {
        const food = foodRef.current;
        const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
        const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;

        // 畫一個有霓虹強烈發光的紅蘋果/圓球
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF3131'; // 設計圖 Neon Red
        ctx.fillStyle = '#FF3131';
        ctx.beginPath();
        ctx.arc(fx, fy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 漂亮的綠葉裝飾點綴
        ctx.fillStyle = '#39FF14'; // 霓虹綠
        ctx.beginPath();
        ctx.ellipse(fx + 2, fy - radius + 1, 3, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        // 4. 繪製金色特殊食物（如有）
        if (specialFoodRef.current) {
          const sFood = specialFoodRef.current;
          const sfx = sFood.point.x * CELL_SIZE + CELL_SIZE / 2;
          const sfy = sFood.point.y * CELL_SIZE + CELL_SIZE / 2;
          
          // 金色食物隨時間會閃爍其詞（呼吸效果）
          const scale = 1 + 0.15 * Math.sin(Date.now() / 100);
          const sRadius = (CELL_SIZE / 2 - 1) * scale;

          ctx.save();
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#00D2FF'; // 改用絢麗青色發光
          ctx.fillStyle = '#00D2FF';
          ctx.beginPath();
          ctx.arc(sfx, sfy, sRadius, 0, Math.PI * 2);
          ctx.fill();

          // 亮點點綴
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sfx - sRadius/3, sfy - sRadius/3, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();

          // 在特殊食物下方剩餘時間指示（以圓圈包圍的外環顯示）
          ctx.save();
          ctx.strokeStyle = `rgba(0, 210, 255, ${sFood.timeLeft / 8.0})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sfx, sfy, CELL_SIZE * 1.1, -Math.PI / 2, (sFood.timeLeft / 8.0) * Math.PI * 2 - Math.PI / 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 5. 繪製蛇
      if (status !== 'IDLE' && snake.length > 0) {
        snake.forEach((segment, index) => {
          const isHead = index === 0;
          const sx = segment.x * CELL_SIZE;
          const sy = segment.y * CELL_SIZE;
          
          // 蛇頭使用極佳的霓虹綠，身體呈優雅漸層
          ctx.save();
          
          if (isHead) {
            // 蛇頭：霓虹綠與超強陰影
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#39FF14'; // 設計圖 Neon Green
            ctx.fillStyle = '#39FF14'; 
            
            // 繪製圓角矩形蛇頭
            drawRoundedRect(ctx, sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
            ctx.fill();

            // 眼睛
            ctx.fillStyle = '#000000';
            const eyeSize = 3;
            
            if (directionRef.current === 'RIGHT') {
              ctx.beginPath(); ctx.arc(sx + 14, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 14, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath(); ctx.arc(sx + 15, sy + 5, 1, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 15, sy + 13, 1, 0, Math.PI * 2); ctx.fill();
            } else if (directionRef.current === 'LEFT') {
              ctx.beginPath(); ctx.arc(sx + 6, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 6, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath(); ctx.arc(sx + 5, sy + 5, 1, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 5, sy + 13, 1, 0, Math.PI * 2); ctx.fill();
            } else if (directionRef.current === 'UP') {
              ctx.beginPath(); ctx.arc(sx + 6, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 14, sy + 6, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath(); ctx.arc(sx + 5, sy + 5, 1, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 13, sy + 5, 1, 0, Math.PI * 2); ctx.fill();
            } else if (directionRef.current === 'DOWN') {
              ctx.beginPath(); ctx.arc(sx + 6, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 14, sy + 14, eyeSize, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath(); ctx.arc(sx + 5, sy + 15, 1, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(sx + 13, sy + 15, 1, 0, Math.PI * 2); ctx.fill();
            }
          } else {
            // 蛇身：產生霓虹綠與青色相間的優雅科技漸變
            const ratio = index / snake.length;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(57, 255, 20, 0.35)';
            ctx.fillStyle = interpolateColor('#00D2FF', '#39FF14', 1 - ratio);

            const shrink = ratio * 3.5; 
            drawRoundedRect(
              ctx, 
              sx + 1 + shrink / 2, 
              sy + 1 + shrink / 2, 
              CELL_SIZE - 2 - shrink, 
              CELL_SIZE - 2 - shrink, 
              4
            );
            ctx.fill();
          }
          ctx.restore();
        });
      }

      // 6. 優雅發光的外側霓虹雙色漸層邊框（高雅科技感）
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#00D2FF'); // 霓虹青
      grad.addColorStop(1, '#BC13FE'); // 霓虹紫
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, width, height);
    };

    // 圓角矩形輔助繪製器
    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // 漸變顏色計算器
    const interpolateColor = (color1: string, color2: string, factor: number): string => {
      const hex = (x: string) => parseInt(x, 16);
      const r1 = hex(color1.substring(1, 3));
      const g1 = hex(color1.substring(3, 5));
      const b1 = hex(color1.substring(5, 7));

      const r2 = hex(color2.substring(1, 3));
      const g2 = hex(color2.substring(3, 5));
      const b2 = hex(color2.substring(5, 7));

      const r = Math.round(r1 + factor * (r2 - r1));
      const g = Math.round(g1 + factor * (g2 - g1));
      const b = Math.round(b1 + factor * (b2 - b1));

      return `rgb(${r}, ${g}, ${b})`;
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [status, difficulty, resetGame, getRandomPoint, setScore, setHighScore]);

  return (
    <div className="flex flex-col items-center">
      
      {/* 遊戲畫布與疊層 UI 區面 */}
      <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-slate-900" style={{ width: GRID_SIZE_X * CELL_SIZE, height: GRID_SIZE_Y * CELL_SIZE }}>
        
        {/* HTML5 Canvas */}
        <canvas 
          id="game-canvas"
          ref={canvasRef} 
          width={GRID_SIZE_X * CELL_SIZE} 
          height={GRID_SIZE_Y * CELL_SIZE}
          className="block"
        />

        {/* 遊戲前的 Idle 初始開始畫面 */}
        {status === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center backdrop-blur-sm z-10 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-wide mb-2">
              經典霓虹貪食蛇
            </h2>
            <p className="text-slate-400 text-sm max-w-sm text-center mb-6 px-4">
              使用您的 <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs">方向鍵</span> 或 <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs">WASD</span> 來精準操作蛇前進，避開牆壁以及自己的身體。
            </p>
            <div className="flex space-x-3">
              <button 
                id="start-btn"
                onClick={startGame}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-black font-semibold rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>開始遊戲</span>
              </button>
            </div>
          </div>
        )}

        {/* 遊戲暫停畫面 Overlay */}
        {status === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-xs z-10">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center border border-amber-500/30 mb-4">
              <Pause className="w-7 h-7 text-amber-400 fill-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              遊戲已暫停
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              按下空白鍵或點擊下方按鈕繼續
            </p>
            <button 
              id="resume-btn"
              onClick={() => setStatus('PLAYING')}
              className="flex items-center space-x-2 px-6 py-2.5 bg-amber-500 text-black font-semibold rounded-lg shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>繼續遊戲</span>
            </button>
          </div>
        )}

        {/* 遊戲結束顯示 Overlay */}
        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center backdrop-blur-xs z-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-4 scale-effect">
              <RotateCcw className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-4xl font-extrabold text-red-500 tracking-wider mb-2">
              GAME OVER
            </h2>
            <p className="text-slate-300 text-sm mb-1 px-4">
              蛇撞毀了。
            </p>
            <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-lg border border-slate-800 my-4 text-white">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-slate-400 text-xs">本次得分：</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{score}</span>
            </div>
            <p className="text-slate-400 text-xs mb-6">
              按下 <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-100 font-mono text-[10px]">空白鍵 Space</span> 以重新挑戰
            </p>
            <button 
              id="retry-btn"
              onClick={() => { resetGame(); setStatus('PLAYING'); }}
              className="px-6 py-2.5 bg-red-500 text-white font-semibold rounded-lg shadow-lg shadow-red-500/20 hover:bg-red-400 active:scale-95 transition cursor-pointer"
            >
              重新開始
            </button>
          </div>
        )}

        {/* 黃金食物生成提示 (右上角顯示) */}
        {specialFoodRef.current && status === 'PLAYING' && (
          <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg px-3 py-1.5 flex items-center space-x-1.5 text-xs font-semibold animate-pulse shadow-lg shadow-amber-900/10">
            <Zap className="w-4 h-4 fill-amber-500 animate-bounce" />
            <span>出現特殊黃金食物！ 剩餘時間: {Math.max(0, Math.ceil(specialFoodRef.current.timeLeft))}s</span>
          </div>
        )}
      </div>

      {/* 虛擬控制器：給鍵盤不方便的移動端或 Preview 小面板操作 */}
      <div className="mt-6 flex flex-col items-center">
        <span className="text-xs text-slate-400 font-mono mb-2">螢幕觸控輔助方向鍵</span>
        <div className="grid grid-cols-3 gap-2 w-36 h-36">
          <div />
          <button 
            id="ctrl-up"
            onClick={() => changeDirectionFromButton('UP')}
            className={`flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 active:scale-90 transition shadow-md cursor-pointer ${directionRef.current === 'UP' ? 'ring-2 ring-emerald-500 bg-emerald-950/50 text-emerald-400' : ''}`}
            title="向上"
          >
            ▲
          </button>
          <div />
          
          <button 
            id="ctrl-left"
            onClick={() => changeDirectionFromButton('LEFT')}
            className={`flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 active:scale-90 transition shadow-md cursor-pointer ${directionRef.current === 'LEFT' ? 'ring-2 ring-emerald-500 bg-emerald-950/50 text-emerald-400' : ''}`}
            title="向左"
          >
            ◀
          </button>
          <div className="bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-600 font-mono">
            OK
          </div>
          <button 
            id="ctrl-right"
            onClick={() => changeDirectionFromButton('RIGHT')}
            className={`flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 active:scale-90 transition shadow-md cursor-pointer ${directionRef.current === 'RIGHT' ? 'ring-2 ring-emerald-500 bg-emerald-950/50 text-emerald-400' : ''}`}
            title="向右"
          >
            ▶
          </button>
          
          <div />
          <button 
            id="ctrl-down"
            onClick={() => changeDirectionFromButton('DOWN')}
            className={`flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 active:scale-90 transition shadow-md cursor-pointer ${directionRef.current === 'DOWN' ? 'ring-2 ring-emerald-500 bg-emerald-950/50 text-emerald-400' : ''}`}
            title="向下"
          >
            ▼
          </button>
          <div />
        </div>
      </div>

    </div>
  );
};
