
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Achievement } from '../types';
import { Shield, Database, Play, Server, Eye, Globe, PlusCircle, Activity, AlertTriangle, Skull, Zap, Crosshair, Cpu, LockKeyhole, BrickWall, Trophy, X, Star } from 'lucide-react';

interface DataHunterScreenProps {
  user: UserProfile;
}

// --- CONFIGURATION ---
const GAME_DURATION = 600; // 10 Minutes
const INITIAL_RAM = 256; 
const SPAWN_INTERVAL_MS = 415; 
const BASE_DIMENSION = 800; // Reference dimension for scaling

// SERVER DEFENSE CONFIG
const SERVER_DEFENSE = {
    damage: 350,
    cooldown: 10, // Seconds
    range: 50, 
};

// ACHIEVEMENTS
const DH_ACHIEVEMENTS: Achievement[] = [
    { id: 'dh_firstkill', title: 'First Blood', description: 'Menghancurkan musuh pertama', icon: '🩸', unlocked: false },
    { id: 'dh_rich', title: 'Rich Guy', description: 'Memiliki 1000+ RAM', icon: '💰', unlocked: false },
    { id: 'dh_fortress', title: 'Fortress', description: 'Membangun 8 Tower sekaligus', icon: '🏰', unlocked: false },
    { id: 'dh_untouchable', title: 'Untouchable', description: 'Menang dengan 100% Health', icon: '🛡️', unlocked: false },
    { id: 'dh_sniper', title: 'Sniper', description: 'Menggunakan Tower VPN (Range Jauh)', icon: '🎯', unlocked: false },
    { id: 'dh_firewall', title: 'Firewall God', description: 'Membangun 5 Firewall', icon: '🔥', unlocked: false },
    { id: 'dh_survivor', title: 'Survivor', description: 'Bertahan selama 5 menit', icon: '⏳', unlocked: false },
    { id: 'dh_boss_slayer', title: 'Boss Slayer', description: 'Mengalahkan Ransomware Boss', icon: '⚔️', unlocked: false },
    { id: 'dh_patcher', title: 'Patcher', description: 'Menggunakan Emergency Patch', icon: '🩹', unlocked: false },
    { id: 'dh_legend', title: 'Net Legend', description: 'Menang melawan APT Final Boss', icon: '🏆', unlocked: false }
];

// SERVER POSITION (Updated to Bottom Right)
const SERVER_POS = { x: 90, y: 85 };

// PATHS: 3 Random Paths from Top to Bottom Right
const PATHS = [
  // Left Path (Snakes widely)
  [
    { x: 15, y: -5 }, { x: 15, y: 30 }, { x: 40, y: 30 }, { x: 40, y: 60 }, { x: 20, y: 60 }, { x: 20, y: 85 }, { x: 90, y: 85 }
  ],
  // Center Path (Diagonally down)
  [
    { x: 50, y: -5 }, { x: 50, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 85 }, { x: 90, y: 85 }
  ],
  // Right Path (Direct drop)
  [
    { x: 85, y: -5 }, { x: 85, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 60 }, { x: 90, y: 60 }, { x: 90, y: 85 }
  ]
];

// TOWER CONFIGURATION
const TOWERS_CONFIG = {
  OLD_WALL: {
      name: 'Old Wall',
      cost: 30,
      range: 0,     // Does not attack
      damage: 0,    // No damage
      cooldown: 0,  
      hp: 1500,     // Highest HP (Tank)
      color: 'bg-stone-600',
      canvasColor: '#57534e',
      icon: BrickWall,
      desc: 'High HP, No Attack'
  },
  FIRMWARE: {
      name: 'Firmware',
      cost: 40,
      range: 15,    // Short Range
      damage: 5,    // Lowest Damage
      cooldown: 8,  // Very Fast Fire Rate
      hp: 80,       // Low HP
      color: 'bg-slate-500',
      canvasColor: '#64748b',
      icon: Cpu,
      desc: 'Very Fast, Low DMG'
  },
  TPM: {
      name: 'TPM 2.0',
      cost: 50,
      range: 18,    // Medium-Short Range
      damage: 15,   // Moderate Damage
      cooldown: 40, // Medium Fire Rate
      hp: 250,      // High HP (Durable)
      color: 'bg-teal-600',
      canvasColor: '#0d9488',
      icon: LockKeyhole,
      desc: 'Secure & Durable'
  },
  ADBLOCK: { 
      name: 'IDS Basic', 
      cost: 60, 
      range: 22,    // Medium Range
      damage: 30,   // Normal Damage
      cooldown: 20, // Fast Fire Rate
      hp: 120, 
      color: 'bg-amber-500', 
      canvasColor: '#f59e0b', 
      icon: Eye, 
      desc: 'Rapid Fire (Normal)' 
  },
  FIREWALL: { 
      name: 'Next-Gen FW', 
      cost: 200, 
      range: 12,    // Narrow Range (5 Kotak equivalent - very short)
      damage: 300,  // High Damage
      cooldown: 90, // Slow Fire Rate
      hp: 400, 
      color: 'bg-red-600', 
      canvasColor: '#dc2626', 
      icon: Shield, 
      desc: 'High DMG, Short Rng' 
  },
  VPN: { 
      name: 'VPN Gateway', 
      cost: 300, 
      range: 50,    // Wide Range (10 Kotak equivalent - very wide)
      damage: 10,   // Low Damage
      cooldown: 20, // Normal Fire Rate
      hp: 200, 
      color: 'bg-indigo-500', 
      canvasColor: '#6366f1', 
      icon: Globe, 
      desc: 'Long Range, Low DMG' 
  },
};

