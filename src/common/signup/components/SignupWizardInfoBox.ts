import m, { Component, Vnode } from "mithril"
import { theme } from "../../gui/theme"
import { AllIcons, Icon, IconSize } from "../../gui/base/Icon"
import { LoginButton } from "../../gui/base/buttons/LoginButton"
import { Translation } from "../../misc/LanguageViewModel"
import { px } from "../../gui/size"

const DEFAULT_SCRAMBLE_CHARS = "#$%&*?@/\\+=-_~<>[]{}"
const DEFAULT_TRANSITION_MS = 500

export interface InfoBoxItem {
	icon: InfoBoxIcon
	text: string
}

interface InfoBoxIcon {
	icon: AllIcons
	color: string
}

export class SignupWizardInfoBoxController {
	private _sink?: (nextItems: InfoBoxItem[]) => void

	setItems(nextItems: InfoBoxItem[]) {
		this._sink?.(nextItems)
	}

	_attach(sink: (nextItems: InfoBoxItem[]) => void) {
		this._sink = sink
	}

	_detach(sink: (nextItems: InfoBoxItem[]) => void) {
		if (this._sink === sink) this._sink = undefined
	}
}

export interface SignupWizardInfoBoxAttrs {
	controller?: SignupWizardInfoBoxController
	initialItems?: InfoBoxItem[]
	transitionMs?: number
	scrambleChars?: string
	class?: string
	style?: Record<string, string | number | undefined>
	buttonLabel?: Translation
	onClickButton?: () => void
}

type Pos = { r: number; c: number }

export class SignupWizardInfoBox implements Component<SignupWizardInfoBoxAttrs> {
	private currentItems: InfoBoxItem[] = []

	private phase: "idle" | "scramble" | "reveal" = "idle"
	private timer: number | null = null
	private transitionMs = DEFAULT_TRANSITION_MS
	private scrambleChars = DEFAULT_SCRAMBLE_CHARS

	private displayIcons: InfoBoxIcon[] = []
	private displayChars: string[][] = []

	private toIcons: InfoBoxIcon[] = []
	private toPadded: string[] = []

	private positions: Pos[] = []
	private step = 0

	private readonly sink = (nextItems: InfoBoxItem[]) => this.animateTo(nextItems)

	oninit(vnode: Vnode<SignupWizardInfoBoxAttrs>) {
		this.transitionMs = Math.max(1, vnode.attrs.transitionMs ?? DEFAULT_TRANSITION_MS)
		this.scrambleChars = vnode.attrs.scrambleChars ?? DEFAULT_SCRAMBLE_CHARS

		this.currentItems = vnode.attrs.initialItems ?? []
		this.displayIcons = this.currentItems.map((it) => it.icon)
		this.displayChars = this.currentItems.map((it) => (it.text ?? "").split(""))

		vnode.attrs.controller?._attach(this.sink)
	}

	onbeforeupdate(vnode: Vnode<SignupWizardInfoBoxAttrs>, old: Vnode<SignupWizardInfoBoxAttrs>) {
		this.transitionMs = Math.max(1, vnode.attrs.transitionMs ?? DEFAULT_TRANSITION_MS)
		this.scrambleChars = vnode.attrs.scrambleChars ?? DEFAULT_SCRAMBLE_CHARS

		if (vnode.attrs.controller !== old.attrs.controller) {
			old.attrs.controller?._detach(this.sink)
			vnode.attrs.controller?._attach(this.sink)
		}
		return true
	}

	onremove(vnode: Vnode<SignupWizardInfoBoxAttrs>) {
		this.cancel()
		vnode.attrs.controller?._detach(this.sink)
	}

	view(vnode: Vnode<SignupWizardInfoBoxAttrs>) {
		const { buttonLabel, onClickButton, style } = vnode.attrs
		const items = this.phase === "idle" ? this.currentItems : this.buildDisplayItems()
		const isTransitioning = this.phase !== "idle"

		return m(
			".abs.border-radius-16.flex.col.gap-16.plr-24.pt-24.pb-24",
			{
				class: vnode.attrs.class,
				style: {
					width: "100%",
					"background-color": theme.surface_container_high,
					top: px(380),
					...style,
				},
			},
			items.map((it, idx) => {
				const icon = it.icon ? m(Icon, { icon: it.icon.icon, size: IconSize.PX24, style: { fill: it.icon.color } }) : null
				return m(".flex.row.gap-8.items-center", { key: idx }, [
					icon,
					m("span", { style: isTransitioning ? { "white-space": "nowrap" } : undefined }, it.text),
				])
			}),
			buttonLabel &&
				onClickButton &&
				m(
					"",
					m(LoginButton, {
						label: buttonLabel,
						onclick: onClickButton,
						size: "md",
						width: "flex",
						style: {
							"background-color": theme.secondary_container,
							color: theme.on_secondary_container,
							"margin-inline": "auto",
						},
					}),
				),
		)
	}

