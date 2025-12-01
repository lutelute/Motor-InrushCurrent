import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

// モーター種類の定義
const MOTOR_TYPES = {
  squirrelCage: {
    id: 'squirrelCage',
    name: 'かご型誘導機',
    category: '誘導機',
    description: '最も普及。回転子に導体バー（かご状）を配置。構造がシンプルで堅牢。',
    features: ['構造が単純で安価', '保守が容易', '始動電流が大きい（定格の4〜8倍）', '始動トルクは中程度'],
    applications: 'ポンプ、ファン、コンベア、工作機械など',
    inrushMultiplier: 6,
    startTorque: 1.5,
    hasSlipRings: false,
    rotorType: 'cage',
  },
  woundRotor: {
    id: 'woundRotor',
    name: '巻線型誘導機',
    category: '誘導機',
    description: '回転子に三相巻線を持ち、スリップリングで外部抵抗を接続可能。',
    features: ['外部抵抗で始動電流を制御可能', '始動トルクを大きくできる', '速度制御が可能（効率は低下）', '構造が複雑でコスト高'],
    applications: 'クレーン、ホイスト、大型ポンプ、圧縮機',
    inrushMultiplier: 3,
    startTorque: 2.5,
    hasSlipRings: true,
    rotorType: 'wound',
  },
  salientPole: {
    id: 'salientPole',
    name: '突極型同期機',
    category: '同期機',
    description: '磁極が回転子から突出。低速・多極用途に最適。',
    features: ['極数を多くできる（水車直結向き）', '回転数は電源周波数に同期', '力率調整が可能', 'ダンパ巻線で始動（誘導機として）'],
    applications: '水力発電機、低速大型機械',
    inrushMultiplier: 5,
    startTorque: 0.4,
    hasSlipRings: true,
    rotorType: 'salient',
  },
  cylindrical: {
    id: 'cylindrical',
    name: '円筒型同期機',
    category: '同期機',
    description: '円筒形の回転子に溝を切って界磁巻線を収納。高速回転向き。',
    features: ['高速回転に適した構造（2極/4極）', '機械的強度が高い', '風損が少ない', 'タービン直結に最適'],
    applications: '火力・原子力発電機（タービン発電機）',
    inrushMultiplier: 5,
    startTorque: 0.3,
    hasSlipRings: true,
    rotorType: 'cylindrical',
  },
};

// かご型回転子の図
const CageRotorDiagram = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32">
    <circle cx="100" cy="100" r="80" fill="#374151" stroke="#6B7280" strokeWidth="2" />
    <circle cx="100" cy="100" r="60" fill="#1F2937" stroke="#6B7280" strokeWidth="1" />
    {/* 導体バー */}
    {[...Array(12)].map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x1 = 100 + 60 * Math.cos(angle);
      const y1 = 100 + 60 * Math.sin(angle);
      const x2 = 100 + 78 * Math.cos(angle);
      const y2 = 100 + 78 * Math.sin(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="4" />;
    })}
    {/* エンドリング */}
    <circle cx="100" cy="100" r="60" fill="none" stroke="#F59E0B" strokeWidth="3" />
    <circle cx="100" cy="100" r="78" fill="none" stroke="#F59E0B" strokeWidth="3" />
    <circle cx="100" cy="100" r="15" fill="#4B5563" stroke="#6B7280" strokeWidth="2" />
    <text x="100" y="185" textAnchor="middle" fill="#9CA3AF" fontSize="10">かご型回転子</text>
  </svg>
);

