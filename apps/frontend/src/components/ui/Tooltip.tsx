import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  /** Text content displayed inside the tooltip bubble */
  content: string;
  /** Element that triggers the tooltip on hover / tap */
  children: ReactNode;
  /** Preferred placement — defaults to "top" */
  side?: 'top' | 'bottom';
}

/**
 * Lightweight tooltip rendered via portal so it is never clipped
 * by overflow:hidden / overflow:auto ancestors.
 */
export const Tooltip = ({ content, children, side = 'top' }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const r = trigger.getBoundingClientRect();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;

    let top: number;
    if (side === 'bottom') {
      top = r.bottom + 8;
    } else {
      top = r.top - bh - 8;
    }

    let left = r.left + r.width / 2 - bw / 2;

    // Clamp horizontal so it doesn't overflow the viewport
    const pad = 8;
    if (left < pad) left = pad;
    if (left + bw > window.innerWidth - pad) left = window.innerWidth - pad - bw;

    setPos({ top, left });
  }, [side]);

  useEffect(() => {
    if (!visible) return;
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [visible, reposition]);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        bubbleRef.current && !bubbleRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex items-center"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
      >
        {children}
      </span>

      {createPortal(
        <div
          ref={bubbleRef}
          style={{ top: pos.top, left: pos.left }}
          className={`
            fixed z-[9999] pointer-events-none
            transition-all duration-150
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 invisible'}
          `}
        >
          <div className="bg-elevated border border-border text-text-main text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs w-max whitespace-normal leading-relaxed">
            {content}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