// ENEMY CONFIG
const ENEMIES_CONFIG = {
  COOKIE: { hp: 100, speed: 0.6, damage: 10, reward: 10, color: '#fbbf24', radius: 8, label: 'Bot', type: 'NORMAL' },
  SPYWARE: { hp: 180, speed: 0.8, damage: 15, reward: 20, color: '#d8b4fe', radius: 9, label: 'Spyware', type: 'DISABLER' },
  MALWARE: { hp: 450, speed: 0.4, damage: 25, reward: 35, color: '#ef4444', radius: 11, label: 'Malware', type: 'ATTACKER' },
  ROOTKIT: { hp: 1000, speed: 0.3, damage: 40, reward: 70, color: '#3b82f6', radius: 13, label: 'Rootkit', type: 'TANK' },
  DDOS: { hp: 60, speed: 1.2, damage: 5, reward: 8, color: '#06b6d4', radius: 5, label: 'DDoS', type: 'RUSHER' },
  BACKDOOR: { hp: 300, speed: 1.0, damage: 0, reward: 50, color: '#94a3b8', radius: 8, label: 'Backdoor', type: 'INFILTRATOR' },
  
  RANSOMWARE_BOSS: { hp: 6000, speed: 0.2, damage: 50, reward: 500, color: '#b91c1c', radius: 30, label: 'RANSOMWARE', type: 'BOSS' },
  
  APT_FINAL_BOSS: { 
    hp: 40000, 
    speed: 0.1, 
    damage: 300, 
    reward: 5000, 
    color: '#450a0a', 
    radius: 50, 
    label: 'FINAL BOSS', 
    type: 'BOSS' 
  },
};

interface Entity { id: number; x: number; y: number; }
interface Enemy extends Entity { hp: number; maxHp: number; speed: number; damage: number; type: keyof typeof ENEMIES_CONFIG; pathIndex: number; regen?: boolean; isBoss?: boolean; isAttacking?: boolean; targetTowerId?: number | null; radius: number; path: {x: number, y: number}[]; }
interface Tower extends Entity { type: keyof typeof TOWERS_CONFIG; range: number; damage: number; cooldown: number; lastFired: number; hp: number; maxHp: number; infectedUntil?: number; }
interface Projectile extends Entity { targetId: number; damage: number; speed: number; color: string; }
interface Particle extends Entity { vx: number; vy: number; life: number; color: string; }

