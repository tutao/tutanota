import m, { Children, Component, Vnode } from "mithril"
import { px } from "../size.js"
import { isKeyPressed } from "../../misc/KeyManager.js"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"

export interface InfoIconAttrs {
	text: Children
}

export class InfoIcon implements Component<InfoIconAttrs> {
	private hovered = false
	private expanded: boolean = false

	view({ attrs }: Vnode<InfoIconAttrs>) {
		return m(
			"div.flex.justify-center.no-grow-no-shrink.overflow-visible",
			{
				"aria-pressed": String(this.expanded),
				tabindex: TabIndex.Default,
				role: "button",
				style: {
					"margin-top": px(1),
				},
				// we can't really do the state with pure CSS on mobile
				onclick: () => this.expand(),
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.ESC)) {
						this.listener(e)
					}
				},
				onfocusin: () => this.expand(),
				onfocusout: (e: Event) => this.listener(e),
				onmouseenter: () => (this.hovered = true),
				onmouseleave: () => (this.hovered = false),
			},
			m(
				".info-badge.tooltip",
				{
					expanded: String(this.expanded),
				},
				"i",
				m(
					"span.tooltiptext.break-word",
					{
						hidden: this.hovered || this.expanded ? undefined : "",
						role: "tooltip",
						style: {
							width: px(120),
							marginLeft: px(-120),
						},
					},
					attrs.text,
				),
			),
		)
	}

	private expand(): void {
		this.expanded = true
		document.addEventListener("click", this.listener, { capture: true })
	}

	private readonly listener = (e: Event) => {
		this.expanded = false
		document.removeEventListener("click", this.listener, { capture: true })
		e.stopPropagation()
		m.redraw()
	}
}