	private buildDisplayItems(): InfoBoxItem[] {
		const rowCount = Math.max(this.displayIcons.length, this.displayChars.length, this.toIcons.length, this.toPadded.length)

		const items: InfoBoxItem[] = []
		for (let r = 0; r < rowCount; r++) {
			const icon = this.displayIcons[r] ?? null
			const chars = this.displayChars[r] ?? []
			items.push({
				icon,
				text: chars.join("").trimEnd(),
			})
		}
		return items
	}

	private animateTo(nextItemsRaw: InfoBoxItem[]) {
		const nextItems = (nextItemsRaw ?? []).map((it) => ({
			icon: it.icon ?? null,
			text: it.text ?? "",
		}))

		this.cancel()

		const fromItems = this.currentItems
		const rowCount = Math.max(fromItems.length, nextItems.length)

		const fromIcons: InfoBoxIcon[] = []
		const toIcons: InfoBoxIcon[] = []
		const fromTexts: string[] = []
		const toTexts: string[] = []

		for (let r = 0; r < rowCount; r++) {
			fromIcons[r] = fromItems[r]?.icon ?? null
			toIcons[r] = nextItems[r]?.icon ?? null
			fromTexts[r] = fromItems[r]?.text ?? ""
			toTexts[r] = nextItems[r]?.text ?? ""
		}

		this.displayIcons = fromIcons.slice()
		this.toIcons = toIcons.slice()

		this.displayChars = []
		this.toPadded = []

		this.positions = []
		for (let r = 0; r < rowCount; r++) {
			const from = fromTexts[r]
			const to = toTexts[r]
			const n = Math.max(from.length, to.length)

			const fromPad = from.padEnd(n, " ")
			const toPad = to.padEnd(n, " ")

			this.displayChars[r] = fromPad.split("")
			this.toPadded[r] = toPad

			for (let c = 0; c < n; c++) this.positions.push({ r, c })
		}

		const tickMs = this.computeTickMs(this.positions.length)
		this.shufflePositions(this.positions)
		this.step = 0
		this.phase = "scramble"

		const tick = () => {
			if (this.phase === "idle") return

			const pos = this.positions[this.step]
			if (!pos) {
				if (this.phase === "scramble") {
					// halfway point: swap icons + start revealing the real text
					this.displayIcons = this.toIcons.slice()
					this.phase = "reveal"
					this.step = 0
					m.redraw()
					this.timer = window.setTimeout(tick, tickMs)
					return
				}

				// done
				this.phase = "idle"
				this.currentItems = nextItems
				this.displayIcons = nextItems.map((it) => it.icon)
				this.displayChars = nextItems.map((it) => (it.text ?? "").split(""))
				m.redraw()
				return
			}

			const { r, c } = pos
			const row = this.displayChars[r] ?? (this.displayChars[r] = [])

			if (this.phase === "scramble") {
				row[c] = this.randomScrambleChar()
			} else {
				row[c] = (this.toPadded[r] ?? "")[c] ?? " "
			}

			this.step += 1
			m.redraw()
			this.timer = window.setTimeout(tick, tickMs)
		}

		this.timer = window.setTimeout(tick, tickMs)
	}

	private computeTickMs(positionCount: number): number {
		const totalSteps = Math.max(positionCount * 2 + 1, 1)
		const desiredMs = Math.max(this.transitionMs, 1)
		return Math.max(1, desiredMs / totalSteps)
	}

	private cancel() {
		if (this.timer !== null) {
			window.clearTimeout(this.timer)
			this.timer = null
		}
		this.phase = "idle"
	}

	private randomScrambleChar(): string {
		const s = this.scrambleChars
		return s[Math.floor(Math.random() * s.length)] ?? "#"
	}

	private shufflePositions(arr: Pos[]) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[arr[i], arr[j]] = [arr[j], arr[i]]
		}
	}
}