const DataHunterScreen: React.FC<DataHunterScreenProps> = ({ user }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WIN' | 'LOSE'>('START');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [ram, setRam] = useState(INITIAL_RAM);
  const [privacyHealth, setPrivacyHealth] = useState(100);
  const [selectedTower, setSelectedTower] = useState<keyof typeof TOWERS_CONFIG | null>(null);
  const [isInfected, setIsInfected] = useState(false);
  const [hasUsedFreePatch, setHasUsedFreePatch] = useState(false);
  const [unlockedList, setUnlockedList] = useState<string[]>([]);
  const [waveLevel, setWaveLevel] = useState(1);
  const [bossMessage, setBossMessage] = useState<string | null>(null);
  const [backdoorActive, setBackdoorActive] = useState(false);
  
  // Use a default size initially to prevent display:none issues
  const [boardSize, setBoardSize] = useState(300); 
  
  // Achievement UI States
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{title: string, icon: string} | null>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameScaleRef = useRef<number>(1);
  
  const enemiesRef = useRef<Enemy[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const privacyHealthRef = useRef<number>(100); 
  const serverLastFiredRef = useRef<number>(0);
  
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const reqRef = useRef<number>(0);
  const infectionEndTimeRef = useRef<number>(0);
  const lastDamageTickRef = useRef<number>(0);
  const lastBossMinuteRef = useRef<number>(-1);
  const spawnCounterRef = useRef<number>(0);

  // Load Achievements
  useEffect(() => {
     const saved = JSON.parse(localStorage.getItem('achievements_datahunter') || '[]');
     setUnlockedList(saved);
  }, []);

  const unlock = (id: string) => {
     if (!unlockedList.includes(id)) {
        const newList = [...unlockedList, id];
        setUnlockedList(newList);
        localStorage.setItem('achievements_datahunter', JSON.stringify(newList));
        
        const ach = DH_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
            setAchievementToast({ title: ach.title, icon: ach.icon });
            setTimeout(() => setAchievementToast(null), 3000);
        }
     }
  };

  const calculateAndSetBoardSize = () => {
    if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
            // Force square aspect ratio
            const size = Math.floor(Math.min(clientWidth, clientHeight) - 24);
            if (size > 0) {
                setBoardSize(size);
                gameScaleRef.current = size / BASE_DIMENSION;
            }
        }
    }
  };

  // Handle Resize
  useEffect(() => {
    // Initial calculation
    calculateAndSetBoardSize();
    // Fallback using window resize
    window.addEventListener('resize', calculateAndSetBoardSize);

    // Advanced ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" error
        window.requestAnimationFrame(() => {
            if (!Array.isArray(entries) || !entries.length) return;
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                const size = Math.floor(Math.min(width, height) - 24);
                if (size > 0) {
                    setBoardSize(size);
                    gameScaleRef.current = size / BASE_DIMENSION;
                }
            }
        });
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => {
        window.removeEventListener('resize', calculateAndSetBoardSize);
        resizeObserver.disconnect();
    };
  }, []);

  // Force recalculate when game starts to ensure correct size
  useEffect(() => {
    if (gameState === 'PLAYING') {
        setTimeout(calculateAndSetBoardSize, 100);
    }
  }, [gameState]);

  const startGame = () => {
    setGameState('PLAYING');
    setTimeLeft(GAME_DURATION);
    setRam(INITIAL_RAM);
    setPrivacyHealth(100);
    privacyHealthRef.current = 100;
    serverLastFiredRef.current = 0; 
    setHasUsedFreePatch(false);
    setWaveLevel(1);
    enemiesRef.current = [];
    towersRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    frameRef.current = 0;
    lastSpawnRef.current = 0;
    infectionEndTimeRef.current = 0;
    lastBossMinuteRef.current = -1;
    spawnCounterRef.current = 0;
    setIsInfected(false);
    setBossMessage(null);
    setBackdoorActive(false);
    
    // Force layout update
    setTimeout(calculateAndSetBoardSize, 50);
  };

  const handleEndGame = (result: 'WIN' | 'LOSE') => {
      setGameState(result);
      if (result === 'WIN') {
          const currentHigh = parseInt(localStorage.getItem('highscore_data_hunter') || '0');
          if (ram > currentHigh) {
              localStorage.setItem('highscore_data_hunter', ram.toString());
          }
          if (privacyHealthRef.current === 100) unlock('dh_untouchable');
          if (timeLeft < 300) unlock('dh_survivor');
          if (bossMessage && bossMessage.includes('APT')) unlock('dh_legend');
      }
      cancelAnimationFrame(reqRef.current);
  };

  const toPx = (val: number, dimension: number) => (val / 100) * dimension;

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i;
        const x_i = x + radius * Math.cos(angle);
        const y_i = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x_i, y_i);
        else ctx.lineTo(x_i, y_i);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 * gameScaleRef.current;
    ctx.stroke();
  };

  // --- GAME LOOP ---
  const gameLoop = () => {
    if (gameState !== 'PLAYING') return;

    frameRef.current++;
    const now = Date.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Safety check
    if (width === 0 || height === 0) return;

    const scale = gameScaleRef.current;

    ctx.clearRect(0, 0, width, height);

    // 1. SPAWN
    const currentSpawnRate = Math.max(150, SPAWN_INTERVAL_MS - (waveLevel * 20));
    if (now - lastSpawnRef.current > currentSpawnRate) {
        spawnEnemy(width, height);
        lastSpawnRef.current = now;
    }

    const hasBackdoor = enemiesRef.current.some(e => e.type === 'BACKDOOR');
    if (hasBackdoor !== backdoorActive) setBackdoorActive(hasBackdoor);

    // SERVER ATTACK LOGIC
    const serverPxX = toPx(SERVER_POS.x, width);
    const serverPxY = toPx(SERVER_POS.y, height);
    const serverCooldownMs = SERVER_DEFENSE.cooldown * 1000;
    
    // Draw Server Cooldown Ring
    const timeSinceFire = now - serverLastFiredRef.current;
    const cooldownProgress = Math.min(1, timeSinceFire / serverCooldownMs);
    const ringRadius = 35 * scale;
    
    ctx.beginPath();
    ctx.arc(serverPxX, serverPxY, ringRadius, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * cooldownProgress));
    ctx.strokeStyle = cooldownProgress >= 1 ? '#10b981' : '#64748b'; 
    ctx.lineWidth = 3 * scale;
    ctx.stroke();

    if (timeSinceFire > serverCooldownMs) {
        let target: Enemy | null = null;
        let minDist = Infinity;
        const defenseRangePx = SERVER_DEFENSE.range * scale;

        for (const enemy of enemiesRef.current) {
            const dx = enemy.x - serverPxX;
            const dy = enemy.y - serverPxY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= defenseRangePx && dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }

        if (target) {
            serverLastFiredRef.current = now;
            projectilesRef.current.push({
                id: Math.random(),
                x: serverPxX,
                y: serverPxY,
                targetId: target.id,
                damage: SERVER_DEFENSE.damage,
                speed: 20 * scale,
                color: '#10b981'
            });
            
            // Visual pulse
            ctx.beginPath();
            ctx.arc(serverPxX, serverPxY, ringRadius + 10*scale, 0, Math.PI * 2);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
        }
    }


    // 2. TOWERS
    towersRef.current.forEach(tower => {
       const isTowerInfected = tower.infectedUntil ? now < tower.infectedUntil : false;
       const towerRadius = 10 * scale;

       if (isTowerInfected) {
           ctx.beginPath();
           ctx.arc(tower.x, tower.y, towerRadius * 1.5, 0, Math.PI * 2);
           ctx.strokeStyle = '#c084fc';
           ctx.lineWidth = 3 * scale;
           ctx.stroke();
       } else if (tower.type !== 'OLD_WALL' && now - tower.lastFired > (tower.cooldown * 1000 / 60)) {
           let target: Enemy | null = null;
           let minDist = Infinity;

           for (const enemy of enemiesRef.current) {
               const dx = enemy.x - tower.x;
               const dy = enemy.y - tower.y;
               const dist = Math.sqrt(dx*dx + dy*dy);
               const pxRange = toPx(tower.range, width);

               if (dist <= pxRange && dist < minDist) {
                   minDist = dist;
                   target = enemy;
               }
           }

           if (target) {
               tower.lastFired = now;
               projectilesRef.current.push({
                   id: Math.random(),
                   x: tower.x,
                   y: tower.y,
                   targetId: target.id,
                   damage: tower.damage,
                   speed: 15 * scale,
                   color: TOWERS_CONFIG[tower.type].canvasColor
               });
           }
       }

       // DRAW TOWER
       const baseSize = 24 * scale;
       ctx.fillStyle = '#1e293b'; 
       ctx.beginPath();
       ctx.roundRect(tower.x - (baseSize/2), tower.y - (baseSize/2), baseSize, baseSize, 4 * scale);
       ctx.fill();

       ctx.beginPath();
       if (tower.type === 'OLD_WALL') {
           ctx.fillStyle = TOWERS_CONFIG[tower.type].canvasColor;
           ctx.fillRect(tower.x - 10*scale, tower.y - 10*scale, 20*scale, 20*scale);
           
           ctx.strokeStyle = '#292524';
           ctx.lineWidth = 1 * scale;
           // Brick pattern logic same as before...
           ctx.beginPath();
           ctx.moveTo(tower.x - 10*scale, tower.y - 3*scale);
           ctx.lineTo(tower.x + 10*scale, tower.y - 3*scale);
           ctx.moveTo(tower.x - 10*scale, tower.y + 4*scale);
           ctx.lineTo(tower.x + 10*scale, tower.y + 4*scale);
           ctx.stroke();

       } else if (tower.type === 'FIRMWARE') {
           ctx.rect(tower.x - 8*scale, tower.y - 8*scale, 16*scale, 16*scale);
           ctx.fillStyle = TOWERS_CONFIG[tower.type].canvasColor;
           ctx.fill();
           ctx.fillStyle = '#cbd5e1';
           ctx.fillRect(tower.x - 4*scale, tower.y - 4*scale, 8*scale, 8*scale);
       } else {
           ctx.arc(tower.x, tower.y, towerRadius, 0, Math.PI * 2);
           ctx.fillStyle = TOWERS_CONFIG[tower.type].canvasColor;
           ctx.fill();
       }
       
       if (tower.type !== 'OLD_WALL') {
           ctx.strokeStyle = 'white';
           ctx.lineWidth = 1.5 * scale;
           ctx.stroke();
       }

       const hpPercent = Math.max(0, tower.hp / tower.maxHp);
       const barW = 20 * scale;
       const barH = 3 * scale;
       ctx.fillStyle = 'red';
       ctx.fillRect(tower.x - (barW/2), tower.y - (towerRadius + barH + 5*scale), barW, barH);
       ctx.fillStyle = '#10b981';
       ctx.fillRect(tower.x - (barW/2), tower.y - (towerRadius + barH + 5*scale), barW * hpPercent, barH);
    });

    // 3. PROJECTILES
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        const target = enemiesRef.current.find(e => e.id === proj.targetId);

        if (target) {
            const dx = target.x - proj.x;
            const dy = target.y - proj.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const hitDist = (target.speed + proj.speed) * 1.5;

            if (dist < hitDist) {
                target.hp -= proj.damage;
                projectilesRef.current.splice(i, 1);
                
                for(let k=0; k<3; k++) {
                    particlesRef.current.push({
                        id: Math.random(),
                        x: target.x, y: target.y,
                        vx: (Math.random() - 0.5) * 5 * scale,
                        vy: (Math.random() - 0.5) * 5 * scale,
                        life: 1.0, color: proj.color
                    });
                }
            } else {
                const angle = Math.atan2(dy, dx);
                proj.x += Math.cos(angle) * proj.speed;
                proj.y += Math.sin(angle) * proj.speed;

                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 4 * scale, 0, Math.PI * 2);
                ctx.fillStyle = proj.color;
                ctx.fill();
            }
        } else {
            projectilesRef.current.splice(i, 1);
        }
    }

    // 4. ENEMIES
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        const r = enemy.radius * scale;

        if (enemy.isBoss) {
            drawHexagon(ctx, enemy.x, enemy.y, r, ENEMIES_CONFIG[enemy.type].color);
        } else {
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
            ctx.fillStyle = ENEMIES_CONFIG[enemy.type].color;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1 * scale;
            ctx.stroke();
        }

        const barW = 24 * scale;
        const barH = 4 * scale;
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x - (barW/2), enemy.y - r - barH - (2*scale), barW, barH);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(enemy.x - (barW/2), enemy.y - r - barH - (2*scale), barW * Math.max(0, (enemy.hp / enemy.maxHp)), barH);

        if (enemy.hp <= 0) {
            setRam(prev => prev + ENEMIES_CONFIG[enemy.type].reward);
            enemiesRef.current.splice(i, 1);
            if (!user.name.includes("Dev")) unlock('dh_firstkill'); 
            continue;
        }

        // ATTACK TOWER
        let attackingTower = false;
        if (enemy.type !== 'BACKDOOR') {
            const attackRange = 60 * scale; 
            for(let tIdx = 0; tIdx < towersRef.current.length; tIdx++) {
                const tower = towersRef.current[tIdx];
                const dx = tower.x - enemy.x;
                const dy = tower.y - enemy.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < attackRange) {
                    attackingTower = true;
                    
                    ctx.beginPath();
                    ctx.moveTo(enemy.x, enemy.y);
                    ctx.lineTo(tower.x, tower.y);
                    ctx.strokeStyle = enemy.type === 'SPYWARE' ? '#c084fc' : '#ef4444'; 
                    ctx.lineWidth = 3 * scale;
                    ctx.stroke();

                    if (frameRef.current % 60 === 0) { 
                        if (enemy.type === 'SPYWARE') {
                             tower.infectedUntil = now + 2000;
                        } else {
                             tower.hp -= enemy.damage;
                             particlesRef.current.push({
                                id: Math.random(), x: tower.x, y: tower.y, vx: 0, vy: -2 * scale, life: 0.5, color: 'red'
                             });
                        }
                        
                        if (tower.hp <= 0) towersRef.current.splice(tIdx, 1);
                    }
                    break; 
                }
            }
        }

        // MOVEMENT
        if (!attackingTower) {
            const targetP = enemy.path[enemy.pathIndex];
            if (!targetP) continue;
            
            const tx = toPx(targetP.x, width);
            const ty = toPx(targetP.y, height);
            
            const dx = tx - enemy.x;
            const dy = ty - enemy.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 5 * scale) {
                if (enemy.pathIndex < enemy.path.length - 1) {
                    enemy.pathIndex++;
                } else {
                    // REACHED SERVER
                    if (enemy.type === 'BACKDOOR') {
                        infectionEndTimeRef.current = now + 2000;
                        setIsInfected(true);
                        enemiesRef.current.splice(i, 1);
                    } else {
                        const damage = Math.max(5, enemy.damage);
                        privacyHealthRef.current = Math.max(0, privacyHealthRef.current - damage);
                        setPrivacyHealth(privacyHealthRef.current);
                        
                        if (privacyHealthRef.current <= 0) {
                             handleEndGame('LOSE');
                             return; 
                        }

                        for(let k=0; k<15; k++) {
                            particlesRef.current.push({
                                id: Math.random(),
                                x: enemy.x, y: enemy.y,
                                vx: (Math.random() - 0.5)*15*scale, vy: (Math.random() - 0.5)*15*scale,
                                life: 1.0, color: 'red'
                            });
                        }
                        enemiesRef.current.splice(i, 1);
                    }
                    continue;
                }
            } else {
                const angle = Math.atan2(dy, dx);
                const moveSpeed = enemy.speed * (width / BASE_DIMENSION * 1.5); 
                enemy.x += Math.cos(angle) * moveSpeed;
                enemy.y += Math.sin(angle) * moveSpeed;
            }
        }
    }

    // 5. SERVER INFECTION
    if (now < infectionEndTimeRef.current) {
        setIsInfected(true);
        if (now - lastDamageTickRef.current > 500) {
             setRam(r => Math.max(0, r - 10));
             privacyHealthRef.current = Math.max(0, privacyHealthRef.current - 2);
             setPrivacyHealth(privacyHealthRef.current);
             if (privacyHealthRef.current <= 0) handleEndGame('LOSE');
             
             lastDamageTickRef.current = now;
        }
        
        const sx = toPx(SERVER_POS.x, width);
        const sy = toPx(SERVER_POS.y, height);
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.8})`;
        ctx.font = `bold ${24 * scale}px monospace`;
        ctx.fillText("SYSTEM COMPROMISED!", sx - (90*scale), sy - (60*scale));
    } else {
        setIsInfected(false);
    }

    // 6. PARTICLES
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // 7. GHOST TOWER
    const config = selectedTower ? TOWERS_CONFIG[selectedTower] : null;
    let isValidPreview = false;
    
    if (config && mousePos.x > 0 && mousePos.y > 0) {
        const collisionRadius = 20 * scale; 
        const tooClose = towersRef.current.some(t => {
            const dx = t.x - mousePos.x;
            const dy = t.y - mousePos.y;
            return Math.sqrt(dx*dx + dy*dy) < collisionRadius * 1.5;
        });
        isValidPreview = !tooClose && ram >= config.cost;

        const rangePx = toPx(config.range, width);
        const radiusPx = 10 * scale;
        
        if (config.range > 0) {
            ctx.beginPath();
            ctx.arc(mousePos.x, mousePos.y, rangePx, 0, Math.PI * 2);
            ctx.fillStyle = isValidPreview ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            ctx.fill();
            ctx.strokeStyle = isValidPreview ? '#10b981' : '#ef4444';
            ctx.lineWidth = 1 * scale;
            ctx.stroke();
        }

        ctx.beginPath();
        if (selectedTower === 'OLD_WALL') {
            ctx.rect(mousePos.x - 10*scale, mousePos.y - 10*scale, 20*scale, 20*scale);
        } else {
            ctx.arc(mousePos.x, mousePos.y, radiusPx, 0, Math.PI * 2);
        }
        ctx.fillStyle = isValidPreview ? config.canvasColor : '#ef4444';
        ctx.fill();
    }

    reqRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      reqRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [gameState]); 

  // Timer
  useEffect(() => {
    let timer: number;
    if (gameState === 'PLAYING') {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                handleEndGame('WIN');
                return 0;
            }
            const elapsed = GAME_DURATION - prev;
            if (elapsed > 60 && waveLevel === 1) setWaveLevel(2);
            if (elapsed > 180 && waveLevel === 2) setWaveLevel(3);
            if (elapsed > 300 && waveLevel === 3) setWaveLevel(4);
            if (elapsed > 500 && waveLevel === 4) setWaveLevel(5);
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, waveLevel]);

  const spawnEnemy = (w: number, h: number) => {
     spawnCounterRef.current += 1;
     const rand = Math.random();
     let type: keyof typeof ENEMIES_CONFIG = 'COOKIE';
     
     if (spawnCounterRef.current % 5 === 0) {
         type = 'BACKDOOR';
     } else {
         if (waveLevel === 1) {
             if (rand > 0.8) type = 'SPYWARE';
             else if (rand > 0.6) type = 'COOKIE';
             else type = 'DDOS';
         } else if (waveLevel === 2) {
             if (rand > 0.85) type = 'MALWARE';
             else if (rand > 0.7) type = 'SPYWARE';
             else if (rand > 0.5) type = 'BACKDOOR';
             else type = 'COOKIE';
         } else if (waveLevel >= 3) {
             if (rand > 0.9) type = 'ROOTKIT';
             else if (rand > 0.75) type = 'MALWARE';
             else if (rand > 0.6) type = 'SPYWARE';
             else if (rand > 0.4) type = 'BACKDOOR';
             else type = 'DDOS';
         }
     }

     const elapsedMinutes = Math.floor((GAME_DURATION - timeLeft) / 60);
     if (elapsedMinutes === 5 && lastBossMinuteRef.current !== 5) {
         type = 'RANSOMWARE_BOSS';
         lastBossMinuteRef.current = 5;
         setBossMessage("PERINGATAN: RANSOMWARE BOSS DATANG!");
     } else if (elapsedMinutes === 9 && lastBossMinuteRef.current !== 9) {
         type = 'APT_FINAL_BOSS'; 
         lastBossMinuteRef.current = 9;
         setBossMessage("BAHAYA KRITIS: APT FINAL BOSS MENDEKAT!");
     }

     const pathIdx = Math.floor(Math.random() * PATHS.length);
     const selectedPath = PATHS[pathIdx];

     const config = ENEMIES_CONFIG[type];
     const hpMultiplier = 1 + ((waveLevel - 1) * 0.35);

     enemiesRef.current.push({
         id: Math.random(),
         x: toPx(selectedPath[0].x, w),
         y: toPx(selectedPath[0].y, h),
         hp: config.hp * hpMultiplier,
         maxHp: config.hp * hpMultiplier,
         speed: config.speed, 
         damage: config.damage,
         type: type,
         pathIndex: 0,
         isBoss: type.includes('BOSS'),
         radius: config.radius,
         path: selectedPath
     });
  };

  const handlePointerMove = (x: number, y: number) => {
     if (gameState !== 'PLAYING' || !selectedTower || !canvasRef.current) return;
     setMousePos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if(!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      handlePointerMove(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if(!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      handlePointerMove(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const checkPlacementValidity = (x: number, y: number) => {
     if (!selectedTower) return false;
     const config = TOWERS_CONFIG[selectedTower];
     if (ram < config.cost) return false;

     const scale = gameScaleRef.current;
     const collisionRadius = 20 * scale; 
     const tooClose = towersRef.current.some(t => {
         const dx = t.x - x;
         const dy = t.y - y;
         return Math.sqrt(dx*dx + dy*dy) < collisionRadius * 1.5;
     });
     return !tooClose;
  };

  const handlePlacement = (x: number, y: number) => {
      if (gameState !== 'PLAYING' || !selectedTower) return;

      if (checkPlacementValidity(x, y)) {
          const config = TOWERS_CONFIG[selectedTower];
          const newTower: Tower = {
              id: Math.random(),
              x, y,
              type: selectedTower,
              range: config.range,
              damage: config.damage,
              cooldown: config.cooldown,
              lastFired: 0,
              hp: config.hp,
              maxHp: config.hp
          };
          towersRef.current.push(newTower);
          setRam(prev => prev - config.cost);
          
          if (towersRef.current.length >= 8) unlock('dh_fortress');
          if (selectedTower === 'VPN') unlock('dh_sniper');
          if (towersRef.current.filter(t => t.type === 'FIREWALL').length >= 5) unlock('dh_firewall');
          
          setSelectedTower(null);
          setMousePos({ x: 0, y: 0 });
      }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      if(!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      handlePlacement(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if(!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.changedTouches[0];
      handlePlacement(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handlePremiumPatch = () => {
      if (ram >= 500) {
          setRam(prev => prev - 500);
          setPrivacyHealth(prev => Math.min(100, prev + 50)); 
          privacyHealthRef.current = Math.min(100, privacyHealthRef.current + 50); 
          unlock('dh_patcher');
      }
  };

  const handleFreePatch = () => {
      if (!hasUsedFreePatch) {
          setHasUsedFreePatch(true);
          setPrivacyHealth(prev => Math.min(100, prev + 20)); 
          privacyHealthRef.current = Math.min(100, privacyHealthRef.current + 20); 
      }
  };

  // --- START SCREEN ---
  if (gameState === 'START') {
      return (
        <div className="h-[calc(100dvh-140px)] md:h-[90vh] flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-black"></div>
            
            <div className="relative z-10 text-center max-w-lg p-6 animate-fade-in-up">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-pulse">
                    <Database className="w-12 h-12 text-blue-400" />
                </div>
                <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">NET DEFENSE</h1>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                    Lindungi Server Sekolah dari serangan Malware, Ransomware, dan Spyware. 
                    <br/><span className="text-red-400 font-bold">PERINGATAN:</span> Musuh dapat menyerang & menghancurkan Tower!
                </p>
                
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                    <Play className="w-5 h-5" /> MULAI MISI
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-140px)] md:h-[90vh] bg-slate-950 text-white font-mono overflow-hidden">
        
        {/* ACHIEVEMENT TOAST */}
        {achievementToast && (
            <div className="fixed top-20 right-4 z-[100] animate-fade-in-up">
                <div className="bg-emerald-600 rounded-full shadow-2xl border-4 border-emerald-500/50 p-2 pr-8 flex items-center gap-4 max-w-sm transform transition-all hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-inner border-2 border-white/50">
                        <span className="text-2xl drop-shadow-sm">{achievementToast.icon}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                        <h4 className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Yey, kamu mendapatkan Achievement</h4>
                        <span className="text-white font-black text-sm md:text-base leading-none drop-shadow-md">{achievementToast.title}</span>
                    </div>
                </div>
            </div>
        )}

        {/* ACHIEVEMENT MODAL */}
        {showAchievements && (
            <div className="absolute inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
                    <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-yellow-500 font-bold">
                            <Trophy className="w-5 h-5" /> ACHIEVEMENTS
                        </div>
                        <button onClick={() => setShowAchievements(false)} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
                        {DH_ACHIEVEMENTS.map((ach) => {
                            const isUnlocked = unlockedList.includes(ach.id);
                            return (
                                <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                    isUnlocked 
                                    ? 'bg-yellow-900/20 border-yellow-600/50 shadow-inner' 
                                    : 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                                }`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                        isUnlocked ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'
                                    }`}>
                                        {ach.icon}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-sm ${isUnlocked ? 'text-yellow-400' : 'text-slate-500'}`}>{ach.title}</div>
                                        <div className="text-[10px] text-slate-400 leading-tight">{ach.description}</div>
                                    </div>
                                    {isUnlocked && <Star className="w-4 h-4 text-yellow-500 ml-auto" fill="currentColor" />}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* --- LEFT SIDEBAR (DESKTOP) / BOTTOM BAR (MOBILE) --- */}
        <div className="order-last md:order-first w-full md:w-72 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex flex-row md:flex-col z-20 shadow-xl overflow-x-auto md:overflow-y-auto no-scrollbar md:custom-scrollbar flex-shrink-0">
            
            {/* Sidebar Header (Desktop Only) */}
            <div className="hidden md:block p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-blue-400 font-bold text-sm tracking-widest flex items-center gap-2">
                    <Crosshair className="w-4 h-4" /> NET DEFENSE
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Lite</p>
            </div>

            {/* Towers Container */}
            <div className="flex flex-row md:flex-col gap-2 p-2 md:p-4 min-w-max md:min-w-0">
                {Object.entries(TOWERS_CONFIG).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedTower(key as any)}
                        className={`group relative flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl border transition-all duration-300 w-20 md:w-full ${
                            selectedTower === key 
                            ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                        } ${ram < config.cost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                         {/* Icon Box */}
                         <div className={`p-2 rounded-lg ${config.color} shadow-lg shrink-0`}>
                             <config.icon className="w-5 h-5 text-white" />
                         </div>

                         {/* Info (Desktop) */}
                         <div className="hidden md:block text-left flex-1 min-w-0">
                             <div className="text-sm font-bold text-white group-hover:text-blue-200 truncate">{config.name}</div>
                             <div className="text-[10px] text-slate-400 mb-1">{config.desc}</div>
                             <div className="flex items-center gap-1 text-xs font-mono text-blue-300">
                                 <Zap className="w-3 h-3" /> {config.cost} RAM
                             </div>
                         </div>

                         {/* Info (Mobile - Compact) */}
                         <div className="block md:hidden text-center w-full">
                             <div className="text-[9px] font-bold text-blue-300">{config.cost}</div>
                         </div>
                    </button>
                ))}
                
                {/* Premium Patch Button */}
                <button
                    onClick={handlePremiumPatch}
                    disabled={ram < 500}
                    className="group relative flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl border border-yellow-900/50 bg-yellow-900/10 hover:bg-yellow-900/30 transition-all w-20 md:w-full disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-2 rounded-lg bg-yellow-800 shadow-lg shrink-0 text-yellow-200">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    
                    <div className="hidden md:block text-left flex-1 min-w-0">
                        <div className="text-sm font-bold text-yellow-400">Premium Patch</div>
                        <div className="text-[10px] text-yellow-600/80 mb-1">Heal +50% HP</div>
                        <div className="text-xs font-mono text-yellow-500">500 RAM</div>
                    </div>

                    <div className="block md:hidden text-center w-full">
                        <div className="text-[9px] font-bold text-yellow-500">500</div>
                    </div>
                </button>

                {/* Free Patch Button */}
                <button
                    onClick={handleFreePatch}
                    disabled={hasUsedFreePatch}
                    className="group relative flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl border border-green-900/50 bg-green-900/10 hover:bg-green-900/30 transition-all w-20 md:w-full disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-2 rounded-lg bg-green-800 shadow-lg shrink-0 text-green-200">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    
                    <div className="hidden md:block text-left flex-1 min-w-0">
                        <div className="text-sm font-bold text-green-400">Free Patch</div>
                        <div className="text-[10px] text-green-600/80 mb-1">{hasUsedFreePatch ? 'Used' : 'Heal +20% HP'}</div>
                        <div className="text-xs font-mono text-green-500">0 RAM</div>
                    </div>

                    <div className="block md:hidden text-center w-full">
                        <div className="text-[9px] font-bold text-green-500">FREE</div>
                    </div>
                </button>
            </div>
        </div>

        {/* --- MAIN GAME AREA --- */}
        <div className="flex-1 relative overflow-hidden flex flex-col h-full bg-slate-950 min-w-0">
            
            {/* TOP HUD (Floating) */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10 pointer-events-none">
                <div className="flex gap-2">
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-xl shadow-lg flex items-center gap-3 min-w-[100px]">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <Database className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold">RAM AVAILABLE</div>
                            <div className="text-lg font-bold text-blue-300 font-mono">{ram}</div>
                        </div>
                    </div>
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-xl shadow-lg flex items-center gap-3 min-w-[100px]">
                        <div className={`p-1.5 rounded-lg ${isInfected ? 'bg-red-500/20 animate-pulse' : 'bg-emerald-500/20'}`}>
                            <Activity className={`w-4 h-4 ${isInfected ? 'text-red-500' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold">SERVER HEALTH</div>
                            <div className={`text-lg font-bold font-mono ${privacyHealth < 30 ? 'text-red-500' : 'text-emerald-300'}`}>
                                {Math.round(privacyHealth)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <button 
                        onClick={() => setShowAchievements(true)}
                        className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur border border-yellow-600/50 p-2 rounded-xl shadow-lg flex items-center justify-center group"
                        title="Achievements"
                    >
                        <Trophy className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2 rounded-xl shadow-lg text-center pointer-events-none">
                        <div className="text-[10px] text-slate-500 font-bold">TIME REMAINING</div>
                        <div className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </div>

            {/* CANVAS LAYER with Square Container Wrapper */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 bg-slate-950" ref={containerRef}>
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                {/* Game Board Wrapper (Square) */}
                <div 
                    style={{ width: boardSize, height: boardSize }} 
                    className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/30 backdrop-blur-sm z-0"
                >
                    <canvas 
                        ref={canvasRef}
                        width={boardSize}
                        height={boardSize}
                        onClick={handleCanvasClick}
                        onMouseMove={handleMouseMove}
                        onTouchStart={(e) => {}}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ touchAction: 'none' }}
                        className="block cursor-crosshair relative z-0 w-full h-full"
                    />

                    {/* OVERLAYS (Now strictly positioned relative to the square board) */}
                    <div className="absolute inset-0 pointer-events-none">
                         {/* Server Icon */}
                         <div style={{ position: 'absolute', left: `${SERVER_POS.x}%`, top: `${SERVER_POS.y}%`, transform: 'translate(-50%, -50%)' }}>
                             <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 ${isInfected ? 'bg-red-900 border-4 border-red-500 animate-pulse scale-110' : 'bg-slate-800 border-2 border-emerald-500'}`}>
                                 <Server className={`w-6 h-6 md:w-8 md:h-8 ${isInfected ? 'text-red-200' : 'text-emerald-400'}`} />
                             </div>
                         </div>

                         {/* Backdoor Indicator */}
                         <div style={{ position: 'absolute', left: '50%', top: '5%', transform: 'translate(-50%, -50%)' }}>
                             {backdoorActive ? (
                                 <div className="bg-red-900/90 px-4 py-2 rounded-full border border-red-500 animate-bounce shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center gap-2">
                                    <Skull className="w-4 h-4 text-white" />
                                    <span className="text-xs font-bold text-white tracking-widest">BACKDOOR OPEN</span>
                                 </div>
                             ) : (
                                 <div className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 opacity-50">
                                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">SECURE</span>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            {/* BOSS NOTIFICATION (Overlay) */}
            {bossMessage && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-red-600 text-white px-8 py-6 rounded-3xl border-4 border-red-400 shadow-[0_0_60px_rgba(220,38,38,0.8)] animate-pulse flex flex-col items-center text-center">
                        <AlertTriangle className="w-16 h-16 text-yellow-300 mb-2" />
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">WARNING</h2>
                        <p className="text-xl md:text-2xl font-bold mt-2 text-red-100">{bossMessage}</p>
                    </div>
                </div>
            )}
            
            {/* GAME OVER / WIN MODAL */}
            {(gameState === 'WIN' || gameState === 'LOSE') && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 text-center shadow-2xl max-w-md w-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        
                        {gameState === 'WIN' ? (
                            <div className="mb-6">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <Shield className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-2">VICTORY</h2>
                                <p className="text-slate-400">Server berhasil diamankan dari serangan siber.</p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-2">SYSTEM FAILURE</h2>
                                <p className="text-slate-400">Malware berhasil mengambil alih root access.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-800 p-3 rounded-xl">
                                <div className="text-xs text-slate-500 font-bold uppercase">Final RAM</div>
                                <div className="text-xl font-mono font-bold text-blue-400">{ram}</div>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-xl">
                                <div className="text-xs text-slate-500 font-bold uppercase">Health</div>
                                <div className={`text-xl font-mono font-bold ${privacyHealth > 0 ? 'text-emerald-400' : 'text-red-500'}`}>{Math.round(privacyHealth)}%</div>
                            </div>
                        </div>

                        <button onClick={startGame} className="w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all active:scale-95 shadow-lg">
                            RESTART SYSTEM
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default DataHunterScreen;
