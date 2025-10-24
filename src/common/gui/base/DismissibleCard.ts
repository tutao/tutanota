import m, { Child, Children, ClassComponent, Vnode } from "mithril"
import { Card } from "./Card"
import { HALF_SECOND_MS } from "../../api/common/TutanotaConstants"
import { SmoothProgressBar } from "./SmoothProgressBar"
import { theme } from "../theme"

export interface DismissableCardAttrs {
	rootElementType?: "div" | "section"
	classes?: Array<string>
	style?: Partial<Pick<CSSStyleDeclaration, "padding">>
	shouldDivide?: boolean
	dismissButton: Child
	dismissCallback: () => void
	time?: number
}

type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLElement, "style"> & DismissableCardAttrs>

/**
 * Simple card component
 * @see Component attributes: {CardAttrs}
 * @example
 * m(Card, {
 *     rootElementType: "section", // Changing the default root element
 *     classes: ["mt"], // Adding new styles
 *     style: {
 *         "font-size": px(size.font_size_base * 1.25) // Overriding the component style
 *     }
 * }, m("span", "Child span text")),
 */
export class DismissibleCard implements ClassComponent<DismissableCardAttrs> {
	private progress: number = 0
	private readonly step: number = 0.1
	private readonly interval: NodeJS.Timeout

	constructor({ attrs: { time = 5, dismissCallback } }: Vnode<DismissableCardAttrs>) {
		this.step = 1 / (time * 2)
		this.interval = setInterval(() => {
			console.log("Tick tack", this.progress, this.step)
			this.progress += this.step

			if (this.progress >= 1) {
				dismissCallback()
				clearInterval(this.interval)
			}
		}, HALF_SECOND_MS)
	}

	onremove() {
		clearInterval(this.interval)
	}

	view({ attrs, children }: Vnode<DismissableCardAttrs, this>): Children | void | null {
		return m(
			Card,
			{
				...attrs,
				style: {
					padding: "0px",
					...(attrs.style ?? {}),
				},
			},
			m(".flex.col.limit-width", [
				m(".flex.min-width-0.overflow-hidden.pl", [m(".min-width-0.flex.items-center.flex-grow", children), attrs.dismissButton]),
				m(
					".min-width-0.rel.limit-width.accent-bg",
					{
						style: {
							transform: "scale(-1, 1)",
							"-ms-transform": "scale(-1, 1)",
							"-webkit-transform": "scale(-1, 1)",
						},
					},
					m(SmoothProgressBar, { progress: this.progress, color: theme.surface }),
				),
			]),
		)
	}
}
