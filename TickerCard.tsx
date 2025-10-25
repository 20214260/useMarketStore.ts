import React from "react";
import type { Asset } from "../hooks/useMarketStore";

interface Props {
  a: Asset;
  focusKey?: string | null;
  topKey?: string | null; // ✅ topKey prop
}

const TickerCard: React.FC<Props> = ({ a, focusKey, topKey }) => {
  const isFocused = a.key === focusKey;
  const isTop = a.key === topKey;

  return (
    <div
      className={`relative bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-all duration-300
        ${isFocused ? "scale-105 shadow-lg ring-2 ring-indigo-400" : "scale-95 opacity-80"}
        ${isTop ? "animate-shake ring-4 ring-yellow-400 bg-yellow-100 animate-glow" : ""}
      `}
    >
       {/* 파티클 효과 */}
      {isTop && (
        <div className="absolute -top-2 -right-2 animate-ping-fast w-4 h-4 bg-yellow-400 rounded-full shadow-lg z-10" />
      )}
      
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-800">{a.name}</h2>
        <span className="text-sm text-gray-500">{a.key}</span>
      </div>

      <div className="text-2xl font-bold text-indigo-700 mt-1">
        {a.price.toFixed(2)}{" "}
        {isTop && <span className="ml-2 text-yellow-500 text-xl">🥇</span>}
      </div>

      {/* 리스크 대비 효율 */}
      <div className="mt-1 text-sm">
        <span className="text-gray-500 mr-2">리스크대비효율:</span>
        {a.riskEfficiency > 0 ? (
          <span className="text-green-600 font-semibold">
            ▲ {a.riskEfficiency.toFixed(2)}
          </span>
        ) : (
          <span className="text-red-500 font-semibold">
            ▼ {Math.abs(a.riskEfficiency).toFixed(2)}
          </span>
        )}
      </div>

      {/* 확장된 실시간 지표 */}
      {isFocused && (
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-indigo-50 p-3 rounded-lg">
          <div>
            <b>수익률</b> {a.returnPct.toFixed(2)}%
          </div>
          <div>
            <b>변동성</b> {a.volatility.toFixed(2)}%
          </div>
          <div>
            <b>낙폭</b> {a.drawdown.toFixed(2)}%
          </div>
          <div>
            <b>효율성</b> {a.efficiency.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
};
export default TickerCard;
