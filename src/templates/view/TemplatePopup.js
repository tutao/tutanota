//@flow
import m from "mithril"
import type {ModalComponent} from "../../gui/base/Modal"
import {modal} from "../../gui/base/Modal"
import {px} from "../../gui/size"
import type {Shortcut} from "../../misc/KeyManager"
import {isKeyPressed} from "../../misc/KeyManager"
import type {PosRect} from "../../gui/base/Dropdown"
import {DomRectReadOnlyPolyfilled} from "../../gui/base/Dropdown"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {Keys, ShareCapability} from "../../api/common/TutanotaConstants"
import {TemplatePopupResultRow} from "./TemplatePopupResultRow"
import {Icons} from "../../gui/base/icons/Icons"
import {TemplateExpander} from "./TemplateExpander"
import type {LanguageCode} from "../../misc/LanguageViewModel"
import {lang, languageByCode} from "../../misc/LanguageViewModel"
import {windowFacade} from "../../misc/WindowFacade"
import type {EmailTemplate} from "../../api/entities/tutanota/EmailTemplate"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {SELECT_NEXT_TEMPLATE, SELECT_PREV_TEMPLATE, TEMPLATE_SHORTCUT_PREFIX, TemplatePopupModel} from "../model/TemplatePopupModel"
import {attachDropdown} from "../../gui/base/DropdownN"
import {debounce, downcast, neverNull, noOp} from "../../api/common/utils/Utils"
import {locator} from "../../api/main/MainLocator"
import type {TemplateGroupRoot} from "../../api/entities/tutanota/TemplateGroupRoot"
import {TemplateGroupRootTypeRef} from "../../api/entities/tutanota/TemplateGroupRoot"
import {TemplateSearchBar} from "./TemplateSearchBar"
import {Editor} from "../../gui/editor/Editor"
import {logins} from "../../api/main/LoginController"
import {getSharedGroupName, hasCapabilityOnGroup} from "../../sharing/GroupUtils"
import {createInitialTemplateListIfAllowed} from "../TemplateGroupUtils"
import {getConfirmation} from "../../gui/base/GuiUtils"
import {ScrollSelectList} from "../../gui/ScrollSelectList"

export const TEMPLATE_POPUP_HEIGHT = 340;
export const TEMPLATE_POPUP_TWO_COLUMN_MIN_WIDTH = 600;
export const TEMPLATE_LIST_ENTRY_HEIGHT = 47;
export const TEMPLATE_LIST_ENTRY_WIDTH = 354;

/**
 *	Creates a Modal/Popup that allows user to paste templates directly into the MailEditor.
 *	Also allows user to change desired language when pasting.
 */


export function showTemplatePopupInEditor(templateModel: TemplatePopupModel, editor: Editor, template: ?EmailTemplate, highlightedText: string) {

	const initialSearchString = template ? TEMPLATE_SHORTCUT_PREFIX + template.tag : highlightedText
	const cursorRect = editor.getCursorPosition()
	const editorRect = editor.getDOM().getBoundingClientRect();
	const onSelect = (text) => {
		editor.insertHTML(text)
		editor.focus()
	}

	let rect
	const availableHeightBelowCursor = window.innerHeight - cursorRect.bottom
	const popUpHeight = TEMPLATE_POPUP_HEIGHT + 10 // height + 10px offset for space from the bottom of the screen

	// By default the popup is shown below the cursor. If there is not enough space move the popup above the cursor
	const popUpWidth = editorRect.right - editorRect.left;
	if (availableHeightBelowCursor < popUpHeight) {
		const diff = popUpHeight - availableHeightBelowCursor
		rect = new DomRectReadOnlyPolyfilled(editorRect.left, cursorRect.bottom - diff, popUpWidth, cursorRect.height);
	} else {
		rect = new DomRectReadOnlyPolyfilled(editorRect.left, cursorRect.bottom, popUpWidth, cursorRect.height);
	}
	const popup = new TemplatePopup(templateModel, rect, onSelect, initialSearchString)
	templateModel.search(initialSearchString)
	popup.show()
}

export class TemplatePopup implements ModalComponent {
	_rect: PosRect
	_filterTextAttrs: TextFieldAttrs
	_shortcuts: Shortcut[]
	_onSelect: (string) => void
	_initialWindowWidth: number
	_resizeListener: windowSizeListener
	_redrawStream: Stream<*>
	_templateModel: TemplatePopupModel
	_searchBarValue: Stream<string>
	_selectTemplateButtonAttrs: ButtonAttrs
	_inputDom: HTMLElement
	_selectionChangedListener: Stream<void>
	_debounceFilter: (string) => void

