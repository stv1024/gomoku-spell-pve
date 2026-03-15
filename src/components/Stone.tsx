import type { Color } from "../types";

interface Props {
  color: Color;
}

export default function Stone({ color }: Props) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div
        className="rounded-full w-[80%] h-[80%]"
        style={
          color === "black"
            ? {
                background: "radial-gradient(circle at 35% 35%, #888, #111)",
                boxShadow: "1px 1px 3px rgba(0,0,0,0.5)",
              }
            : {
                background: "radial-gradient(circle at 35% 35%, #fff, #ccc)",
                boxShadow: "1px 1px 3px rgba(0,0,0,0.3)",
              }
        }
      />
    </div>
  );
}