// 巻線型回転子の図
const WoundRotorDiagram = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32">
    <circle cx="100" cy="100" r="80" fill="#374151" stroke="#6B7280" strokeWidth="2" />
    <circle cx="100" cy="100" r="60" fill="#1F2937" stroke="#6B7280" strokeWidth="1" />
    {/* 三相巻線 */}
    {[0, 120, 240].map((deg, i) => {
      const colors = ['#EF4444', '#22C55E', '#3B82F6'];
      const angle = (deg * Math.PI) / 180;
      return (
        <g key={i}>
          <path
            d={`M${100 + 30 * Math.cos(angle)},${100 + 30 * Math.sin(angle)} 
                Q${100 + 50 * Math.cos(angle + 0.3)},${100 + 50 * Math.sin(angle + 0.3)} 
                ${100 + 70 * Math.cos(angle)},${100 + 70 * Math.sin(angle)}`}
            fill="none" stroke={colors[i]} strokeWidth="3"
          />
          <path
            d={`M${100 + 30 * Math.cos(angle + Math.PI)},${100 + 30 * Math.sin(angle + Math.PI)} 
                Q${100 + 50 * Math.cos(angle + Math.PI - 0.3)},${100 + 50 * Math.sin(angle + Math.PI - 0.3)} 
                ${100 + 70 * Math.cos(angle + Math.PI)},${100 + 70 * Math.sin(angle + Math.PI)}`}
            fill="none" stroke={colors[i]} strokeWidth="3"
          />
        </g>
      );
    })}
    {/* スリップリング */}
    <circle cx="100" cy="100" r="20" fill="none" stroke="#F59E0B" strokeWidth="4" />
    <circle cx="100" cy="100" r="12" fill="#4B5563" stroke="#6B7280" strokeWidth="2" />
    <text x="100" y="185" textAnchor="middle" fill="#9CA3AF" fontSize="10">巻線型回転子</text>
  </svg>
);

// 突極型回転子の図
const SalientPoleDiagram = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32">
    <circle cx="100" cy="100" r="80" fill="#374151" stroke="#6B7280" strokeWidth="2" />
    {/* 突極 */}
    {[0, 90, 180, 270].map((deg, i) => {
      const angle = (deg * Math.PI) / 180;
      const x = 100 + 45 * Math.cos(angle);
      const y = 100 + 45 * Math.sin(angle);
      return (
        <g key={i}>
          <rect
            x={x - 15} y={y - 25}
            width="30" height="50"
            fill="#1F2937" stroke="#EC4899" strokeWidth="2"
            transform={`rotate(${deg}, ${x}, ${y})`}
          />
          {/* 界磁巻線 */}
          <rect
            x={x - 10} y={y - 20}
            width="20" height="40"
            fill="none" stroke="#F59E0B" strokeWidth="2"
            transform={`rotate(${deg}, ${x}, ${y})`}
          />
        </g>
      );
    })}
    <circle cx="100" cy="100" r="25" fill="#4B5563" stroke="#6B7280" strokeWidth="2" />
    <text x="100" y="185" textAnchor="middle" fill="#9CA3AF" fontSize="10">突極型回転子</text>
  </svg>
);

// 円筒型回転子の図
const CylindricalRotorDiagram = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32">
    <circle cx="100" cy="100" r="80" fill="#374151" stroke="#6B7280" strokeWidth="2" />
    <circle cx="100" cy="100" r="65" fill="#1F2937" stroke="#6B7280" strokeWidth="1" />
    {/* スロット（溝） */}
    {[...Array(24)].map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      const x1 = 100 + 40 * Math.cos(angle);
      const y1 = 100 + 40 * Math.sin(angle);
      const x2 = 100 + 63 * Math.cos(angle);
      const y2 = 100 + 63 * Math.sin(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="2" />;
    })}
    <circle cx="100" cy="100" r="40" fill="#1F2937" stroke="#6B7280" strokeWidth="1" />
    <circle cx="100" cy="100" r="15" fill="#4B5563" stroke="#6B7280" strokeWidth="2" />
    <text x="100" y="185" textAnchor="middle" fill="#9CA3AF" fontSize="10">円筒型回転子</text>
  </svg>
);

// 回転子図のコンポーネント選択
const RotorDiagram = ({ type }) => {
  switch (type) {
    case 'cage': return <CageRotorDiagram />;
    case 'wound': return <WoundRotorDiagram />;
    case 'salient': return <SalientPoleDiagram />;
    case 'cylindrical': return <CylindricalRotorDiagram />;
    default: return <CageRotorDiagram />;
  }
};

