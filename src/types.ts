/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Difficulty {
  id: 'EASY' | 'MEDIUM' | 'HARD' | 'NIGHTMARE';
  name: string;
  speed: number; // 每次移動的時間間隔（毫秒）
  scoreMultiplier: number; // 分數加倍係數
  color: string; // 懸停與邊框主題色
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
}

export interface SpecialFood {
  point: Point;
  type: 'GOLDEN' | 'SPEED_UP' | 'SHRINK';
  timeLeft: number; // 特殊食物生命週期（剩餘格數或秒數）
  color: string;
  points: number;
}