	constructor(templateModel: TemplatePopupModel, rect: PosRect, onSelect: (string) => void, initialSearchString: string) {
		this._rect = rect
		this._onSelect = onSelect
		this._initialWindowWidth = window.innerWidth
		this._resizeListener = () => {
			this._close()
		}
		this._searchBarValue = stream(initialSearchString)
		this._templateModel = templateModel

		this._shortcuts = [
			{
				key: Keys.ESC,
				enabled: () => true,
				exec: () => {
					this._onSelect("")
					this._close()
					m.redraw()
				},
				help: "closeTemplate_action"
			},
			{
				key: Keys.RETURN,
				enabled: () => true,
				exec: () => {
					const selectedContent = this._templateModel.getSelectedContent()
					if (selectedContent) {
						this._onSelect(selectedContent.text)
						this._close()
					}
				},
				help: "insertTemplate_action"
			},
			{
				key: Keys.UP,
				enabled: () => true,
				exec: () => {
					this._templateModel.selectNextTemplate(SELECT_PREV_TEMPLATE)
				},
				help: "selectPreviousTemplate_action"
			},
			{
				key: Keys.DOWN,
				enabled: () => true,
				exec: () => {
					this._templateModel.selectNextTemplate(SELECT_NEXT_TEMPLATE)
				},
				help: "selectNextTemplate_action"
			}
		]
		this._redrawStream = templateModel.searchResults.map((results) => {
			m.redraw()
		})

		this._selectTemplateButtonAttrs = {
			label: "selectTemplate_action",
			click: () => {
				const selected = this._templateModel.getSelectedContent()
				if (selected) {
					this._onSelect(selected.text)
					this._close()
				}
			},
			type: ButtonType.Primary,
		}

		this._debounceFilter = debounce(200, (value: string) => {
			templateModel.search(value)
		})
		this._debounceFilter(initialSearchString)
	}

	view: () => Children = () => {
		const showTwoColumns = this._isScreenWideEnough()

		return m(".flex.flex-column.abs.elevated-bg.border-radius.dropdown-shadow", { // Main Wrapper
				style: {
					width: px(this._rect.width),
					height: px(TEMPLATE_POPUP_HEIGHT),
					top: px(this._rect.top),
					left: px(this._rect.left)
				},
				onclick: (e) => {
					this._inputDom.focus()
					e.stopPropagation()
				},
				oncreate: () => {
					windowFacade.addResizeListener(this._resizeListener)
				},
				onremove: () => {
					windowFacade.removeResizeListener(this._resizeListener)
				},
			}, [
				this._renderHeader(),
				m(".flex.flex-grow.scroll.mb-s", [
					m(".flex.flex-column.scroll" + (showTwoColumns ? ".pr" : ""), {
						style: {
							flex: '1 1 40%'
						},
					}, this._renderList()),
					showTwoColumns ? m(".flex.flex-column.flex-grow-shrink-half", {style: {flex: '1 1 60%'}}, this._renderRightColumn()) : null,
				])
			],
		)
	}

	_renderHeader(): Children {
		const selectedTemplate = this._templateModel.getSelectedTemplate()
		return m(".flex-space-between.center-vertically.pl.pr-s", [
			m(".flex-start", [
				m(".flex.center-vertically", this._renderSearchBar()),
				this._renderAddButton(),
			]),
			m(".flex-end", [
				selectedTemplate
					? this._renderEditButtons(selectedTemplate) // Right header wrapper
					: null,
			])
		])
	}

	_renderSearchBar: (() => Children) = () => {
		return m(TemplateSearchBar, {
			value: this._searchBarValue,
			placeholder: "filter_label",
			keyHandler: (keyPress) => {
				if (isKeyPressed(keyPress.keyCode, Keys.DOWN, Keys.UP)) {
					// This duplicates the listener set in this._shortcuts
					// because the input consumes the event
					this._templateModel.selectNextTemplate(isKeyPressed(keyPress.keyCode, Keys.UP)
						? SELECT_PREV_TEMPLATE
						: SELECT_NEXT_TEMPLATE)
					return false
				} else {
					return true
				}
			},
			oninput: (value) => {
				this._debounceFilter(value)
			},
			oncreate: (vnode) => {
				this._inputDom = vnode.dom.firstElementChild // firstElementChild is the input field of the input wrapper
			}
		})
	}

	_renderAddButton(): Children {
		const attrs = this._createAddButtonAttributes()
		return m("", {
			onkeydown: (e) => {
				// prevents tabbing into the background of the modal
				if (isKeyPressed(e.keyCode, Keys.TAB) && !this._templateModel.getSelectedTemplate()) {
					this._inputDom.focus()
					e.preventDefault()
				}
			}

		}, attrs ? m(ButtonN, attrs) : null)
	}

