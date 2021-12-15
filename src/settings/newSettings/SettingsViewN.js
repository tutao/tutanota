// @flow
import {SettingsFolderRow} from "../SettingsFolderRow"
import m from "mithril"
import type {CurrentView, SearchHandler} from "../../gui/base/Header"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import {FolderColumnView} from "../../gui/base/FolderColumnView"
import {size} from "../../gui/size"
import {lang} from "../../misc/LanguageViewModel"
import {ViewSlider} from "../../gui/base/ViewSlider"
import type {NavButtonAttrs} from "../../gui/base/NavButtonN"
import {ButtonColors} from "../../gui/base/ButtonN"
import {SidebarSection} from "../../gui/SidebarSection"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {SettingsFolderN} from "./SettingsFolderN"
import {logins} from "../../api/main/LoginController"
import type {SettingsSection, SettingsValue} from "./SettingsModel"
import {SettingsModel} from "./SettingsModel"
import {AllSettingsList} from "./AllSettingsList"
import {DetailsColumnViewer} from "./DetailsColumnViewer"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import {theme} from "../../gui/theme"
import {locator} from "../../api/main/MainLocator"
import type {EntityUpdateData} from "../../api/main/EventController"
import {noOp} from "../../api/common/utils/Utils"
import {Dialog} from "../../gui/base/Dialog"
import {AboutDialog} from "../AboutDialog"
import {isTutanotaDomain} from "../../api/common/Env"

export class SettingsViewN implements CurrentView {

	_foldersColumn: ViewColumn
	_listColumn: ViewColumn
	_detailsColumn: ?ViewColumn
	_viewSlider: ViewSlider
	view: Function;
	_folders: SettingsFolderN[]
	_settingsModel: SettingsModel
	_searchValue: string
	oncreate: Function
	onremove: Function

	constructor() {
		this._foldersColumn = this._createFoldersColumn()
		this._listColumn = this._createListColumn()
		this._detailsColumn = this._createDetailsColumn()
		this._viewSlider = new ViewSlider([
			this._foldersColumn, this._listColumn, this._detailsColumn
		], "SettingsView")

		this.view = (vnode: Vnode<Attrs>) => {

			return m(this._viewSlider)
		}

		const listener = (updates, eventOwnerGroupId) => {
			return this._entityEventsReceived(updates, eventOwnerGroupId)
		}

		this.oncreate = () => {
			locator.eventController.addEntityListener(listener)
		}
		this.onremove = () => {
			locator.eventController.removeEntityListener(listener)
		}

		this._initFolders()
		this._settingsModel = new SettingsModel(logins.getUserController())


	}


	_entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<*> {
		const section = this._settingsModel.selectedSection()
		return section ? section.entityEventReceived(updates, eventOwnerGroupId) : Promise.resolve(undefined)
	}

	_initFolders() {
		this._folders = [
			new SettingsFolderN("settings_label", () => BootIcons.Search),
			// new SettingsFolderN("templateGroup_label", () => Icons.ListAlt), // TODO: make new template list
			// new SettingsFolderN("adminUserList_action", () => BootIcons.Contacts),
			// new SettingsFolderN("groups_label", () => Icons.People),
			// new SettingsFolderN("contactForms_label", () => Icons.Chat)
		]
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	updateUrl(args: Object, requestedPath: string) {
		// console.log("SettingsViewN.updateUrl", args, requestedPath)
	}

	_createFoldersColumn(): ViewColumn {
		return new ViewColumn({
			onbeforeremove: () => {
				//this._templateInvitations.dispose()
			},
			view: () => {
				return m(FolderColumnView, {
					button: null,
					content: m(".flex.flex-grow.col", [
						m(SidebarSection, {
							name: () => "new searchable settings",
						}, this._renderSidebarSectionChildren(this._folders)),
						isTutanotaDomain() ? this._aboutThisSoftwareLink() : null,
					]),
					ariaLabel: "settings_label"
				})
			}
		}, ColumnType.Foreground, size.first_col_min_width, size.first_col_max_width, () => lang.get("settings_label"))
	}

	_createListColumn(): ViewColumn {
		return new ViewColumn({
			view: () => m(AllSettingsList, {model: this._settingsModel})
		}, ColumnType.Background, 400, 600, () => "TODO: text 2 column")
	}

	_createDetailsColumn(): ViewColumn {
		return new ViewColumn({
			view: () => {
				const section = this._settingsModel.selectedSection()
				return section
					? m(DetailsColumnViewer, {
						section: section,
						searchValue: this._searchValue
					})
					: m(ColumnEmptyMessageBox, {
						message: "noSelection_msg",
						color: theme.content_message_bg
					})

			}
		}, ColumnType.Background, 600, 2400, () => "TODO: text 3 column")
	}

	_renderSidebarSectionChildren(folders: SettingsFolderN[]): Children {
		return m("",
			folders
				.filter(folder => folder.isVisible())
				.map(folder => {
						const buttonAttrs = this._createSettingsFolderNavButton(folder)
						return m(SettingsFolderRow, {
							mainButtonAttrs: buttonAttrs,
							extraButtonAttrs: null
						})
					}
				))
	}

	_createSettingsFolderNavButton(folder: SettingsFolderN): NavButtonAttrs {
		return {
			label: folder.name,
			icon: folder.icon,
			href: folder.url,
			colors: ButtonColors.Nav,
			click: () => this._viewSlider.focus(this._listColumn),
			isVisible: () => folder.isVisible()
		}
	}

	_aboutThisSoftwareLink(): Vnode<any> {
		return m(".pb.pt-l.flex-no-shrink.flex.col.justify-end", [
			m("button.text-center.small.no-text-decoration", {
					style: {
						backgroundColor: "transparent",
					},
					href: '#',
					onclick: () => {
						this._viewSlider.focusNextColumn()
						setTimeout(() => {
							Dialog.showActionDialog({
								title: () => lang.get("about_label"),
								child: () => m(AboutDialog),
								allowOkWithReturn: true,
								okAction: (dialog) => dialog.close(),
								allowCancel: false,
							})
						}, 200)
					}
				}, [
					m("", `Tutanota v${env.versionNumber}`),
					m(".b", {
						style: {color: theme.navigation_button_selected}
					}, lang.get("about_label"))
				]
			)
		])
	}

	stringIsEqualWithAttrs(settingsValues: Array<SettingsValue<any>>, value: string): boolean {
		let result = false
		settingsValues.forEach((section) => {
			if (lang.get(section.name).toLowerCase().includes(value.toLowerCase())) {
				result = true
			}
		})
		return result
	}

	stringIsEqualWithSection(section: SettingsSection, value: string): boolean {

		return section.heading.toLowerCase().includes(value.toLowerCase())
			|| section.category.toLowerCase().includes(value.toLowerCase())
			|| this.stringIsEqualWithAttrs(section.settingsValues, value);
	}

	getSearchHandler(): ?SearchHandler {
		return {
			onSearch: (value) => {
				this._searchValue = value
				this._settingsModel.selectedSection(null)
				let sections = []
				if (value === "") {
					sections = this._settingsModel.allSections
				} else {
					this._settingsModel.allSections.forEach((section) => {
						if (this.stringIsEqualWithSection(section, value)) {
							sections.push(section)
						}
					})
				}
				this._settingsModel.sections = sections
				m.redraw()
				return Promise.resolve(undefined)
			},
			placeholder: "searchSettings_placeholder",
			onBlur: noOp,
			onKeyUpPressed: noOp,
			onKeyDownPressed: noOp
		}
	}
}