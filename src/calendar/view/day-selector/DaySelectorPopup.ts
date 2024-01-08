import { modal, ModalComponent } from "../../../gui/base/Modal.js"
import { Shortcut } from "../../../misc/KeyManager.js"
import { PosRect } from "../../../gui/base/Dropdown.js"
import m, { Children } from "mithril"
import { Keys } from "../../../api/common/TutanotaConstants.js"
import { DaySelector } from "./DaySelector.js"
import { animations, opacity, transform, TransformEnum } from "../../../gui/animation/Animations.js"
import { ease } from "../../../gui/animation/Easing.js"
import { px } from "../../../gui/size.js"
import { formatMonthWithFullYear } from "../../../misc/Formatter.js"
import { theme } from "../../../gui/theme.js"
import { Icon } from "../../../gui/base/Icon.js"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { BootIcons } from "../../../gui/base/icons/BootIcons.js"
import { hexToRgb } from "../../../gui/base/Color.js"
import { incrementMonth } from "@tutao/tutanota-utils"
import { styles } from "../../../gui/styles.js"
import { DaysToEvents } from "../../date/CalendarEventsRepository.js"

export interface DaySelectorPopupAttrs {
	selectedDate: Date
	onDateSelected: (date: Date, dayClick: boolean) => unknown
	startOfTheWeekOffset: number
	eventsForDays: DaysToEvents
	highlightToday: boolean
	highlightSelectedWeek: boolean
}

export class DaySelectorPopup implements ModalComponent {
	private readonly _shortcuts: Shortcut[] = []
	private dom: HTMLElement | null = null
	private currentDate: Date

	/**
	 * @param rect The rect with coordinates about where the popup should be rendered
	 * @param attrs The attributes for the component
	 */
	constructor(private readonly rect: PosRect, private readonly attrs: DaySelectorPopupAttrs) {
		this.setupShortcuts()
		this.view = this.view.bind(this)
		this.currentDate = attrs.selectedDate
	}

	view(): Children {
		return m(
			".abs.elevated-bg.plr.pt-s.pb-m.border-radius.dropdown-shadow.flex.flex-column",
			{
				style: {
					opacity: "0",
					left: px(this.rect.left),
					top: px(this.rect.bottom),
				},
				tabIndex: 0,
				autoFocus: "true",
				oncreate: (vnode) => {
					this.dom = vnode.dom as HTMLElement

					animations.add(this.dom, [opacity(0, 1, true), transform(TransformEnum.Scale, 0.5, 1)], {
						easing: ease.out,
					})

					// We need a little timeout to focus the modal, this will wait
					// the necessary time to the popup be visible on screen
					setTimeout(() => this.dom?.focus(), 200)
				},
			},
			[
				this.renderPickerHeader(this.currentDate),
				m(".flex-grow.overflow-hidden", [
					m(DaySelector, {
						selectedDate: this.currentDate,
						onDateSelected: this.attrs.onDateSelected,
						wide: true,
						startOfTheWeekOffset: this.attrs.startOfTheWeekOffset,
						isDaySelectorExpanded: true,
						eventsForDays: this.attrs.eventsForDays,
						handleDayPickerSwipe: (isNext) => {
							this.onMonthChange(isNext)
							m.redraw()
						},
						showDaySelection: false,
						highlightToday: this.attrs.highlightToday,
						highlightSelectedWeek: this.attrs.highlightSelectedWeek,
						useNarrowWeekName: styles.isSingleColumnLayout(),
					}),
				]),
			],
		)
	}

	private renderPickerHeader(date: Date): Children {
		return m(".flex.flex-space-between.pb-s.items-center", [
			m(
				".b",
				{
					style: {
						fontSize: "14px",
						marginLeft: "6px",
					},
				},
				formatMonthWithFullYear(date),
			),
			m(".flex.items-center", [this.renderSwitchMonthArrowIcon(false), this.renderSwitchMonthArrowIcon(true)]),
		])
	}

	private renderSwitchMonthArrowIcon(forward: boolean): Children {
		const bgColor = hexToRgb(theme.content_button)
		return m(
			"button.icon.flex.justify-center.items-center.click.ml-s.state-bg",
			{
				onclick: () => this.onMonthChange(forward),
				style: {
					borderRadius: "50%",
					fill: theme.content_fg,
					width: "24px",
					height: "24px",
					tabIndex: 0,
				},
			},
			m(Icon, {
				icon: forward ? Icons.ArrowForward : BootIcons.Back,
				style: {
					fill: theme.content_fg,
				},
			}),
		)
	}

	private onMonthChange(forward: boolean) {
		this.currentDate = incrementMonth(this.currentDate, forward ? 1 : -1)
	}

	// Sets the content div (.main-view) to inert, disabling the ability to be focused, this traps the
	// focus to the popup, releasing it just when the popup is closed and the inert property removed.
	private turnTrapFocus(on: boolean) {
		const elementsQuery = document.getElementsByClassName("main-view")

		if (elementsQuery.length > 0) {
			const mainDiv = elementsQuery.item(0)
			if (on) mainDiv?.setAttribute("inert", "true")
			else mainDiv?.removeAttribute("inert")
		}
	}

	show() {
		this.turnTrapFocus(true)
		modal.display(this, false)
	}

	close() {
		this.turnTrapFocus(false)
		modal.remove(this)
	}

	backgroundClick(e: MouseEvent): void {
		this.turnTrapFocus(false)
		modal.remove(this)
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	onClose(): void {
		this.close()
	}

	shortcuts(): Shortcut[] {
		return this._shortcuts
	}

	popState(e: Event): boolean {
		this.turnTrapFocus(false)
		modal.remove(this)
		return false
	}

	private setupShortcuts() {
		const close: Shortcut = {
			key: Keys.ESC,
			exec: () => this.close(),
			help: "close_alt",
		}

		this._shortcuts.push(close)
	}
}
