import { useState, useCallback, useEffect, useRef } from "react";

const PHASE_NAMES = ["사건", "계획", "실행", "수익", "유지"];
const PHASE_EN = ["EVENT", "PLAN", "EXECUTE", "INCOME", "MAINTENANCE"];
const PHASE_DESC = [
  "이벤트 카드를 공개합니다",
  "행동 카드 2장을 선택하세요 (블라인드)",
  "선택한 행동을 순서대로 실행합니다",
  "장악 구역에서 자원을 수령합니다",
  "조직원 급여와 거점 유지비를 지불합니다",
];

const PLAYER_COLORS = ["#ff003c", "#00e5ff", "#b4ff39", "#ff9100"];
const PLAYER_NAMES = ["GHOST α", "GHOST β", "GHOST γ", "GHOST δ"];
const PLAYER_GLOWS = [
  "0 0 20px #ff003c55", "0 0 20px #00e5ff55",
  "0 0 20px #b4ff3955", "0 0 20px #ff910055",
];

const ZONE_TYPES = [
  { id: "market", name: "마켓", icon: "💰", resource: "credit", color: "#ffd700" },
  { id: "slum", name: "슬럼", icon: "👥", resource: "operative", color: "#ff6b6b" },
  { id: "datahub", name: "데이터허브", icon: "🔍", resource: "intel", color: "#4ecdc4" },
  { id: "armory", name: "무기고", icon: "🔫", resource: "arms", color: "#a855f7" },
  { id: "nexus", name: "넥서스", icon: "⚡", resource: "all", color: "#fff" },
];

const EVENTS = [
  { title: "Bloc 단속", desc: "각 플레이어 Credit -2", effect: (p) => ({ ...p, credit: Math.max(0, p.credit - 2) }) },
  { title: "무기 밀수선", desc: "현재 플레이어 Arms +3", effect: (p, isCurrent) => isCurrent ? { ...p, arms: p.arms + 3 } : p },
  { title: "메시 폭풍", desc: "데이터허브 구역 수익 2배 (이번 라운드)", effect: (p) => p, global: "meshStorm" },
  { title: "조직원 반란", desc: "가장 많은 Operative 보유자 -2", effect: (p, _, isMax) => isMax ? { ...p, operative: Math.max(0, p.operative - 2) } : p, checkMax: "operative" },
  { title: "정보 유출", desc: "모든 플레이어 Intel +1", effect: (p) => ({ ...p, intel: p.intel + 1 }) },
  { title: "Veil 붕괴", desc: "넥서스 인접 구역 방어력 -1", effect: (p) => p, global: "veilDown" },
  { title: "용병 시장", desc: "Operative 모집 비용 절반 (이번 라운드)", effect: (p) => p, global: "cheapHire" },
  { title: "Bloc 보복", desc: "가장 많은 구역 보유자 Credit -4", effect: (p, _, isMax) => isMax ? { ...p, credit: Math.max(0, p.credit - 4) } : p, checkMax: "zones" },
  { title: "암시장 호황", desc: "모든 플레이어 Credit +2", effect: (p) => ({ ...p, credit: p.credit + 2 }) },
  { title: "Cortex Wire 오류", desc: "현재 플레이어를 제외한 모든 플레이어 Intel -1", effect: (p, isCurrent) => isCurrent ? p : { ...p, intel: Math.max(0, p.intel - 1) } },
];

const ACTIONS = [
  { id: "raid", name: "습격", icon: "⚔️", desc: "적 구역을 공격 (Arms 2 소모)", cost: { arms: 2 } },
  { id: "fortify", name: "방어 강화", icon: "🛡️", desc: "내 구역 방어력 +2 (Credit 2 소모)", cost: { credit: 2 } },
  { id: "recruit", name: "모집", icon: "👥", desc: "Operative +2 (Credit 3 소모)", cost: { credit: 3 }, gain: { operative: 2 } },
  { id: "hack", name: "메시 침투", icon: "🔓", desc: "적 Intel 2 탈취 (Intel 1 소모)", cost: { intel: 1 } },
  { id: "trade", name: "거래", icon: "💱", desc: "자원 교환 (임의 2개 → 임의 1개)", cost: {} },
  { id: "expand", name: "확장", icon: "📍", desc: "빈 구역 점령 (Operative 2 소모)", cost: { operative: 2 } },
  { id: "sabotage", name: "공작", icon: "💣", desc: "적 구역 생산량 차단 (Intel 2 소모)", cost: { intel: 2 } },
  { id: "resupply", name: "보급", icon: "📦", desc: "Arms +2 (Credit 2 소모)", cost: { credit: 2 }, gain: { arms: 2 } },
];