// 誘導機等価回路
const InductionMotorCircuit = ({ slip = 1, hasExternalResistor = false }) => {
  const r2s = slip === 0 ? '∞' : (1/slip).toFixed(1);
  return (
    <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
      <rect x="0" y="0" width="600" height="220" fill="#1F2937" rx="8" />
      
      {/* 電源 */}
      <circle cx="40" cy="110" r="18" fill="none" stroke="#3B82F6" strokeWidth="2" />
      <text x="40" y="115" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">V</text>
      <line x1="40" y1="92" x2="40" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      <line x1="40" y1="128" x2="40" y2="170" stroke="#9CA3AF" strokeWidth="2" />
      
      <line x1="40" y1="50" x2="80" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      
      {/* R1 */}
      <rect x="80" y="40" width="40" height="20" fill="none" stroke="#EF4444" strokeWidth="2" />
      <text x="100" y="35" textAnchor="middle" fill="#EF4444" fontSize="10">R₁</text>
      
      <line x1="120" y1="50" x2="150" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      
      {/* X1 */}
      <path d="M150,50 Q160,40 170,50 Q180,60 190,50 Q200,40 210,50" fill="none" stroke="#F59E0B" strokeWidth="2" />
      <text x="180" y="35" textAnchor="middle" fill="#F59E0B" fontSize="10">jX₁</text>
      
      <line x1="210" y1="50" x2="250" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      <circle cx="250" cy="50" r="3" fill="#9CA3AF" />
      
      {/* 励磁回路 */}
      <line x1="250" y1="50" x2="250" y2="80" stroke="#9CA3AF" strokeWidth="2" />
      <path d="M250,80 Q240,90 250,100 Q260,110 250,120 Q240,130 250,140" fill="none" stroke="#22C55E" strokeWidth="2" />
      <text x="230" y="115" textAnchor="end" fill="#22C55E" fontSize="9">jXₘ</text>
      <line x1="250" y1="140" x2="250" y2="170" stroke="#9CA3AF" strokeWidth="2" />
      
      <line x1="250" y1="50" x2="300" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      
      {/* X2' */}
      <path d="M300,50 Q310,40 320,50 Q330,60 340,50 Q350,40 360,50" fill="none" stroke="#F59E0B" strokeWidth="2" />
      <text x="330" y="35" textAnchor="middle" fill="#F59E0B" fontSize="10">jX₂'</text>
      
      <line x1="360" y1="50" x2="400" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      
      {/* R2'/s */}
      <rect x="400" y="40" width="50" height="20" fill="none" stroke="#EC4899" strokeWidth="2" />
      <text x="425" y="35" textAnchor="middle" fill="#EC4899" fontSize="10">R₂'/s</text>
      
      <line x1="450" y1="50" x2="480" y2="50" stroke="#9CA3AF" strokeWidth="2" />
      
      {/* 外部抵抗（巻線型の場合） */}
      {hasExternalResistor && (
        <>
          <rect x="480" y="40" width="40" height="20" fill="none" stroke="#A855F7" strokeWidth="2" strokeDasharray="4,2" />
          <text x="500" y="35" textAnchor="middle" fill="#A855F7" fontSize="10">R_ext</text>
          <line x1="520" y1="50" x2="560" y2="50" stroke="#9CA3AF" strokeWidth="2" />
          <line x1="560" y1="50" x2="560" y2="170" stroke="#9CA3AF" strokeWidth="2" />
        </>
      )}
      {!hasExternalResistor && (
        <>
          <line x1="480" y1="50" x2="560" y2="50" stroke="#9CA3AF" strokeWidth="2" />
          <line x1="560" y1="50" x2="560" y2="170" stroke="#9CA3AF" strokeWidth="2" />
        </>
      )}
      
      <line x1="40" y1="170" x2="560" y2="170" stroke="#9CA3AF" strokeWidth="2" />
      
      {/* スリップ表示 */}
      <rect x="400" y="70" width="80" height="30" fill="#374151" rx="4" />
      <text x="440" y="85" textAnchor="middle" fill="#9CA3AF" fontSize="9">s = {slip}</text>
      <text x="440" y="96" textAnchor="middle" fill="#EC4899" fontSize="8">
        {slip === 1 ? '(停止)' : '(定格)'}
      </text>
      
      {/* 凡例 */}
      <text x="20" y="200" fill="#9CA3AF" fontSize="9">
        <tspan fill="#EF4444">R₁</tspan>:一次抵抗 <tspan fill="#F59E0B">X₁,X₂'</tspan>:漏れリアクタンス <tspan fill="#22C55E">Xₘ</tspan>:励磁 <tspan fill="#EC4899">R₂'/s</tspan>:二次抵抗
        {hasExternalResistor && <tspan fill="#A855F7"> R_ext</tspan>}
        {hasExternalResistor && ':外部抵抗'}
      </text>
    </svg>
  );
};

