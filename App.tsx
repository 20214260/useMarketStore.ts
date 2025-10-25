import { useEffect, useState } from "react";
import { useMarketStore } from "./hooks/useMarketStore";
import { startEngine, stopEngine } from "./engine/marketEngine";
import ChartPanel from "./components/ChartPanel";
import TickerCard from "./components/TickerCard";
import AiReportBox from "./components/AiReportBox";
import ResultPopup from "./components/ResultPopup";
import HelpPanel from "./components/HelpPanel";
import LiveRanking from "./components/LiveRanking";
import LiveEventUI from "./components/LiveEventUI";
import type { Asset, TickerKey } from "./hooks/useMarketStore";
import { scoreSinceSelection } from "./engine/skillScorer_temp";

export default function App() {
  const { assets } = useMarketStore();
  const list = Object.values(assets);
  const [focus, setFocus] = useState<Asset | null>(list[0] || null);

  const [phase, setPhase] =
    useState<"analysis" | "thinking" | "evaluating" | "result">("analysis");
  const [countdown, setCountdown] = useState(0);
  const [selected, setSelected] = useState<TickerKey | null>(null);
  const [evalStartPrices, setEvalStartPrices] = useState<Record<string, number> | null>(null);
  const [evalStartLens, setEvalStartLens] = useState<Record<string, number> | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [topKey, setTopKey] = useState<TickerKey | null>(null);

  useEffect(() => {
    startEngine();
    return () => stopEngine();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (phase === "thinking" && countdown === 0) {
      if (!selected) {
        setPhase("analysis");
        return;
      }
      if (!evalStartPrices || !evalStartLens) captureEvalStartNow();
      setPhase("evaluating");
      setCountdown(10);
      return;
    }

    if (phase === "evaluating" && countdown === 0) {
      if (evalStartPrices && evalStartLens) {
        const scored = scoreSinceSelection(
          evalStartPrices,
          evalStartLens,
          useMarketStore.getState().assets
        );
        setResults(scored);
      } else setResults([]);
      setPhase("result");
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "evaluating") return;

    const interval = setInterval(() => {
      const assetList = Object.values(assets);
      if (assetList.length === 0) return;

      const best = assetList.reduce((prev, curr) =>
        curr.riskEfficiency > prev.riskEfficiency ? curr : prev
      );

      setFocus(best);
      setTopKey(best.key);
    }, 300);

    return () => clearInterval(interval);
  }, [phase, assets]);

  const startThinking = () => {
    setSelected(null);
    setPhase("thinking");
    setCountdown(3);
  };

  const captureEvalStartNow = () => {
    const curr = useMarketStore.getState().assets;
    const startP: Record<string, number> = {};
    const startL: Record<string, number> = {};
    Object.keys(curr).forEach((k) => {
      startP[k] = curr[k as TickerKey].price;
      startL[k] = curr[k as TickerKey].history.length;
    });
    setEvalStartPrices(startP);
    setEvalStartLens(startL);
  };

  const handleCardClick = (a: Asset) => {
    setFocus({ ...a });
    if (phase === "thinking") {
      setSelected(a.key);
      captureEvalStartNow();
      setPhase("evaluating");
      setCountdown(10);
    }
  };

  const restart = () => {
    setPhase("analysis");
    setCountdown(0);
    setSelected(null);
    setEvalStartPrices(null);
    setEvalStartLens(null);
    setResults([]);
    setFocus(list[0] || null);
  };

  return (
    <div
      className={`min-h-screen p-6 flex flex-col  ${
        phase === "evaluating"
          ? "animate-bg-transition"
          : "bg-gradient-to-br from-indigo-100 via-sky-100 to-purple-100 transition-all duration-700"
      }`}
    >
      {/* 상단 */}
      <header className="flex items-center justify-between mb-5 px-4">
        <h1 className="text-3xl font-bold text-indigo-700">AI Stock Game 💹</h1>

        <div className="flex items-center gap-3">
          {phase === "analysis" && (
            <button
              onClick={startThinking}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
            >
              예측 확정하기 ▶ (3초)
            </button>
          )}
          {phase === "thinking" && (
            <div className="text-lg font-semibold text-indigo-700">
              🎯 선택 대기 중... 남은 시간 {countdown}s
            </div>
          )}
          {phase === "evaluating" && (
            <div className="text-lg font-semibold text-rose-700">
              ⏱ 평가 중... {countdown}s
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 flex gap-6 overflow-hidden">
        {/* 왼쪽: 종목 그리드 */}
        <section className="flex-1 grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 auto-rows-max">
          {list.map((a) => (
            <div
              key={a.key}
              onClick={() => {
                if (!isEvaluating) handleCardClick(a);
              }}
              className={`transition-all duration-300 cursor-pointer ${
                focus?.key === a.key ? "scale-105 z-10 shadow-xl" : "scale-100 opacity-90"
              }`}
            >
              <TickerCard a={a} focusKey={focus?.key} topKey={topKey} />
              <ChartPanel label={a.name} data={a.history} />
            </div>
          ))}
        </section>

        {/* 오른쪽: 리포트 + 도움말 */}
        <aside className="w-[360px] shrink-0 flex flex-col gap-4 transition-all duration-500">
          {focus && <AiReportBox focus={focus} />}
          {phase === "analysis" && <HelpPanel />}
          {phase === "evaluating" && <LiveRanking assets={list} topKey={topKey} />}

        </aside>
      </main>

      {/* 결과 팝업 */}
      {phase === "result" && (
        <ResultPopup results={results} selectedKey={selected} onClose={restart} />
      )}
    </div>
  );
}