const HEX_ZONES = [
  { q: 0, r: 0, type: 4 },
  { q: 1, r: 0, type: 0 }, { q: 0, r: 1, type: 1 }, { q: -1, r: 1, type: 2 },
  { q: -1, r: 0, type: 3 }, { q: 0, r: -1, type: 0 }, { q: 1, r: -1, type: 1 },
  { q: 2, r: -1, type: 2 }, { q: 2, r: 0, type: 3 }, { q: 1, r: 1, type: 0 },
  { q: 0, r: 2, type: 1 }, { q: -1, r: 2, type: 3 }, { q: -2, r: 2, type: 0 },
  { q: -2, r: 1, type: 2 }, { q: -1, r: -1, type: 1 }, { q: 0, r: -2, type: 3 },
  { q: 1, r: -2, type: 0 }, { q: 2, r: -2, type: 2 }, { q: -2, r: 0, type: 1 },
];

const hexToPixel = (q, r, size) => ({
  x: size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
  y: size * (1.5 * r),
});

const initPlayer = (i) => ({
  id: i, name: PLAYER_NAMES[i], color: PLAYER_COLORS[i],
  credit: 8, operative: 4, intel: 2, arms: 2,
  rep: 0, zones: [], selectedActions: [], nexusStreak: 0,
});

const initZones = () => HEX_ZONES.map((h, i) => ({
  ...h, idx: i, typeData: ZONE_TYPES[h.type], owner: null,
  defense: 1, sabotaged: false,
}));

