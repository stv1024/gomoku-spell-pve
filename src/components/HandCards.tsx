import type { HandCard } from "../types";

interface Props {
  hand: HandCard[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled: boolean;
  skillUsedThisTurn: boolean;
}

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
                  ? "border-yellow-400 bg-yellow-50 shadow-yellow-300 shadow-md"
                  : "border-gray-300 bg-white hover:border-blue-400"
              }
            `}
          >
            <div className="text-base font-bold text-gray-800">{card.skill.name}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{card.skill.description}</div>
            <div className="text-xs text-amber-600 mt-1 italic leading-tight">{card.skill.flavor}</div>
          </button>
        );
      })}
    </div>
  );
}
