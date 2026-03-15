import { useEffect, useState } from "react";

interface Props {
  taunt: string | null;
  onDismiss: () => void;
}

export default function OpponentDialog({ taunt, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (taunt) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [taunt, onDismiss]);

  // Always render the avatar - speech bubble is conditional
  return (
    <div className="flex items-center gap-3 h-12">
      {/* Avatar - always visible */}
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
        👺
      </div>

      {/* Speech bubble - only shown when there's a taunt */}
      <div
        className={`transition-all duration-300 ${
          taunt && visible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2 pointer-events-none"
        }`}
      >
        {taunt && (
          <div className="bg-gray-800 text-white text-sm rounded-xl px-4 py-2 max-w-xs relative">
            {taunt}
            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-800" />
          </div>
        )}
      </div>
    </div>
  );
}
