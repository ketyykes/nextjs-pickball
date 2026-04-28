export interface RuleCard {
	id: string;
	title: string;
	body: string;
}

export const RULE_CARDS: readonly RuleCard[] = [
	{
		id: "kitchen",
		title: "Kitchen（禁打高球區）規則",
		body: "球落在 Kitchen 區域內時，必須等球落地一次（bounce）後才能擊球。直接 volley 視為違規。",
	},
] as const;

export const KITCHEN_RULE_TIP =
	"提示：球若落在綠色區域（Kitchen）內，記得等它彈一次再打！";