// 同期機等価回路
const SynchronousMotorCircuit = ({ isSalient = true }) => (
  <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
    <rect x="0" y="0" width="600" height="220" fill="#1F2937" rx="8" />
    
    {/* 電源 */}
    <circle cx="40" cy="110" r="18" fill="none" stroke="#3B82F6" strokeWidth="2" />
    <text x="40" y="115" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">V</text>
    <line x1="40" y1="92" x2="40" y2="50" stroke="#9CA3AF" strokeWidth="2" />
    <line x1="40" y1="128" x2="40" y2="170" stroke="#9CA3AF" strokeWidth="2" />
    
    <line x1="40" y1="50" x2="80" y2="50" stroke="#9CA3AF" strokeWidth="2" />
    
    {/* Ra - 電機子抵抗 */}
    <rect x="80" y="40" width="40" height="20" fill="none" stroke="#EF4444" strokeWidth="2" />
    <text x="100" y="35" textAnchor="middle" fill="#EF4444" fontSize="10">Rₐ</text>
    
    <line x1="120" y1="50" x2="160" y2="50" stroke="#9CA3AF" strokeWidth="2" />
    
    {/* Xs - 同期リアクタンス */}
    {isSalient ? (
      <>
        <path d="M160,50 Q175,35 190,50 Q205,65 220,50 Q235,35 250,50 Q265,65 280,50" fill="none" stroke="#F59E0B" strokeWidth="2" />
        <text x="220" y="30" textAnchor="middle" fill="#F59E0B" fontSize="10">jXd (直軸)</text>
        <text x="220" y="75" textAnchor="middle" fill="#F59E0B" fontSize="9" opacity="0.7">jXq (横軸)</text>
      </>
    ) : (
      <>
        <path d="M160,50 Q175,35 190,50 Q205,65 220,50 Q235,35 250,50 Q265,65 280,50" fill="none" stroke="#F59E0B" strokeWidth="2" />
        <text x="220" y="30" textAnchor="middle" fill="#F59E0B" fontSize="10">jXs</text>
      </>
    )}
    
    <line x1="280" y1="50" x2="350" y2="50" stroke="#9CA3AF" strokeWidth="2" />
    
    {/* 誘起電圧 E */}
    <circle cx="380" cy="50" r="25" fill="none" stroke="#22C55E" strokeWidth="2" />
    <text x="380" y="55" textAnchor="middle" fill="#22C55E" fontSize="14" fontWeight="bold">E</text>
    <text x="380" y="90" textAnchor="middle" fill="#22C55E" fontSize="9">誘起電圧</text>
    
    <line x1="405" y1="50" x2="450" y2="50" stroke="#9CA3AF" strokeWidth="2" />
    
    {/* 界磁回路（DC励磁） */}
    <rect x="450" y="30" width="100" height="60" fill="#374151" stroke="#A855F7" strokeWidth="2" rx="4" />
    <text x="500" y="55" textAnchor="middle" fill="#A855F7" fontSize="10">界磁回路</text>
    <text x="500" y="70" textAnchor="middle" fill="#A855F7" fontSize="9">(DC励磁)</text>
    
    <line x1="550" y1="60" x2="560" y2="60" stroke="#9CA3AF" strokeWidth="2" />
    <line x1="560" y1="60" x2="560" y2="170" stroke="#9CA3AF" strokeWidth="2" />
    <line x1="40" y1="170" x2="560" y2="170" stroke="#9CA3AF" strokeWidth="2" />
    
    {/* 凡例 */}
    <text x="20" y="200" fill="#9CA3AF" fontSize="9">
      <tspan fill="#EF4444">Rₐ</tspan>:電機子抵抗 
      <tspan fill="#F59E0B">{isSalient ? 'Xd,Xq' : 'Xs'}</tspan>:{isSalient ? '直軸・横軸リアクタンス' : '同期リアクタンス'} 
      <tspan fill="#22C55E">E</tspan>:誘起電圧 
      <tspan fill="#A855F7">界磁</tspan>:DC励磁
    </text>
    
    {isSalient && (
      <text x="20" y="215" fill="#9CA3AF" fontSize="8">
        ※突極型はXd ≠ Xq（磁気的非対称性）
      </text>
    )}
  </svg>
);