	_createAddButtonAttributes(): ?ButtonAttrs {
		const templateGroupInstances = this._templateModel.getTemplateGroupInstances()
		const writeableGroups = templateGroupInstances.filter(instance =>
			hasCapabilityOnGroup(logins.getUserController().user, instance.group, ShareCapability.Write))

		if (templateGroupInstances.length === 0) {
			return {
				label: "createTemplate_action",
				click: () => {
					createInitialTemplateListIfAllowed().then(groupRoot => {
						if (groupRoot) {
							this.showTemplateEditor(null, groupRoot)
						}
					})
				},
				type: ButtonType.ActionLarge,
				icon: () => Icons.Add,
				colors: ButtonColors.DrawerNav
			}
		} else if (writeableGroups.length === 1) {
			return {
				label: "createTemplate_action",
				click: () => this.showTemplateEditor(null, writeableGroups[0].groupRoot),
				type: ButtonType.ActionLarge,
				icon: () => Icons.Add,
				colors: ButtonColors.DrawerNav
			}
		} else if (writeableGroups.length > 1) {
			return attachDropdown({
				label: "createTemplate_action",
				click: noOp,
				type: ButtonType.ActionLarge,
				icon: () => Icons.Add,
				colors: ButtonColors.DrawerNav
			}, () => writeableGroups.map(groupInstances => {
				return {
					label: () => getSharedGroupName(groupInstances.groupInfo, true),
					click: () => this.showTemplateEditor(null, groupInstances.groupRoot),
					type: ButtonType.Dropdown,
				}
			}))
		}
	}


	_renderEditButtons(selectedTemplate: EmailTemplate): Children {
		const selectedContent = this._templateModel.getSelectedContent()
		const selectedGroup = this._templateModel.getSelectedTemplateGroupInstance()

		const canEdit = !!selectedGroup
			&& hasCapabilityOnGroup(logins.getUserController().user, selectedGroup.group, ShareCapability.Write)

		return [
			m(ButtonN, attachDropdown({
					label: () => selectedContent ? selectedContent.languageCode + ' ▼' : "",
					title: "chooseLanguage_action",
					// Use dropdown as button type because it matches with the colors of the other buttons
					type: ButtonType.Dropdown,
					click: noOp,
					noBubble: true,
				}, () => selectedTemplate.contents.map(content => {
					const langCode: LanguageCode = downcast(content.languageCode)
					return {
						label: () => lang.get(languageByCode[langCode].textId),
						type: ButtonType.Dropdown,
						click: (e) => {
							e.stopPropagation()
							this._templateModel.setSelectedContentLanguage(langCode),
								this._inputDom.focus()
						},
					}
				}
				)
			)),
			canEdit
				? [
					m(ButtonN, {
						label: "editTemplate_action",
						click: () => locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(selectedTemplate._ownerGroup))
						                    .then(groupRoot => this.showTemplateEditor(selectedTemplate, groupRoot)),
						type: ButtonType.ActionLarge,
						icon: () => Icons.Edit,
						colors: ButtonColors.DrawerNav,
					}),
					m(ButtonN, {
						label: "remove_action",
						click: () => {
							getConfirmation("deleteTemplate_msg")
								.confirmed(() => locator.entityClient.erase(selectedTemplate))
						},
						type: ButtonType.ActionLarge,
						icon: () => Icons.Trash,
						colors: ButtonColors.DrawerNav,
					})
				]
				: null,
			m(".pr-s", m(".nav-bar-spacer")),
			m("", {
				onkeydown: (e) => {
					// prevents tabbing into the background of the modal
					if (isKeyPressed(e.keyCode, Keys.TAB)) {
						this._inputDom.focus()
						e.preventDefault()
					}
				}
			}, m(ButtonN, this._selectTemplateButtonAttrs)),
		]
	}

	_renderList(): Children {
		return m(ScrollSelectList, {
			items: this._templateModel.searchResults(),
			selectedItem: this._templateModel.selectedTemplate,
			emptyListMessage: () => this._templateModel.isLoaded() ? "nothingFound_label" : "loadingTemplates_label",
			itemHeight: TEMPLATE_LIST_ENTRY_HEIGHT,
			width: TEMPLATE_LIST_ENTRY_WIDTH,
			renderItem: (template) => m(TemplatePopupResultRow, {template: template}),
			onItemDoubleClicked: (template) => {
				const selected = this._templateModel.getSelectedContent()
				if (selected) {
					this._onSelect(selected.text)
					this._close()
				}
			}
		})
	}

	_renderRightColumn(): Children {
		const template = this._templateModel.getSelectedTemplate()
		if (template) {
			return [
				m(TemplateExpander, {
					template: template,
					model: this._templateModel,
				})
			]
		} else {
			return null
		}
	}

	_isScreenWideEnough(): boolean {
		return window.innerWidth > (TEMPLATE_POPUP_TWO_COLUMN_MIN_WIDTH)
	}

	_getWindowWidthChange(): number {
		return window.innerWidth - this._initialWindowWidth
	}

	show() {
		modal.display(this, false)
	}

	_close(): void {
		modal.remove(this)
	}

	backgroundClick(e: MouseEvent): void {
		this._onSelect("")
		this._close()
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	onClose(): void {
		this._redrawStream.end(true)
	}

	shortcuts(): Shortcut[] {
		return this._shortcuts
	}

	popState(e: Event): boolean {
		return true
	}

	showTemplateEditor(templateToEdit: ?EmailTemplate, groupRoot: TemplateGroupRoot) {
		import("../../settings/TemplateEditor").then(editor => {
			editor.showTemplateEditor(templateToEdit, groupRoot)
		})
	}
}