import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { AttendeeListEditor } from "./AttendeeListEditor.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { EventTimeEditor, EventTimeEditorAttrs } from "./EventTimeEditor.js"
import { DEFAULT_CALENDAR_COLOR, RepeatPeriod, TabIndex, TimeFormat, Weekday } from "../../../../common/api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { RecipientsSearchModel } from "../../../../common/misc/RecipientsSearchModel.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import { AlarmInterval } from "../../../../common/calendar/date/CalendarUtils.js"
import { HtmlEditor } from "../../../../common/gui/editor/HtmlEditor.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../../common/gui/base/InfoBanner.js"
import { CalendarEventModel, CalendarOperation, ReadonlyReason } from "../eventeditor-model/CalendarEventModel.js"
import { getSharedGroupName } from "../../../../common/sharing/GroupUtils.js"
import { RemindersEditor, RemindersEditorAttrs } from "../RemindersEditor.js"
import { SingleLineTextField } from "../../../../common/gui/base/SingleLineTextField.js"
import { px, size } from "../../../../common/gui/size.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { Select, SelectAttributes, SelectOption } from "../../../../common/gui/base/Select.js"
import { Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"
import { deepEqual } from "@tutao/tutanota-utils"
import { ButtonColor, getColors } from "../../../../common/gui/base/Button.js"
import stream from "mithril/stream"
import { RepeatRuleEditor, RepeatRuleEditorAttrs } from "./RepeatRuleEditor.js"
import { CalendarRepeatRule } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { formatRepetitionEnd, formatRepetitionFrequency } from "../eventpopup/EventPreviewView.js"
import { TextFieldType } from "../../../../common/gui/base/TextField.js"
import { DefaultAnimationTime } from "../../../../common/gui/animation/Animations.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { SectionButton } from "../../../../common/gui/base/buttons/SectionButton.js"

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
	private allowRenderMainPage: stream<boolean> = stream(true)
	private dialogHeight: number | null = null
	private pageWidth: number = -1
	private translate = 0

	constructor(vnode: Vnode<CalendarEventEditViewAttrs>) {
		this.timeFormat = vnode.attrs.timeFormat
		this.startOfTheWeekOffset = vnode.attrs.startOfTheWeekOffset
		this.defaultAlarms = vnode.attrs.defaultAlarms

		if (vnode.attrs.model.operation === CalendarOperation.Create) {
			const initialAlarms = vnode.attrs.defaultAlarms.get(vnode.attrs.model.editModels.whoModel.selectedCalendar.group._id) ?? []
			vnode.attrs.model.editModels.alarmModel.addAll(initialAlarms)
		}

		this.pages.set(EditorPages.REPEAT_RULES, this.renderRepeatRulesPage)
		this.pages.set(EditorPages.GUESTS, this.renderGuestsPage)

		vnode.attrs.currentPage.map((page) => {
			this.hasAnimationEnded = false

			if (page === EditorPages.MAIN) {
				this.allowRenderMainPage(true)
				this.translate = 0
			}
		})

		this.allowRenderMainPage.map((allowRendering) => {
			return this.handleEditorStatus(allowRendering, vnode)
		})
	}

	onremove(vnode: Vnode<CalendarEventEditViewAttrs>) {
		vnode.attrs.currentPage.end(true)
		this.allowRenderMainPage.end(true)
	}

	private handleEditorStatus(allowRendering: boolean, vnode: Vnode<CalendarEventEditViewAttrs>) {
		if (allowRendering && vnode.attrs.currentPage() === EditorPages.MAIN) {
			if (vnode.attrs.descriptionEditor.editor.domElement) {
				vnode.attrs.descriptionEditor.editor.domElement.tabIndex = Number(TabIndex.Default)
			}
			return vnode.attrs.descriptionEditor.setEnabled(true)
		}
		if (vnode.attrs.descriptionEditor.editor.domElement) {
			vnode.attrs.descriptionEditor.editor.domElement.tabIndex = Number(TabIndex.Programmatic)
		}
		vnode.attrs.descriptionEditor.setEnabled(false)
	}

	oncreate(vnode: VnodeDOM<CalendarEventEditViewAttrs>): any {
		this.pagesWrapperDomElement = vnode.dom as HTMLElement

		this.pagesWrapperDomElement.addEventListener("transitionend", () => {
			if (vnode.attrs.currentPage() !== EditorPages.MAIN) {
				setTimeout(() => {
					this.allowRenderMainPage(false)
				}, DefaultAnimationTime)
				m.redraw()
				return
			}

			this.transitionPage = vnode.attrs.currentPage()
			this.hasAnimationEnded = true

			setTimeout(() => {
				this.allowRenderMainPage(true)
				m.redraw()
			}, DefaultAnimationTime)
		})
	}

	onupdate(vnode: VnodeDOM<CalendarEventEditViewAttrs>): any {
		const dom = vnode.dom as HTMLElement
		if (this.dialogHeight == null && dom.parentElement) {
			this.dialogHeight = dom.parentElement.clientHeight
			;(vnode.dom as HTMLElement).style.height = px(this.dialogHeight)
		}

		if (this.pageWidth === -1 && dom.parentElement) {
			this.pageWidth = dom.parentElement.clientWidth - size.hpad_large * 2
			// Twice the page width (Main Page + Guests/Repeat) plus the gap between pages (64px)
			;(vnode.dom as HTMLElement).style.width = px(this.pageWidth * 2 + size.vpad_xxl)
			m.redraw()
		}
	}

	view(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		return m(
			".flex.gap-vpad-xxl.fit-content.transition-transform",
			{
				style: {
					transform: `translateX(${this.translate}px)`,
				},
			},
			[this.renderMainPage(vnode), this.renderPage(vnode)],
		)
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
			width: this.pageWidth,
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
				oninput: (newValue: any) => {
					model.editModels.summary.content = newValue
				},
				ariaLabel: lang.get("title_placeholder"),
				placeholder: lang.get("title_placeholder"),
				disabled: !model.isFullyWritable(),
				style: {
					fontSize: px(size.font_size_base * 1.25), // Overriding the component style
				},
				type: TextFieldType.Text,
			}),
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
		const padding = px(size.vpad_small)
		const { whenModel } = attrs.model.editModels
		return m(
			Card,
			{ style: { padding: `${padding} 0 ${padding} ${padding}` } },
			m(EventTimeEditor, {
				editModel: whenModel,
				timeFormat: this.timeFormat,
				startOfTheWeekOffset: this.startOfTheWeekOffset,
				disabled: !attrs.model.isFullyWritable(),
				dateSelectionChanged: (date: Date) => {
					whenModel.startDate = date
					if (whenModel.repeatPeriod === RepeatPeriod.MONTHLY) whenModel.resetMonthlyByDayRules(date)
				},
			} satisfies EventTimeEditorAttrs),
		)
	}

	private renderRepeatRuleNavButton({ model, navigationCallback }: CalendarEventEditViewAttrs): Children {
		const repeatRuleText = this.getTranslatedRepeatRule(model.editModels.whenModel.result.repeatRule, model.editModels.whenModel.isAllDay)
		return m(SectionButton, {
			leftIcon: { icon: Icons.Sync, title: "calendarRepeating_label" },
			text: lang.makeTranslation(repeatRuleText, repeatRuleText),
			isDisabled: !model.canEditSeries(),
			classes: "overflow-hidden repeat-rule",
			onclick: () => {
				this.transitionTo(EditorPages.REPEAT_RULES, navigationCallback)
			},
		})
	}

	private transitionTo(target: EditorPages, navigationCallback: (targetPage: EditorPages) => unknown) {
		this.hasAnimationEnded = false
		this.transitionPage = target
		this.translate = -(this.pageWidth + size.vpad_xxl)
		navigationCallback(target)
	}

	private renderGuestsNavButton({ navigationCallback, model }: CalendarEventEditViewAttrs): Children {
		return m(SectionButton, {
			leftIcon: { icon: Icons.People, title: "calendarRepeating_label" },
			text: "guests_label",
			injectionRight: model.editModels.whoModel.guests.length > 0 ? m("span", model.editModels.whoModel.guests.length) : null,
			onclick: () => {
				this.transitionTo(EditorPages.GUESTS, navigationCallback)
			},
		})
	}

	private renderCalendarPicker(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		const { model, groupColors } = vnode.attrs
		const availableCalendars = model.editModels.whoModel.getAvailableCalendars()

		const options: CalendarSelectItem[] = availableCalendars.map((calendarInfo) => {
			const name = getSharedGroupName(calendarInfo.groupInfo, model.userController.userSettingsGroupRoot, calendarInfo.hasMultipleMembers)
			return {
				name,
				color: "#" + (groupColors.get(calendarInfo.group._id) ?? DEFAULT_CALENDAR_COLOR),
				value: calendarInfo,
				ariaValue: name,
			}
		})

		const selectedCalendarInfo = model.editModels.whoModel.selectedCalendar
		const selectedCalendarName = getSharedGroupName(
			selectedCalendarInfo.groupInfo,
			model.userController.userSettingsGroupRoot,
			selectedCalendarInfo.hasMultipleMembers,
		)
		let selected: CalendarSelectItem = {
			name: selectedCalendarName,
			color: "#" + (groupColors.get(selectedCalendarInfo.group._id) ?? DEFAULT_CALENDAR_COLOR),
			value: model.editModels.whoModel.selectedCalendar,
			ariaValue: selectedCalendarName,
		}
		return m(
			Card,
			{ style: { padding: "0" } },
			m(Select<CalendarSelectItem, CalendarInfo>, {
				onchange: (val) => {
					model.editModels.alarmModel.removeAll()
					model.editModels.alarmModel.addAll(this.defaultAlarms.get(val.value.group._id) ?? [])
					model.editModels.whoModel.selectedCalendar = val.value
				},
				options: stream(options),
				expanded: true,
				selected,
				classes: ["button-min-height", "pl-vpad-s", "pr-vpad-s"],
				renderOption: (option) => this.renderCalendarOptions(option, deepEqual(option.value, selected.value), false),
				renderDisplay: (option) => this.renderCalendarOptions(option, false, true),
				ariaLabel: lang.get("calendar_label"),
				disabled: !model.canChangeCalendar() || availableCalendars.length < 2,
			} satisfies SelectAttributes<CalendarSelectItem, CalendarInfo>),
		)
	}

	private renderCalendarOptions(option: CalendarSelectItem, isSelected: boolean, isDisplay: boolean) {
		return m(
			".flex.items-center.gap-vpad-s.flex-grow.overflow-hidden",
			{ class: `${isDisplay ? "" : "state-bg plr-button button-content dropdown-button pt-s pb-s button-min-height"}` },
			[
				m(".no-shrink", {
					style: {
						width: px(size.hpad_large),
						height: px(size.hpad_large),
						borderRadius: "50%",
						backgroundColor: option.color,
						marginInline: px(size.vpad_xsm / 2),
					},
				}),
				m(
					"span",
					{
						class: `${isDisplay ? "text-ellipsis" : ""}`,
						style: { color: isSelected ? theme.primary : undefined },
					},
					option.name,
				),
			],
		)
	}

	private renderRemindersEditor(vnode: Vnode<CalendarEventEditViewAttrs>): Children {
		if (!vnode.attrs.model.editModels.alarmModel.canEditReminders) return null
		const { alarmModel } = vnode.attrs.model.editModels

		return m(
			Card,
			{ classes: ["button-min-height", "flex", "items-center"] },
			m(".flex.gap-vpad-s.items-start.flex-grow", [
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
					classes: ["button-min-height"],
					ariaLabel: lang.get("location_label"),
					placeholder: lang.get("location_label"),
					disabled: !model.isFullyWritable(),
					leadingIcon: {
						icon: Icons.Pin,
						color: getColors(ButtonColor.Content).button,
					},
					type: TextFieldType.Text,
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
					color: theme.on_surface,
					"pointer-events": `${this.allowRenderMainPage() ? "auto" : "none"}`,
					width: px(this.pageWidth),
				},
			},
			[
				this.allowRenderMainPage()
					? m.fragment({}, [
							this.renderReadonlyMessage(vnode.attrs),
							this.renderTitle(vnode.attrs),
							this.renderEventTimeEditor(vnode.attrs),
							this.renderCalendarPicker(vnode),
							this.renderRepeatRuleNavButton(vnode.attrs),
							this.renderRemindersEditor(vnode),
							this.renderGuestsNavButton(vnode.attrs),
							this.renderLocationField(vnode),
						])
					: null,
				this.renderDescriptionEditor(vnode),
			],
		)
	}

	private renderRepeatRulesPage({ attrs: { model, navigationCallback } }: Vnode<CalendarEventEditViewAttrs>) {
		const { whenModel } = model.editModels

		return m(RepeatRuleEditor, {
			model: whenModel,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			width: this.pageWidth,
			backAction: () => {
				navigationCallback(EditorPages.MAIN)
			},
			writeWeekdaysToModel: (weekdays: Weekday[], interval?: number) => {
				whenModel.advancedRules = whenModel.createAdvancedRulesFromWeekdays(weekdays, interval)
				m.redraw()
			},
		} satisfies RepeatRuleEditorAttrs)
	}

	private getTranslatedRepeatRule(rule: CalendarRepeatRule | null, isAllDay: boolean): string {
		if (rule == null) return lang.get("calendarRepeatIntervalNoRepeat_label")

		const frequency = formatRepetitionFrequency(rule)
		return frequency ? frequency + formatRepetitionEnd(rule, isAllDay) : lang.get("unknownRepetition_msg")
	}
}
