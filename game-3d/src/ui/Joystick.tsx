import { useEffect, useRef, useState } from "react";

export interface JoystickProps {
  onChange: (v: { x: number; z: number }) => void;
}

/**
 * Floating left-corner virtual joystick for touch devices.
 * Falls back to invisible / inert if no touch is detected on the device.
 */
export function Joystick({ onChange }: JoystickProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag || !ref.current) return;
      const dx = e.clientX - drag.ox;
      const dy = e.clientY - drag.oy;
      const limit = 50;
      const mag = Math.hypot(dx, dy);
      const k = mag > limit ? limit / mag : 1;
      const x = dx * k;
      const y = dy * k;
      setPos({ x, y });
      lastPos.current = { x: x / limit, y: y / limit };
      onChange({ x: x / limit, z: y / limit });
    };
    const up = () => {
      setDrag(null);
      setPos({ x: 0, y: 0 });
      lastPos.current = { x: 0, y: 0 };
      onChange({ x: 0, z: 0 });
    };
    if (drag) {
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
    }
  }, [drag, onChange]);

  return (
    <div
      ref={ref}
      className="joystick"
      onPointerDown={(e) => {
        e.preventDefault();
        setDrag({ ox: e.clientX, oy: e.clientY });
      }}
    >
      <div
        className="joystick-knob"
        style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
      />
    </div>
  );
}
