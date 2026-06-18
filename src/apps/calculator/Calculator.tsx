'use client';

import React, { useState, useCallback } from 'react';

interface CalculatorProps {
  windowId: string;
}

export default function Calculator({ windowId }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetOnNext, setResetOnNext] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showScientific, setShowScientific] = useState(false);

  const handleNumber = useCallback((num: string) => {
    if (resetOnNext) {
      setDisplay(num);
      setResetOnNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, resetOnNext]);

  const handleDecimal = useCallback(() => {
    if (resetOnNext) {
      setDisplay('0.');
      setResetOnNext(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, resetOnNext]);

  const handleOperator = useCallback((operator: string) => {
    const current = parseFloat(display);
    if (prev !== null && op) {
      const result = calculate(prev, current, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(operator);
    setResetOnNext(true);
  }, [display, prev, op]);

  const handleEquals = useCallback(() => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    const expression = `${prev} ${op} ${current} = ${result}`;
    setHistory(h => [expression, ...h].slice(0, 20));
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setResetOnNext(true);
  }, [display, prev, op]);

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      case '%': return a % b;
      case '^': return Math.pow(a, b);
      default: return b;
    }
  };

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setResetOnNext(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display]);

  const handleToggleSign = useCallback(() => {
    setDisplay(String(-parseFloat(display)));
  }, [display]);

  const handleScientific = useCallback((fn: string) => {
    const val = parseFloat(display);
    let result: number;
    switch (fn) {
      case 'sin': result = Math.sin(val * Math.PI / 180); break;
      case 'cos': result = Math.cos(val * Math.PI / 180); break;
      case 'tan': result = Math.tan(val * Math.PI / 180); break;
      case 'log': result = Math.log10(val); break;
      case 'ln': result = Math.log(val); break;
      case '√': result = Math.sqrt(val); break;
      case 'x²': result = val * val; break;
      case 'π': result = Math.PI; break;
      case 'e': result = Math.E; break;
      case '1/x': result = 1 / val; break;
      case '!': result = factorial(val); break;
      default: result = val;
    }
    setDisplay(String(parseFloat(result.toFixed(10))));
    setResetOnNext(true);
  }, [display]);

  const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  const CalcButton = ({ label, onClick, span = 1, variant = 'default' }: {
    label: string; onClick: () => void; span?: number;
    variant?: 'default' | 'operator' | 'accent' | 'scientific';
  }) => {
    const bg = {
      default: 'var(--bg-elevated)',
      operator: 'var(--bg-glass)',
      accent: 'var(--accent)',
      scientific: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
    }[variant];
    const color = variant === 'accent' ? 'white' : 'var(--text-primary)';

    return (
      <button
        className="rounded-xl text-sm font-medium transition-all active:scale-95 hover:brightness-110"
        style={{
          background: bg,
          color,
          gridColumn: `span ${span}`,
          height: '48px',
          border: '1px solid var(--border)',
        }}
        onClick={onClick}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col p-3 gap-3" style={{ background: 'var(--bg-surface)' }}>
      {/* Toggle scientific */}
      <div className="flex items-center justify-between">
        <button
          className="text-[10px] px-2 py-1 rounded-lg transition-all"
          style={{ background: showScientific ? 'var(--accent-muted)' : 'transparent', color: 'var(--text-secondary)' }}
          onClick={() => setShowScientific(!showScientific)}
        >
          {showScientific ? 'Standard' : 'Scientific'}
        </button>
        {op && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{prev} {op}</span>}
      </div>

      {/* Display */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="text-right text-3xl font-light tracking-tight overflow-x-auto"
          style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
        >
          {display}
        </div>
      </div>

      {/* Scientific buttons */}
      {showScientific && (
        <div className="grid grid-cols-5 gap-1.5">
          {['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e', '!'].map(fn => (
            <CalcButton key={fn} label={fn} onClick={() => handleScientific(fn)} variant="scientific" />
          ))}
        </div>
      )}

      {/* Main buttons */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        <CalcButton label="C" onClick={handleClear} variant="operator" />
        <CalcButton label="±" onClick={handleToggleSign} variant="operator" />
        <CalcButton label="%" onClick={() => handleOperator('%')} variant="operator" />
        <CalcButton label="÷" onClick={() => handleOperator('÷')} variant="accent" />

        <CalcButton label="7" onClick={() => handleNumber('7')} />
        <CalcButton label="8" onClick={() => handleNumber('8')} />
        <CalcButton label="9" onClick={() => handleNumber('9')} />
        <CalcButton label="×" onClick={() => handleOperator('×')} variant="accent" />

        <CalcButton label="4" onClick={() => handleNumber('4')} />
        <CalcButton label="5" onClick={() => handleNumber('5')} />
        <CalcButton label="6" onClick={() => handleNumber('6')} />
        <CalcButton label="-" onClick={() => handleOperator('-')} variant="accent" />

        <CalcButton label="1" onClick={() => handleNumber('1')} />
        <CalcButton label="2" onClick={() => handleNumber('2')} />
        <CalcButton label="3" onClick={() => handleNumber('3')} />
        <CalcButton label="+" onClick={() => handleOperator('+')} variant="accent" />

        <CalcButton label="0" onClick={() => handleNumber('0')} span={2} />
        <CalcButton label="." onClick={handleDecimal} />
        <CalcButton label="=" onClick={handleEquals} variant="accent" />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="max-h-20 overflow-y-auto space-y-0.5">
          {history.slice(0, 5).map((h, i) => (
            <div key={i} className="text-[10px] text-right px-2" style={{ color: 'var(--text-tertiary)' }}>
              {h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
