import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { AttendeeListEditor } from "./AttendeeListEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { EventTimeEditor, EventTimeEditorAttrs } from "./EventTimeEditor.js"
import { defaultCalendarColor, TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { AlarmInterval } from "../../../../common/calendar/date/CalendarUtils.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { HtmlEditor } from "../../../../common/gui/editor/HtmlEditor.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../../common/gui/base/InfoBanner.js"
import { CalendarEventModel, CalendarOperation, ReadonlyReason } from "../eventeditor-model/CalendarEventModel.js"
import { getSharedGroupName } from "../../../../common/sharing/GroupUtils.js"
import { RemindersEditor, RemindersEditorAttrs } from "../RemindersEditor.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../../../../common/gui/base/SingleLineTextField.js"
import { px, size } from "../../../../common/gui/size.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { Select, SelectAttributes, SelectOption } from "../../../../common/gui/base/Select.js"
import { Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"
import { deepEqual } from "@tutao/tutanota-utils"
import { ButtonColor, getColors } from "../../../../common/gui/base/Button.js"
import stream from "mithril/stream"
import { RepeatRuleEditor, RepeatRuleEditorAttrs } from "./RepeatRuleEditor.js"
import type { CalendarRepeatRule } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { formatRepetitionEnd, formatRepetitionFrequency } from "../eventpopup/EventPreviewView.js"

export type CalendarEventEditViewAttrs = {
	model: CalendarEventModel
	groupColors: Map<Id, string>
	recipientsSearch: RecipientsSearchModel
	descriptionEditor: HtmlEditor
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
	defaultAlarms: Map<Id, AlarmInterval[]>
	navigationCallback: (targetPage: EditorPages, callBack?: (...args: any) => unknown) => unknown
	currentPage: stream<EditorPages>
}

export interface CalendarSelectItem extends SelectOption<CalendarInfo> {
	color: string
	name: string
}

export interface OrganizerSelectItem extends SelectOption<string> {
	name: string
	address: string
}

export enum EditorPages {
	MAIN,
	REPEAT_RULES,
	GUESTS,
}

/**
 * combines several semi-related editor components into a full editor for editing calendar events
 * to be displayed in a dialog.
 *
 * controls the enabling/disabling of certain editor components and the display of additional info
 * in the dialog depending on the type of the event being edited.
 */
export class CalendarEventEditView implements Component<CalendarEventEditViewAttrs> {
	private readonly timeFormat: TimeFormat
	private readonly startOfTheWeekOffset: number
	private readonly defaultAlarms: Map<Id, AlarmInterval[]>

	private transitionPage: EditorPages | null = null
	private hasAnimationEnded = true
	private pages: Map<EditorPages, (...args: any) => Children> = new Map()
	private pagesWrapperDomElement!: HTMLElement
	private allowRenderMainPage: boolean = true
	private dialogHeight: number | null = null
	private pageStreamListener: stream<void> | null

	constructor(vnode: Vnode<CalendarEventEditViewAttrs>) {
		this.timeFormat = vnode.attrs.timeFormat
		this.startOfTheWeekOffset = vnode.attrs.startOfTheWeekOffset
		this.defaultAlarms = vnode.attrs.defaultAlarms

		if (vnode.attrs.model.operation == CalendarOperation.Create) {
			const initialAlarms = vnode.attrs.defaultAlarms.get(vnode.attrs.model.editModels.whoModel.selectedCalendar.group._id) ?? []
			vnode.attrs.model.editModels.alarmModel.addAll(initialAlarms)
		}

		this.pages.set(EditorPages.REPEAT_RULES, this.renderRepeatRulesPage)
		this.pages.set(EditorPages.GUESTS, this.renderGuestsPage)
		this.pageStreamListener = vnode.attrs.currentPage.map((newPage) => {
			this.transitionTo(newPage)
		})
	}

	onremove() {
		this.pageStreamListener?.end(true)
		this.pageStreamListener = null
	}

	oncreate(vnode: VnodeDOM<CalendarEventEditViewAttrs>): any {
		this.pagesWrapperDomElement = vnode.dom as HTMLElement

		this.pagesWrapperDomElement.addEventListener("transitionend", () => {
			if (vnode.attrs.currentPage() !== EditorPages.MAIN) {
				this.allowRenderMainPage = false
				m.redraw()
				return
			}

			this.transitionPage = vnode.attrs.currentPage()
			this.hasAnimationEnded = true
			this.allowRenderMainPage = true
			m.redraw()
		})
	}

	onupdate(vnode: VnodeDOM<CalendarEventEditViewAttrs>): any {
		const dom = vnode.dom as HTMLElement
		if (this.dialogHeight == null) {
			this.dialogHeight = dom.clientHeight
			;(vnode.dom as HTMLElement).style.height = px(this.dialogHeight)
		}
	}

	view(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		return m(".flex.gap-vpad-xxl.fit-content.transition-transform", [this.renderMainPage(vnode), this.renderPage(vnode)])
	}

	private renderPage(vnode: Vnode<CalendarEventEditViewAttrs>) {
		if (this.hasAnimationEnded || this.transitionPage == null) {
			return this.pages.get(vnode.attrs.currentPage())?.apply(this, [vnode])
		}

		return this.pages.get(this.transitionPage)?.apply(this, [vnode])
	}

	private renderGuestsPage({ attrs: { model, recipientsSearch } }: Vnode<CalendarEventEditViewAttrs>) {
		return m(AttendeeListEditor, {
			recipientsSearch,
			logins: locator.logins,
			model,
			width: this.getPageWidth(),
		})
	}

	private renderTitle(attrs: CalendarEventEditViewAttrs): Children {
		const { model } = attrs
		return m(
			Card,
			{
				style: {
					padding: "0",
				},
			},
			m(SingleLineTextField, {
				value: model.editModels.summary.content,
				oninput: (newValue: string) => {
					model.editModels.summary.content = newValue
				},
				ariaLabel: lang.get("title_placeholder"),
				placeholder: lang.get("title_placeholder"),
				disabled: !model.isFullyWritable(),
				style: {
					fontSize: px(size.font_size_base * 1.25), // Overriding the component style
				},
			} satisfies SingleLineTextFieldAttrs),
		)
	}

	private renderReadonlyMessage(attrs: CalendarEventEditViewAttrs): Children {
		const { model } = attrs
		const makeMessage = (message: TranslationKey): Children =>
			m(InfoBanner, {
				message: () => m(".small.selectable", lang.get(message)),
				icon: Icons.People,
				type: BannerType.Info,
				buttons: [],
			} satisfies InfoBannerAttrs)

		switch (model.getReadonlyReason()) {
			case ReadonlyReason.SHARED:
				return makeMessage("cannotEditFullEvent_msg")
			case ReadonlyReason.SINGLE_INSTANCE:
				return makeMessage("cannotEditSingleInstance_msg")
			case ReadonlyReason.NOT_ORGANIZER:
				return makeMessage("cannotEditNotOrganizer_msg")
			case ReadonlyReason.UNKNOWN:
				return makeMessage("cannotEditEvent_msg")
			case ReadonlyReason.NONE:
				return null
		}
	}

	private renderEventTimeEditor(attrs: CalendarEventEditViewAttrs): Children {
		return m(
			Card,
			m(EventTimeEditor, {
				editModel: attrs.model.editModels.whenModel,
				timeFormat: this.timeFormat,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				disabled: !attrs.model.isFullyWritable(),
			} satisfies EventTimeEditorAttrs),
		)
	}

	private renderRepeatRuleNavButton({ model, navigationCallback }: CalendarEventEditViewAttrs): Children {
		const disabled = !model.canEditSeries()
		return m(
			Card,
			m(".flex.gap-vpad-s", [
				m(".flex.items-center", [
					m(Icon, {
						icon: Icons.Sync,
						style: { fill: getColors(ButtonColor.Content).button },
						title: lang.get("calendarRepeating_label"),
						size: IconSize.Medium,
					}),
				]),
				m(
					"button.flex.items-center.justify-between.flex-grow",
					{
						onclick: (event: MouseEvent) => {
							navigationCallback(EditorPages.REPEAT_RULES)
						},
						disabled,
						class: disabled ? "disabled cursor-disabled" : "",
					},
					[
						this.getTranslatedRepeatRule(model.editModels.whenModel.result.repeatRule, model.editModels.whenModel.isAllDay),
						m(Icon, {
							icon: Icons.ArrowDropRight,
							class: "flex items-center",
							style: { fill: getColors(ButtonColor.Content).button },
							title: lang.get("calendarRepeating_label"),
							size: IconSize.Medium,
						}),
					],
				),
			]),
		)
	}

	private renderGuestsNavButton({ navigationCallback }: CalendarEventEditViewAttrs): Children {
		return m(
			Card,
			m(".flex.gap-vpad-s", [
				m(".flex.items-center", [
					m(Icon, {
						icon: Icons.People,
						style: { fill: getColors(ButtonColor.Content).button },
						title: lang.get("calendarRepeating_label"),
						size: IconSize.Medium,
					}),
				]),
				m(
					"button.flex.items-center.justify-between.flex-grow",
					{
						onclick: (event: MouseEvent) => {
							navigationCallback(EditorPages.GUESTS)
						},
					},
					[
						lang.get("guests_label"),
						m(Icon, {
							icon: Icons.ArrowDropRight,
							class: "flex items-center",
							style: { fill: getColors(ButtonColor.Content).button },
							title: lang.get("guests_label"),
							size: IconSize.Medium,
						}),
					],
				),
			]),
		)
	}

	private renderCalendarPicker(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model, groupColors } = vnode.attrs
		const availableCalendars = model.editModels.whoModel.getAvailableCalendars()

		const options: CalendarSelectItem[] = availableCalendars.map((calendarInfo) => {
			const name = getSharedGroupName(calendarInfo.groupInfo, model.userController, calendarInfo.shared)
			return {
				name,
				color: "#" + (groupColors.get(calendarInfo.group._id) ?? defaultCalendarColor),
				value: calendarInfo,
				ariaValue: name,
			}
		})

		const selectedCalendarInfo = model.editModels.whoModel.selectedCalendar
		const selectedCalendarName = getSharedGroupName(selectedCalendarInfo.groupInfo, model.userController, selectedCalendarInfo.shared)
		let selected: CalendarSelectItem = {
			name: selectedCalendarName,
			color: "#" + (groupColors.get(selectedCalendarInfo.group._id) ?? defaultCalendarColor),
			value: model.editModels.whoModel.selectedCalendar,
			ariaValue: selectedCalendarName,
		}
		return m(
			Card,
			m(Select<CalendarSelectItem, CalendarInfo>, {
				onchange: (val) => {
					model.editModels.alarmModel.removeAll()
					model.editModels.alarmModel.addAll(this.defaultAlarms.get(val.value.group._id) ?? [])
					model.editModels.whoModel.selectedCalendar = val.value
				},
				options: stream(options),
				expanded: true,
				selected,
				renderOption: (option) => this.renderCalendarOptions(option, deepEqual(option.value, selected.value), false),
				renderDisplay: (option) => this.renderCalendarOptions(option, false, true),
				ariaLabel: lang.get("calendar_label"),
				disabled: !model.canChangeCalendar() || availableCalendars.length < 2,
			} satisfies SelectAttributes<CalendarSelectItem, CalendarInfo>),
		)
	}

	private renderCalendarOptions(option: CalendarSelectItem, isSelected: boolean, isDisplay: boolean) {
		return m(".flex.items-center.gap-vpad-s.flex-grow", { class: `${isDisplay ? "" : "state-bg plr-button button-content dropdown-button pt-s pb-s"}` }, [
			m("div", {
				style: {
					width: px(size.hpad_large),
					height: px(size.hpad_large),
					borderRadius: "50%",
					backgroundColor: option.color,
					marginInline: px(size.vpad_xsm / 2),
				},
			}),
			m("span", { style: { color: isSelected ? theme.content_button_selected : undefined } }, option.name),
		])
	}

	private renderRemindersEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		if (!vnode.attrs.model.editModels.alarmModel.canEditReminders) return null
		const { alarmModel } = vnode.attrs.model.editModels

		return m(
			Card,
			m(".flex.gap-vpad-s", [
				m(
					".flex",
					{
						class: alarmModel.alarms.length === 0 ? "items-center" : "items-start",
					},
					[
						m(Icon, {
							icon: Icons.Clock,
							style: { fill: getColors(ButtonColor.Content).button },
							title: lang.get("reminderBeforeEvent_label"),
							size: IconSize.Medium,
						}),
					],
				),
				m(RemindersEditor, {
					alarms: alarmModel.alarms,
					addAlarm: alarmModel.addAlarm.bind(alarmModel),
					removeAlarm: alarmModel.removeAlarm.bind(alarmModel),
					label: "reminderBeforeEvent_label",
					useNewEditor: true,
				} satisfies RemindersEditorAttrs),
			]),
		)
	}

	private renderLocationField(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model } = vnode.attrs
		return m(
			Card,
			{
				style: { padding: "0" },
			},
			m(
				".flex.gap-vpad-s.items-center",
				m(SingleLineTextField, {
					value: model.editModels.location.content,
					oninput: (newValue: string) => {
						model.editModels.location.content = newValue
					},
					ariaLabel: lang.get("location_label"),
					placeholder: lang.get("location_label"),
					disabled: !model.isFullyWritable(),
					leadingIcon: {
						icon: Icons.Pin,
						color: getColors(ButtonColor.Content).button,
					},
				}),
			),
		)
	}

	private renderDescriptionEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		return m(
			Card,
			{
				classes: ["child-text-editor", "rel"],
				style: {
					padding: "0",
				},
			},
			[
				vnode.attrs.descriptionEditor.isEmpty() && !vnode.attrs.descriptionEditor.isActive()
					? m("span.text-editor-placeholder", lang.get("description_label"))
					: null,
				m(vnode.attrs.descriptionEditor),
			],
		)
	}

	private renderMainPage(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		if (!this.allowRenderMainPage) {
			return m("", {
				style: {
					width: px(this.getPageWidth()),
				},
			})
		}

		return m(
			".pb.pt.flex.col.gap-vpad.fit-height.box-content",
			{
				style: {
					// The date picker dialogs have position: fixed, and they are fixed relative to the most recent ancestor with
					// a transform. So doing a no-op transform will make the dropdowns scroll with the dialog
					// without this, then the date picker dialogs will show at the same place on the screen regardless of whether the
					// editor has scrolled or not.
					// Ideally we could do this inside DatePicker itself, but the rendering breaks and the dialog appears below it's siblings
					// We also don't want to do this for all dialogs because it could potentially cause other issues
					transform: "translate(0)",
					color: theme.button_bubble_fg,
					width: px(this.getPageWidth()),
					"pointer-events": `${this.allowRenderMainPage ? "auto" : "none"}`,
				},
			},
			[
				this.renderReadonlyMessage(vnode.attrs),
				this.renderTitle(vnode.attrs),
				this.renderEventTimeEditor(vnode.attrs),
				this.renderCalendarPicker(vnode),
				this.renderRepeatRuleNavButton(vnode.attrs),
				this.renderRemindersEditor(vnode),
				this.renderGuestsNavButton(vnode.attrs),
				this.renderLocationField(vnode),
				this.renderDescriptionEditor(vnode),
			],
		)
	}

	private renderRepeatRulesPage({ attrs: { model } }: Vnode<CalendarEventEditViewAttrs>) {
		const { whenModel } = model.editModels

		return m(RepeatRuleEditor, {
			model: whenModel,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			width: this.getPageWidth(),
		} satisfies RepeatRuleEditorAttrs)
	}

	private getPageWidth() {
		if (!this.pagesWrapperDomElement) return 0
		const parentComputedStyle = getComputedStyle(this.pagesWrapperDomElement.parentElement!)
		return Number(parentComputedStyle.width.slice(0, -2)) - Number(parentComputedStyle.paddingLeft.slice(0, -2)) * 2
	}

	private transitionTo(targetPage: EditorPages) {
		if (!this.pagesWrapperDomElement) return

		this.hasAnimationEnded = false

		if (targetPage === EditorPages.MAIN) {
			this.allowRenderMainPage = true
			this.pagesWrapperDomElement.style.transform = "translateX(0px)"
			return
		}

		this.transitionPage = targetPage
		const parentComputedStyle = getComputedStyle(this.pagesWrapperDomElement)
		const pageWidth = this.getPageWidth()
		const gapBetweenPages = Number(parentComputedStyle.gap.slice(0, -2))
		this.pagesWrapperDomElement.style.transform = `translateX(-${pageWidth + gapBetweenPages}px)`
	}

	private getTranslatedRepeatRule(rule: CalendarRepeatRule | null, isAllDay: boolean): string {
		if (rule == null) return lang.get("calendarRepeatIntervalNoRepeat_label")

		const frequency = formatRepetitionFrequency(rule)
		return frequency ? frequency + formatRepetitionEnd(rule, isAllDay) : lang.get("unknownRepetition_msg")
	}
}
