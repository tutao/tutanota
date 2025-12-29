import m, { Component, Vnode } from "mithril"
import { theme } from "../../gui/theme"
import { AllIcons, Icon, IconSize } from "../../gui/base/Icon"

const DEFAULT_SCRAMBLE_CHARS = "#$%&*?@/\\+=-_~<>[]{}"

export interface InfoBoxItem {
	icon: AllIcons
	text: string
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

	/** Animation speed per step. Default: 22ms */
	tickMs?: number

	/** Characters used during scrambling. */
	scrambleChars?: string

	/** Optional extra class(es) on the outer box. */
	class?: string

	/** Optional style overrides for the outer box. */
	style?: Record<string, string | number | undefined>
}

type Pos = { r: number; c: number }

export class SignupWizardInfoBox implements Component<SignupWizardInfoBoxAttrs> {
	private currentItems: InfoBoxItem[] = []

	// Animation state
	private phase: "idle" | "scramble" | "reveal" = "idle"
	private timer: number | null = null
	private tickMs = 22
	private scrambleChars = DEFAULT_SCRAMBLE_CHARS

	private displayIcons: AllIcons[] = []
	private displayChars: string[][] = []

	private toIcons: AllIcons[] = []
	private toPadded: string[] = []

	private positions: Pos[] = []
	private step = 0

	private readonly sink = (nextItems: InfoBoxItem[]) => this.animateTo(nextItems)

	oninit(vnode: Vnode<SignupWizardInfoBoxAttrs>) {
		this.tickMs = vnode.attrs.tickMs ?? 22
		this.scrambleChars = vnode.attrs.scrambleChars ?? DEFAULT_SCRAMBLE_CHARS

		this.currentItems = vnode.attrs.initialItems ?? []
		this.displayIcons = this.currentItems.map((it) => it.icon)
		this.displayChars = this.currentItems.map((it) => (it.text ?? "").split(""))

		vnode.attrs.controller?._attach(this.sink)
	}

	onbeforeupdate(vnode: Vnode<SignupWizardInfoBoxAttrs>, old: Vnode<SignupWizardInfoBoxAttrs>) {
		this.tickMs = vnode.attrs.tickMs ?? 22
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
		const items = this.phase === "idle" ? this.currentItems : this.buildDisplayItems()
		const isTransitioning = this.phase !== "idle"

		return m(
			".abs.border-radius-16.flex.col.gap-16.plr-24.pt-24.pb-24",
			{
				class: vnode.attrs.class,
				style: {
					width: "100%",
					"background-color": theme.surface_container_high,
					bottom: 0,
					...vnode.attrs.style,
				},
			},
			items.map((it, idx) => {
				const icon = it.icon ? m(Icon, { icon: it.icon, size: IconSize.PX24 }) : null
				return m(".flex.row.gap-8.items-center", { key: idx }, [
					icon,
					m("span", { style: isTransitioning ? { "white-space": "nowrap" } : undefined }, it.text),
				])
			}),
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

		const fromIcons: AllIcons[] = []
		const toIcons: AllIcons[] = []
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
					this.timer = window.setTimeout(tick, this.tickMs)
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
			this.timer = window.setTimeout(tick, this.tickMs)
		}

		this.timer = window.setTimeout(tick, this.tickMs)
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
