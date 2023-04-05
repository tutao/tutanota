import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()

/**
 * Collections of utility functions to support Accessible Rich Internet Applications (ARIA).
 *
 * https://www.w3.org/TR/wai-aria-practices/
 * https://www.w3.org/TR/wai-aria-1.1/
 * https://webaim.org/techniques/aria/
 * https://www.w3.org/TR/wai-aria-1.1/
 *
 */
import { TabIndex } from "../api/common/TutanotaConstants"

// See: https://webaim.org/techniques/aria/#landmarks
export const enum AriaLandmarks {
	Banner = "banner",
	Search = "search",
	Navigation = "navigation",
	Main = "main",
	Complementary = "complementary",
	Contentinfo = "contentinfo",
	Region = "region",
}

export const enum AriaLiveRegions {
	Alert = "alert",
	Log = "log",
	Marquee = "Marquee",
	Status = "status",
	Timer = "timer",
}

export const enum AriaWindow {
	AlertDialog = "alertdialog",
	Dialog = "dialog",
}

const enum AriaLiveData {
	//default
	Off = "off",
	//	Indicates that updates to the region should be presented at the next graceful opportunity
	Polite = "polite",
	//region has the highest priority
	Assertive = "assertive",
}

export function liveDataAttrs(): string {
	return `[aria-live="${AriaLiveData.Polite}"][aria-atomic=true]`
}

export function landmarkAttrs(role: AriaLandmarks, label?: string): Record<string, string | undefined> {
	return {
		class: "hide-outline",
		role,
		tabindex: TabIndex.Programmatic,
		"aria-label": label,
	}
}
