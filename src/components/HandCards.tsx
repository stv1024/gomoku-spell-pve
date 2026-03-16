import type { HandCard } from "../types";

interface Props {
  hand: HandCard[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled: boolean;
  skillUsedThisTurn: boolean;
}

const RARITY_BORDER = {
  common: "border-gray-300",
  rare: "border-blue-400",
  epic: "border-amber-400",
};

const RARITY_SELECTED = {
  common: "border-yellow-400 bg-yellow-50 shadow-yellow-300 shadow-md",
  rare: "border-blue-300 bg-blue-50 shadow-blue-300 shadow-md",
  epic: "border-amber-300 bg-amber-50 shadow-amber-300 shadow-md",
};

const RARITY_DOT = {
  common: "bg-gray-400",
  rare: "bg-blue-400",
  epic: "bg-amber-400",
};

export default function HandCards({
  hand,
  selectedCardId,
  onSelectCard,
  disabled,
  skillUsedThisTurn,
}: Props) {
  if (hand.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-2 justify-center">
      {hand.map((card) => {
        const isSelected = selectedCardId === card.id;
        const isDisabled = disabled || skillUsedThisTurn;
        const rarity = card.skill.rarity;
        return (
          <button
            key={card.id}
            disabled={isDisabled}
            onClick={() => onSelectCard(card.id)}
            className={`
              flex-shrink-0 w-28 rounded-lg p-2 text-center border-2 transition-all
              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"}
              ${
                isSelected
                  ? RARITY_SELECTED[rarity]
                  : `${RARITY_BORDER[rarity]} bg-white hover:border-blue-400`
              }
            `}
          >
            <div className="flex items-center justify-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${RARITY_DOT[rarity]}`} />
              <span className="text-base font-bold text-gray-800">{card.skill.name}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{card.skill.description}</div>
            <div className="text-xs text-amber-600 mt-1 italic leading-tight">{card.skill.flavor}</div>
          </button>
        );
      })}
    </div>
  );
}