// メインコンポーネント
export default function MotorStartupSimulator() {
  const [selectedMotor, setSelectedMotor] = useState('squirrelCage');
  const [ratedPower, setRatedPower] = useState(7.5);
  const [ratedVoltage, setRatedVoltage] = useState(200);
  const [frequency, setFrequency] = useState(50);
  const [switchingAngle, setSwitchingAngle] = useState(0);
  const [dcTimeConstant, setDcTimeConstant] = useState(50);
  const [viewCycles, setViewCycles] = useState(10);
  const [stopTime, setStopTime] = useState(50);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [showCircuit, setShowCircuit] = useState(false);
  const [circuitSlip, setCircuitSlip] = useState(1);

  const motor = MOTOR_TYPES[selectedMotor];
  const inrushMultiplier = motor.inrushMultiplier;

  const simulationData = useMemo(() => {
    const omega = 2 * Math.PI * frequency;
    const period = 1 / frequency;
    const ratedCurrent = (ratedPower * 1000) / (Math.sqrt(3) * ratedVoltage * 0.85);
    const peakRated = ratedCurrent * Math.sqrt(2);
    const peakInrush = peakRated * inrushMultiplier;
    
    const phi0 = (switchingAngle * Math.PI) / 180;
    const tau = dcTimeConstant / 1000;
    const tauAC = motor.category === '同期機' ? 0.5 : 0.3;
    
    const stopTimeS = stopTime / 1000;
    const runTime = period * viewCycles;
    const totalTime = stopTimeS + runTime;
    const dt = period / 100;
    const steps = Math.floor(totalTime / dt);
    
    const data = [];
    let maxCurrent = 0;
    
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const tMs = t * 1000;
      
      if (t < stopTimeS) {
        data.push({
          time: parseFloat(tMs.toFixed(2)),
          iU: 0, iV: 0, iW: 0,
          envPos: 0, envNeg: 0, dcU: 0,
          peakRated: parseFloat(peakRated.toFixed(1)),
        });
        continue;
      }
      
      const tRun = t - stopTimeS;
      const amplitudeDecay = 1 + (inrushMultiplier - 1) * Math.exp(-tRun / tauAC);
      const currentAmplitude = peakRated * amplitudeDecay;
      
      const phaseU = omega * tRun + phi0;
      const phaseV = omega * tRun + phi0 - (2 * Math.PI / 3);
      const phaseW = omega * tRun + phi0 + (2 * Math.PI / 3);
      
      const dcU = -currentAmplitude * Math.sin(phi0) * Math.exp(-tRun / tau);
      const dcV = -currentAmplitude * Math.sin(phi0 - (2 * Math.PI / 3)) * Math.exp(-tRun / tau);
      const dcW = -currentAmplitude * Math.sin(phi0 + (2 * Math.PI / 3)) * Math.exp(-tRun / tau);
      
      const iU = currentAmplitude * Math.sin(phaseU) + dcU;
      const iV = currentAmplitude * Math.sin(phaseV) + dcV;
      const iW = currentAmplitude * Math.sin(phaseW) + dcW;
      
      const envelopeU_pos = currentAmplitude + Math.abs(dcU);
      const envelopeU_neg = -(currentAmplitude + Math.abs(dcU));
      
      maxCurrent = Math.max(maxCurrent, Math.abs(iU), Math.abs(iV), Math.abs(iW));
      
      data.push({
        time: parseFloat(tMs.toFixed(2)),
        iU: parseFloat(iU.toFixed(1)),
        iV: parseFloat(iV.toFixed(1)),
        iW: parseFloat(iW.toFixed(1)),
        envPos: parseFloat(envelopeU_pos.toFixed(1)),
        envNeg: parseFloat(envelopeU_neg.toFixed(1)),
        dcU: parseFloat(dcU.toFixed(1)),
        peakRated: parseFloat(peakRated.toFixed(1)),
      });
    }
    
    return { data, ratedCurrent, peakRated, peakInrush, maxCurrent, stopTimeMs: stopTime };
  }, [ratedPower, ratedVoltage, frequency, inrushMultiplier, switchingAngle, dcTimeConstant, viewCycles, stopTime, motor]);

  const getPhaseDescription = (angle) => {
    if (angle === 0 || angle === 180) return 'DC成分最小';
    if (angle === 90 || angle === 270) return 'DC成分最大';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-2 text-blue-400">
        モーター始動時 突入電流シミュレーション
      </h1>
      
      {/* モーター種類タブ */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1 bg-gray-800 p-2 rounded-lg">
          {Object.values(MOTOR_TYPES).map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMotor(m.id)}
              className={`px-3 py-2 rounded text-sm transition-all ${
                selectedMotor === m.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs opacity-75">{m.category}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* 選択したモーターの情報 */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
        <div className="flex flex-wrap items-start gap-4">
          <RotorDiagram type={motor.rotorType} />
          <div className="flex-1 min-w-64">
            <h2 className="text-xl font-bold text-blue-400 mb-1">{motor.name}</h2>
            <p className="text-sm text-gray-300 mb-3">{motor.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">特徴</div>
                <ul className="space-y-1">
                  {motor.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-300">• {f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">用途</div>
                <p className="text-xs text-gray-300">{motor.applications}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">突入電流倍率:</span>
                    <span className="text-yellow-400 font-mono">{motor.inrushMultiplier}倍</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">始動トルク:</span>
                    <span className="text-green-400 font-mono">{motor.startTorque} p.u.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* パラメータ設定 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-gray-800 p-4 rounded-lg">
        <div>
          <label className="block text-xs text-gray-400 mb-1">定格出力 [kW]</label>
          <input type="range" min="0.75" max="37" step="0.25" value={ratedPower}
            onChange={(e) => setRatedPower(parseFloat(e.target.value))} className="w-full accent-blue-500" />
          <span className="text-sm font-mono text-blue-300">{ratedPower} kW</span>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">定格電圧 [V]</label>
          <select value={ratedVoltage} onChange={(e) => setRatedVoltage(parseInt(e.target.value))}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm">
            <option value={200}>200V</option>
            <option value={400}>400V</option>
            <option value={6600}>6.6kV</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">電源周波数 [Hz]</label>
          <select value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value))}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm">
            <option value={50}>50Hz</option>
            <option value={60}>60Hz</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">停止時間 [ms]</label>
          <input type="range" min="0" max="100" step="10" value={stopTime}
            onChange={(e) => setStopTime(parseInt(e.target.value))} className="w-full accent-gray-500" />
          <span className="text-sm font-mono text-gray-300">{stopTime} ms</span>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">投入位相角 [°]</label>
          <input type="range" min="0" max="360" step="15" value={switchingAngle}
            onChange={(e) => setSwitchingAngle(parseInt(e.target.value))} className="w-full accent-purple-500" />
          <span className="text-sm font-mono text-purple-300">{switchingAngle}° <span className="text-xs text-blue-400">{getPhaseDescription(switchingAngle)}</span></span>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">DC減衰時定数 [ms]</label>
          <input type="range" min="10" max="200" step="5" value={dcTimeConstant}
            onChange={(e) => setDcTimeConstant(parseInt(e.target.value))} className="w-full accent-pink-500" />
          <span className="text-sm font-mono text-pink-300">{dcTimeConstant} ms</span>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">表示サイクル数</label>
          <input type="range" min="3" max="30" step="1" value={viewCycles}
            onChange={(e) => setViewCycles(parseInt(e.target.value))} className="w-full accent-green-500" />
          <span className="text-sm font-mono text-green-300">{viewCycles} サイクル</span>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showEnvelope} onChange={(e) => setShowEnvelope(e.target.checked)}
              className="w-4 h-4 accent-blue-500" />
            <span className="text-xs">包絡線</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showCircuit} onChange={(e) => setShowCircuit(e.target.checked)}
              className="w-4 h-4 accent-green-500" />
            <span className="text-xs">等価回路</span>
          </label>
        </div>
      </div>
      
      {/* 計算結果サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-gray-800 p-3 rounded text-center">
          <div className="text-xs text-gray-400">定格電流</div>
          <div className="text-lg font-bold text-green-400">{simulationData.ratedCurrent.toFixed(1)} A</div>
        </div>
        <div className="bg-gray-800 p-3 rounded text-center">
          <div className="text-xs text-gray-400">定格ピーク</div>
          <div className="text-lg font-bold text-green-300">{simulationData.peakRated.toFixed(1)} A</div>
        </div>
        <div className="bg-gray-800 p-3 rounded text-center">
          <div className="text-xs text-gray-400">突入ピーク</div>
          <div className="text-lg font-bold text-yellow-400">{simulationData.peakInrush.toFixed(1)} A</div>
        </div>
        <div className="bg-gray-800 p-3 rounded text-center">
          <div className="text-xs text-gray-400">最大瞬時電流</div>
          <div className="text-lg font-bold text-red-400">{simulationData.maxCurrent.toFixed(1)} A</div>
        </div>
        <div className="bg-gray-800 p-3 rounded text-center">
          <div className="text-xs text-gray-400">対定格比</div>
          <div className="text-lg font-bold text-red-300">{(simulationData.maxCurrent / simulationData.peakRated).toFixed(1)} 倍</div>
        </div>
      </div>
      
      {/* 等価回路表示 */}
      {showCircuit && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-green-600">
          <h3 className="text-md font-bold text-green-400 mb-3">
            {motor.name} 等価回路
          </h3>
          
          {motor.category === '誘導機' && (
            <>
              <div className="mb-3">
                <button onClick={() => setCircuitSlip(1)}
                  className={`px-3 py-1 rounded mr-2 text-xs ${circuitSlip === 1 ? 'bg-red-600' : 'bg-gray-600'}`}>
                  s = 1 (停止)
                </button>
                <button onClick={() => setCircuitSlip(0.03)}
                  className={`px-3 py-1 rounded text-xs ${circuitSlip === 0.03 ? 'bg-green-600' : 'bg-gray-600'}`}>
                  s = 0.03 (定格)
                </button>
              </div>
              <InductionMotorCircuit slip={circuitSlip} hasExternalResistor={motor.id === 'woundRotor'} />
              {motor.id === 'woundRotor' && (
                <div className="mt-2 text-xs text-purple-300 bg-gray-700 p-2 rounded">
                  💡 巻線型はスリップリング経由で外部抵抗 R_ext を接続可能。始動時に抵抗を大きくして電流を抑制できます。
                </div>
              )}
            </>
          )}
          
          {motor.category === '同期機' && (
            <>
              <SynchronousMotorCircuit isSalient={motor.id === 'salientPole'} />
              <div className="mt-2 text-xs text-blue-300 bg-gray-700 p-2 rounded">
                💡 同期機は自己始動できないため、ダンパ巻線で誘導機として始動→同期引入れ、またはインバータ始動が必要です。
              </div>
            </>
          )}
        </div>
      )}
      
      {/* 三相電流波形 */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <h2 className="text-sm font-semibold mb-2 text-gray-300">三相電流波形 [A] - {motor.name}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={simulationData.data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <ReferenceArea x1={0} x2={simulationData.stopTimeMs} fill="#1F2937" fillOpacity={0.8} />
            <XAxis dataKey="time" stroke="#9CA3AF"
              label={{ value: '時間 [ms]', position: 'bottom', fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(v) => v.toFixed(0)} />
            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(0)} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 12 }}
              labelFormatter={(v) => `${v.toFixed(1)} ms`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#4B5563" />
            <ReferenceLine x={simulationData.stopTimeMs} stroke="#F59E0B" strokeWidth={2}
              label={{ value: '投入', fill: '#F59E0B', fontSize: 10, position: 'top' }} />
            <ReferenceLine y={simulationData.peakRated} stroke="#10B981" strokeDasharray="5 5" />
            <ReferenceLine y={-simulationData.peakRated} stroke="#10B981" strokeDasharray="5 5" />
            {showEnvelope && (
              <>
                <Line type="monotone" dataKey="envPos" name="包絡線" stroke="#6B7280" dot={false} strokeWidth={1} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="envNeg" stroke="#6B7280" dot={false} strokeWidth={1} strokeDasharray="3 3" legendType="none" />
              </>
            )}
            <Line type="monotone" dataKey="iU" name="U相" stroke="#EF4444" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="iV" name="V相" stroke="#22C55E" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="iW" name="W相" stroke="#3B82F6" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* U相 + DC成分 */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <h2 className="text-sm font-semibold mb-2 text-gray-300">U相電流とDC成分 [A]</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={simulationData.data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <ReferenceArea x1={0} x2={simulationData.stopTimeMs} fill="#1F2937" fillOpacity={0.8} />
            <XAxis dataKey="time" stroke="#9CA3AF" tickFormatter={(v) => v.toFixed(0)} />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#4B5563" />
            <ReferenceLine x={simulationData.stopTimeMs} stroke="#F59E0B" strokeWidth={2} />
            <Line type="monotone" dataKey="iU" name="U相" stroke="#EF4444" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="dcU" name="DC成分" stroke="#F59E0B" dot={false} strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 比較表 */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">モーター種類の比較</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-2 text-gray-400">種類</th>
                <th className="text-center py-2 px-2 text-gray-400">カテゴリ</th>
                <th className="text-center py-2 px-2 text-gray-400">突入倍率</th>
                <th className="text-center py-2 px-2 text-gray-400">始動トルク</th>
                <th className="text-left py-2 px-2 text-gray-400">主な用途</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(MOTOR_TYPES).map((m) => (
                <tr 
                  key={m.id} 
                  className={`border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${selectedMotor === m.id ? 'bg-gray-700' : ''}`}
                  onClick={() => setSelectedMotor(m.id)}
                >
                  <td className="py-2 px-2 font-medium text-blue-400">{m.name}</td>
                  <td className="py-2 px-2 text-center text-gray-300">{m.category}</td>
                  <td className="py-2 px-2 text-center text-yellow-400">{m.inrushMultiplier}倍</td>
                  <td className="py-2 px-2 text-center text-green-400">{m.startTorque} p.u.</td>
                  <td className="py-2 px-2 text-gray-300">{m.applications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
