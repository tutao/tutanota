
import {assertMainOrNodeBoot} from "../api/common/Env"
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
import {TabIndex} from "../api/common/TutanotaConstants"
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

const enum AriaWindow {
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
export function dialogAttrs(labeledBy: string, describedBy: string): string {
    return `[role="${AriaWindow.Dialog}"][aria-modal=true][aria-labelledby="${labeledBy}"][aria-describedby="${describedBy}"]`
}
export function liveDataAttrs(): string {
    return `[aria-live="${AriaLiveData.Polite}"][aria-atomic=true]`
}
export function landmarkAttrs(role: AriaLandmarks, label?: string): string {
    // We disable outline for landmarks. Outlines are useful as a visual clue for users who use keyboard navigation (or similar). Landmarks
    // are screen reader function and can only be focused using special landmark menu, they are not in the tab index. This makes them
    // redundant.
    // As they are big elements which receive focus automatically we would like to avoid showing them when we don't have to.
    return `.hide-outline[role="${role}"][tabindex="${TabIndex.Programmatic}"]` + (label ? `[aria-label="${label}"]` : "")
}