export default function DeadNexusSimulator() {
  const [gameState, setGameState] = useState("menu");
  const [players, setPlayers] = useState([0, 1, 2, 3].map(initPlayer));
  const [zones, setZones] = useState(initZones());
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [log, setLog] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [winner, setWinner] = useState(null);
  const [animPhase, setAnimPhase] = useState(false);
  const logRef = useRef(null);

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev.slice(-50), { msg, t: Date.now() }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const startGame = () => {
    const z = initZones();
    [0, 1, 2, 3].forEach((pi) => {
      const corners = [1 + pi * 4, 2 + pi * 4];
      corners.forEach((ci) => {
        if (z[ci]) z[ci].owner = pi;
      });
    });
    const ps = [0, 1, 2, 3].map((i) => ({
      ...initPlayer(i),
      zones: z.filter((zn) => zn.owner === i).map((zn) => zn.idx),
    }));
    setPlayers(ps);
    setZones(z);
    setRound(1);
    setPhase(0);
    setCurrentPlayer(0);
    setGameState("playing");
    setLog([]);
    setWinner(null);
    addLog("⚡ DEAD NEXUS — 게임 시작");
    triggerEvent(ps, z);
  };

  const triggerEvent = (ps, zs) => {
    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    setCurrentEvent(evt);
    setAnimPhase(true);
    setTimeout(() => setAnimPhase(false), 600);

    let newPlayers = [...ps.map((p) => ({ ...p }))];

    if (evt.checkMax) {
      const key = evt.checkMax === "zones" ? "zones" : evt.checkMax;
      const vals = newPlayers.map((p) => key === "zones" ? p.zones.length : p[key]);
      const maxVal = Math.max(...vals);
      newPlayers = newPlayers.map((p, i) => evt.effect(p, i === 0, vals[i] === maxVal));
    } else {
      newPlayers = newPlayers.map((p, i) => evt.effect(p, i === 0));
    }

    setPlayers(newPlayers);
    addLog(`📢 사건: ${evt.title} — ${evt.desc}`);
  };

  const canAfford = (player, cost) => {
    return Object.entries(cost).every(([k, v]) => player[k] >= v);
  };

  const selectAction = (action) => {
    if (selectedActions.length >= 2) return;
    if (selectedActions.find((a) => a.id === action.id)) return;
    const p = players[currentPlayer];
    if (!canAfford(p, action.cost)) {
      addLog(`❌ ${p.name}: 자원 부족으로 ${action.name} 불가`);
      return;
    }
    setSelectedActions((prev) => [...prev, action]);
  };

  const removeAction = (idx) => {
    setSelectedActions((prev) => prev.filter((_, i) => i !== idx));
  };

  const confirmPlan = () => {
    if (selectedActions.length === 0) return;
    const p = { ...players[currentPlayer] };
    addLog(`📋 ${p.name}: 행동 ${selectedActions.map((a) => a.name).join(", ")} 선택`);

    const newPlayers = [...players];
    newPlayers[currentPlayer] = { ...p, selectedActions: [...selectedActions] };
    setPlayers(newPlayers);
    setSelectedActions([]);

    if (currentPlayer < 3) {
      setCurrentPlayer(currentPlayer + 1);
    } else {
      setPhase(2);
      setCurrentPlayer(0);
      addLog("⚔️ 실행 단계 시작");
    }
  };

  const executeActions = () => {
    const newPlayers = players.map((p) => ({ ...p }));
    const newZones = zones.map((z) => ({ ...z }));

    for (let pi = 0; pi < 4; pi++) {
      const p = newPlayers[pi];
      const actions = p.selectedActions || [];
      for (const action of actions) {
        if (!canAfford(p, action.cost)) {
          addLog(`❌ ${p.name}: ${action.name} 실행 실패 (자원 부족)`);
          continue;
        }

        Object.entries(action.cost).forEach(([k, v]) => { p[k] -= v; });

        switch (action.id) {
          case "recruit":
            p.operative += 2;
            addLog(`👥 ${p.name}: Operative +2 모집`);
            break;
          case "resupply":
            p.arms += 2;
            addLog(`📦 ${p.name}: Arms +2 보급`);
            break;
          case "expand": {
            const free = newZones.filter((z) => z.owner === null);
            if (free.length > 0) {
              const target = free[Math.floor(Math.random() * free.length)];
              target.owner = pi;
              p.zones = newZones.filter((z) => z.owner === pi).map((z) => z.idx);
              addLog(`📍 ${p.name}: ${target.typeData.name} 구역 점령`);
            }
            break;
          }
          case "raid": {
            const enemyZones = newZones.filter((z) => z.owner !== null && z.owner !== pi);
            if (enemyZones.length > 0) {
              const target = enemyZones[Math.floor(Math.random() * enemyZones.length)];
              const atkPower = Math.floor(Math.random() * 6) + 1 + Math.floor(p.arms / 2);
              const defPower = Math.floor(Math.random() * 6) + 1 + target.defense;
              if (atkPower > defPower) {
                const oldOwner = target.owner;
                target.owner = pi;
                p.zones = newZones.filter((z) => z.owner === pi).map((z) => z.idx);
                newPlayers[oldOwner].zones = newZones.filter((z) => z.owner === oldOwner).map((z) => z.idx);
                p.rep += 2;
                addLog(`⚔️ ${p.name}: ${target.typeData.name} 습격 성공! (${atkPower} vs ${defPower})`);
              } else {
                addLog(`🛡️ ${p.name}: 습격 실패 (${atkPower} vs ${defPower})`);
              }
            }
            break;
          }
          case "fortify": {
            const myZones = newZones.filter((z) => z.owner === pi);
            if (myZones.length > 0) {
              myZones.forEach((z) => { z.defense += 1; });
              addLog(`🛡️ ${p.name}: 전 구역 방어력 +1`);
            }
            break;
          }
          case "hack": {
            const targets = newPlayers.filter((_, i) => i !== pi && newPlayers[i].intel > 0);
            if (targets.length > 0) {
              const t = targets[Math.floor(Math.random() * targets.length)];
              const stolen = Math.min(2, t.intel);
              t.intel -= stolen;
              p.intel += stolen;
              addLog(`🔓 ${p.name}: ${t.name}에서 Intel ${stolen} 탈취`);
            }
            break;
          }
          case "sabotage": {
            const eZones = newZones.filter((z) => z.owner !== null && z.owner !== pi && !z.sabotaged);
            if (eZones.length > 0) {
              const t = eZones[Math.floor(Math.random() * eZones.length)];
              t.sabotaged = true;
              addLog(`💣 ${p.name}: ${newPlayers[t.owner].name}의 ${t.typeData.name} 공작 성공`);
            }
            break;
          }
          case "trade": {
            const resources = ["credit", "operative", "intel", "arms"];
            const available = resources.filter((r) => p[r] >= 2);
            if (available.length > 0) {
              const from = available[Math.floor(Math.random() * available.length)];
              const to = resources.filter((r) => r !== from)[Math.floor(Math.random() * 3)];
              p[from] -= 2;
              p[to] += 1;
              addLog(`💱 ${p.name}: ${from} 2 → ${to} 1 교환`);
            }
            break;
          }
        }
      }
      p.selectedActions = [];
    }

    setPlayers(newPlayers);
    setZones(newZones);
    setPhase(3);
    addLog("💰 수익 단계 시작");
  };

  const processIncome = () => {
    const newPlayers = players.map((p) => ({ ...p }));
    const meshStorm = currentEvent?.global === "meshStorm";

    zones.forEach((z) => {
      if (z.owner === null || z.sabotaged) return;
      const p = newPlayers[z.owner];
      const res = z.typeData.resource;
      if (res === "all") {
        p.credit += 1; p.operative += 1; p.intel += 1; p.arms += 1;
      } else {
        const amount = (meshStorm && res === "intel") ? 2 : 1;
        p[res] += amount;
      }
    });

    newPlayers.forEach((p) => {
      p.zones = zones.filter((z) => z.owner === p.id).map((z) => z.idx);
    });

    setPlayers(newPlayers);
    setPhase(4);
    addLog("🔧 유지 단계 시작");
  };

  const processMaintenance = () => {
    const newPlayers = players.map((p) => ({ ...p }));
    const newZones = zones.map((z) => ({ ...z, sabotaged: false }));

    newPlayers.forEach((p) => {
      const opCost = Math.floor(p.operative / 2);
      const zoneCost = p.zones.length;
      const totalCost = opCost + zoneCost;

      if (p.credit >= totalCost) {
        p.credit -= totalCost;
        addLog(`🔧 ${p.name}: 유지비 ${totalCost} Credit 지불`);
      } else {
        const deficit = totalCost - p.credit;
        p.credit = 0;
        p.operative = Math.max(0, p.operative - deficit);
        addLog(`⚠️ ${p.name}: 유지비 부족! Operative ${deficit} 이탈`);
      }

      if (newZones[0].owner === p.id) {
        p.nexusStreak = (p.nexusStreak || 0) + 1;
        if (p.nexusStreak >= 3) {
          setWinner(p.id);
          addLog(`🏆 ${p.name}: 넥서스 3라운드 연속 장악! 즉시 승리!`);
          setGameState("gameover");
          return;
        }
      } else {
        p.nexusStreak = 0;
      }
    });

    if (round >= 8) {
      const scores = newPlayers.map((p) => ({
        id: p.id, name: p.name,
        score: p.zones.length * 3 + p.rep + Math.floor((p.credit + p.operative + p.intel + p.arms) / 2),
      }));
      scores.sort((a, b) => b.score - a.score);
      setWinner(scores[0].id);
      addLog(`🏆 게임 종료! ${scores[0].name} 승리 (${scores[0].score}점)`);
      setGameState("gameover");
      setPlayers(newPlayers);
      setZones(newZones);
      return;
    }

    setPlayers(newPlayers);
    setZones(newZones);
    setRound(round + 1);
    setPhase(0);
    setCurrentPlayer(0);
    addLog(`━━━ 라운드 ${round + 1} 시작 ━━━`);
    triggerEvent(newPlayers, newZones);
  };

  const getScore = (p) => p.zones.length * 3 + p.rep + Math.floor((p.credit + p.operative + p.intel + p.arms) / 2);

  const hexSize = 38;
  const boardCX = 240;
  const boardCY = 200;

  const HexCell = ({ zone }) => {
    const { x, y } = hexToPixel(zone.q, zone.r, hexSize);
    const px = boardCX + x;
    const py = boardCY + y;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return `${px + hexSize * 0.9 * Math.cos(angle)},${py + hexSize * 0.9 * Math.sin(angle)}`;
    }).join(" ");

    const ownerColor = zone.owner !== null ? PLAYER_COLORS[zone.owner] : "#333";
    const isNexus = zone.type === 4;

    return (
      <g onClick={() => setSelectedZone(zone.idx)} style={{ cursor: "pointer" }}>
        <polygon
          points={points}
          fill={zone.owner !== null ? ownerColor + "25" : "#0a0a0f"}
          stroke={ownerColor}
          strokeWidth={zone.owner !== null ? 2 : 0.8}
          style={{ filter: isNexus ? "drop-shadow(0 0 8px #fff5)" : zone.owner !== null ? `drop-shadow(0 0 6px ${ownerColor}55)` : "none" }}
        />
        <text x={px} y={py - 6} textAnchor="middle" fontSize="14" fill="#fff">
          {zone.typeData.icon}
        </text>
        <text x={px} y={py + 12} textAnchor="middle" fontSize="8" fill="#999" fontFamily="'Share Tech Mono', monospace">
          {zone.typeData.name}
        </text>
        {zone.defense > 1 && (
          <text x={px + 20} y={py - 15} textAnchor="middle" fontSize="8" fill="#4ecdc4" fontFamily="monospace">
            🛡{zone.defense}
          </text>
        )}
        {zone.sabotaged && (
          <text x={px - 20} y={py - 15} textAnchor="middle" fontSize="10">💥</text>
        )}
      </g>
    );
  };

  // --- STYLES ---
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #06060e; --surface: #0c0c18; --border: #1a1a2e;
      --text: #e0e0e0; --dim: #666; --accent: #00e5ff;
    }
  `;

  if (gameState === "menu") {
    return (
      <div style={{ background: "#06060e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', sans-serif", color: "#e0e0e0", position: "relative", overflow: "hidden" }}>
        <style>{css}</style>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, #0d1b2a 0%, #06060e 70%)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#1a1a2e22 1px, transparent 1px), linear-gradient(90deg, #1a1a2e22 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{ fontSize: "12px", letterSpacing: "8px", color: "#00e5ff", marginBottom: 12, fontFamily: "'Share Tech Mono', monospace" }}>
            ASHGRID SECTOR 7 — SIMULATION v1.0
          </div>
          <h1 style={{ fontSize: "64px", fontWeight: 700, letterSpacing: "6px", margin: "0 0 4px", textShadow: "0 0 40px #ff003c55, 0 0 80px #ff003c22", lineHeight: 1 }}>
            DEAD<span style={{ color: "#ff003c" }}>_</span>NEXUS
          </h1>
          <div style={{ fontSize: "14px", color: "#999", letterSpacing: "3px", marginBottom: 48, fontFamily: "'Share Tech Mono', monospace" }}>
            연결과 붕괴. 도시 중심부의 폐허 위에서 벌어지는 전쟁.
          </div>
          <button
            onClick={startGame}
            style={{ background: "transparent", border: "1px solid #ff003c", color: "#ff003c", padding: "14px 48px", fontSize: "18px", letterSpacing: "4px", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, cursor: "pointer", transition: "all 0.3s", position: "relative" }}
            onMouseEnter={(e) => { e.target.style.background = "#ff003c"; e.target.style.color = "#000"; e.target.style.boxShadow = "0 0 30px #ff003c55"; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#ff003c"; e.target.style.boxShadow = "none"; }}
          >
            INITIALIZE
          </button>
          <div style={{ marginTop: 40, display: "flex", gap: 32, justifyContent: "center" }}>
            {PLAYER_NAMES.map((n, i) => (
              <div key={i} style={{ fontSize: "11px", color: PLAYER_COLORS[i], letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace", opacity: 0.7 }}>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    const scores = players.map((p) => ({ ...p, score: getScore(p) })).sort((a, b) => b.score - a.score);
    return (
      <div style={{ background: "#06060e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', sans-serif", color: "#e0e0e0" }}>
        <style>{css}</style>
        <div style={{ fontSize: "12px", letterSpacing: "6px", color: "#00e5ff", marginBottom: 16, fontFamily: "'Share Tech Mono', monospace" }}>SIMULATION COMPLETE</div>
        <h1 style={{ fontSize: "48px", marginBottom: 8, color: PLAYER_COLORS[winner] }}>
          {PLAYER_NAMES[winner]} 승리
        </h1>
        <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
          {scores.map((p, i) => (
            <div key={p.id} style={{ background: "#0c0c18", border: `1px solid ${PLAYER_COLORS[p.id]}44`, padding: "16px 24px", textAlign: "center", minWidth: 120 }}>
              <div style={{ fontSize: 11, color: "#666", fontFamily: "'Share Tech Mono', monospace" }}>#{i + 1}</div>
              <div style={{ color: PLAYER_COLORS[p.id], fontSize: 16, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 28, fontWeight: 700, margin: "4px 0" }}>{p.score}</div>
              <div style={{ fontSize: 10, color: "#666" }}>구역 {p.zones.length} · Rep {p.rep}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setGameState("menu"); }}
          style={{ marginTop: 32, background: "transparent", border: "1px solid #00e5ff", color: "#00e5ff", padding: "10px 36px", fontSize: "14px", letterSpacing: "3px", fontFamily: "'Rajdhani', sans-serif", cursor: "pointer" }}
        >
          RESTART
        </button>
      </div>
    );
  }

  const cp = players[currentPlayer];

  return (
    <div style={{ background: "#06060e", minHeight: "100vh", fontFamily: "'Rajdhani', sans-serif", color: "#e0e0e0", display: "flex", flexDirection: "column" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #1a1a2e", background: "#0c0c18" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>DEAD<span style={{ color: "#ff003c" }}>_</span>NEXUS</span>
          <span style={{ fontSize: 11, color: "#666", fontFamily: "'Share Tech Mono', monospace" }}>R{round}/8</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {PHASE_EN.map((pn, i) => (
            <div key={i} style={{ padding: "3px 10px", fontSize: 10, letterSpacing: 1, fontFamily: "'Share Tech Mono', monospace", background: phase === i ? "#ff003c22" : "transparent", color: phase === i ? "#ff003c" : "#444", border: phase === i ? "1px solid #ff003c44" : "1px solid transparent", transition: "all 0.3s" }}>
              {pn}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: PLAYER_COLORS[currentPlayer], fontFamily: "'Share Tech Mono', monospace" }}>
          ▸ {cp.name}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT — Players */}
        <div style={{ width: 220, borderRight: "1px solid #1a1a2e", padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          {players.map((p, i) => (
            <div key={i} style={{ background: currentPlayer === i ? `${PLAYER_COLORS[i]}08` : "#0c0c18", border: `1px solid ${currentPlayer === i ? PLAYER_COLORS[i] + "66" : "#1a1a2e"}`, padding: "10px 12px", transition: "all 0.3s", boxShadow: currentPlayer === i ? PLAYER_GLOWS[i] : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: PLAYER_COLORS[i], fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{p.name}</span>
                <span style={{ fontSize: 10, color: "#666", fontFamily: "'Share Tech Mono', monospace" }}>
                  S:{getScore(p)}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
                <span style={{ color: "#ffd700" }}>💰 {p.credit}</span>
                <span style={{ color: "#ff6b6b" }}>👥 {p.operative}</span>
                <span style={{ color: "#4ecdc4" }}>🔍 {p.intel}</span>
                <span style={{ color: "#a855f7" }}>🔫 {p.arms}</span>
              </div>
              <div style={{ fontSize: 9, color: "#555", marginTop: 4, fontFamily: "'Share Tech Mono', monospace" }}>
                구역 {p.zones.length} · Rep {p.rep} {p.nexusStreak > 0 ? `· 넥서스 ${p.nexusStreak}연속` : ""}
              </div>
            </div>
          ))}
        </div>

        {/* CENTER — Board */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Event Banner */}
          {currentEvent && phase === 0 && (
            <div style={{ padding: "8px 16px", background: "#1a0a0a", borderBottom: "1px solid #ff003c33", display: "flex", alignItems: "center", gap: 12, animation: animPhase ? "flash 0.6s" : "none" }}>
              <span style={{ color: "#ff003c", fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>EVENT</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{currentEvent.title}</span>
              <span style={{ fontSize: 12, color: "#999" }}>— {currentEvent.desc}</span>
            </div>
          )}

          {/* Board SVG */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg viewBox="0 0 480 400" style={{ width: "100%", maxWidth: 520, maxHeight: "100%" }}>
              <defs>
                <radialGradient id="glow">
                  <stop offset="0%" stopColor="#ff003c22" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx={boardCX} cy={boardCY} r={160} fill="url(#glow)" />
              {zones.map((z) => <HexCell key={z.idx} zone={z} />)}
            </svg>
          </div>

          {/* Phase Action Bar */}
          <div style={{ borderTop: "1px solid #1a1a2e", padding: "12px 16px", background: "#0c0c18" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ color: "#ff003c", fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace" }}>
                  {PHASE_EN[phase]}
                </span>
                <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>{PHASE_DESC[phase]}</span>
              </div>
              <div style={{ fontSize: 11, color: PLAYER_COLORS[currentPlayer], fontFamily: "'Share Tech Mono', monospace" }}>
                {cp.name} 턴
              </div>
            </div>

            {phase === 0 && (
              <button onClick={() => { setPhase(1); addLog("📋 계획 단계 시작"); }}
                style={btnStyle("#00e5ff")}>
                계획 단계로 →
              </button>
            )}

            {phase === 1 && (
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {ACTIONS.map((a) => (
                    <button key={a.id} onClick={() => selectAction(a)}
                      disabled={selectedActions.length >= 2 || !!selectedActions.find((s) => s.id === a.id)}
                      style={{ ...btnStyle("#1a1a2e", true), fontSize: 11, padding: "6px 10px", opacity: selectedActions.length >= 2 ? 0.4 : 1, border: `1px solid ${selectedActions.find((s) => s.id === a.id) ? "#00e5ff" : "#333"}` }}>
                      {a.icon} {a.name}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, display: "flex", gap: 6 }}>
                    {selectedActions.map((a, i) => (
                      <div key={i} onClick={() => removeAction(i)}
                        style={{ background: "#00e5ff15", border: "1px solid #00e5ff44", padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#00e5ff" }}>
                        {a.icon} {a.name} ✕
                      </div>
                    ))}
                    {selectedActions.length === 0 && <span style={{ fontSize: 11, color: "#555" }}>행동을 선택하세요 (최대 2개)</span>}
                  </div>
                  <button onClick={confirmPlan} disabled={selectedActions.length === 0}
                    style={{ ...btnStyle("#ff003c"), opacity: selectedActions.length === 0 ? 0.4 : 1 }}>
                    확정 {currentPlayer < 3 ? `→ ${PLAYER_NAMES[currentPlayer + 1]}` : "→ 실행"}
                  </button>
                </div>
              </div>
            )}

            {phase === 2 && (
              <button onClick={executeActions} style={btnStyle("#ff003c")}>
                ⚔️ 모든 행동 실행
              </button>
            )}

            {phase === 3 && (
              <button onClick={processIncome} style={btnStyle("#ffd700")}>
                💰 수익 수령
              </button>
            )}

            {phase === 4 && (
              <button onClick={processMaintenance} style={btnStyle("#a855f7")}>
                🔧 유지비 지불 → 다음 라운드
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Log + Zone Info */}
        <div style={{ width: 240, borderLeft: "1px solid #1a1a2e", display: "flex", flexDirection: "column" }}>
          {/* Zone Info */}
          {selectedZone !== null && zones[selectedZone] && (
            <div style={{ padding: 12, borderBottom: "1px solid #1a1a2e", background: "#0c0c1899" }}>
              <div style={{ fontSize: 11, color: "#666", fontFamily: "'Share Tech Mono', monospace", marginBottom: 4 }}>ZONE INFO</div>
              <div style={{ fontSize: 18, marginBottom: 4 }}>
                {zones[selectedZone].typeData.icon} {zones[selectedZone].typeData.name}
              </div>
              <div style={{ fontSize: 11, color: "#999", fontFamily: "'Share Tech Mono', monospace" }}>
                <div>생산: {zones[selectedZone].typeData.resource}</div>
                <div>방어력: {zones[selectedZone].defense}</div>
                <div>소유: {zones[selectedZone].owner !== null ? PLAYER_NAMES[zones[selectedZone].owner] : "없음"}</div>
                {zones[selectedZone].sabotaged && <div style={{ color: "#ff003c" }}>⚠ 공작 당함</div>}
              </div>
            </div>
          )}

          {/* Log */}
          <div style={{ flex: 1, padding: 12, overflowY: "auto", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: "#777" }} ref={logRef}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 8 }}>SYSTEM LOG</div>
            {log.map((l, i) => (
              <div key={i} style={{ marginBottom: 3, lineHeight: 1.4, borderLeft: "1px solid #1a1a2e", paddingLeft: 6 }}>
                {l.msg}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; background: #ff003c15; }
        }
      `}</style>
    </div>
  );
}

function btnStyle(color, isSmall) {
  return {
    background: `${color}15`,
    border: `1px solid ${color}66`,
    color: color,
    padding: isSmall ? "5px 10px" : "8px 20px",
    fontSize: isSmall ? 11 : 13,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: "'Rajdhani', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s",
  };
}
