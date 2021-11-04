// @flow

import m from "mithril"
import type {SettingsView, UpdatableSettingsViewer} from "./SettingsView"
import type {KnowledgeBaseEntry} from "../api/entities/tutanota/KnowledgeBaseEntry"
import {KnowledgeBaseEntryTypeRef} from "../api/entities/tutanota/KnowledgeBaseEntry"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {lang} from "../misc/LanguageViewModel"
import type {ListConfig, VirtualRow} from "../gui/base/List"
import {List} from "../gui/base/List"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {size} from "../gui/size"
import type {TemplateGroupRoot} from "../api/entities/tutanota/TemplateGroupRoot"
import {EntityClient} from "../api/common/EntityClient"
import {showKnowledgeBaseEditor} from "./KnowledgeBaseEditor"
import {getElementId, isSameId, listIdPart} from "../api/common/utils/EntityUtils"
import {assertMainOrNode} from "../api/common/Env"
import {hasCapabilityOnGroup} from "../sharing/GroupUtils"
import {OperationType, ShareCapability} from "../api/common/TutanotaConstants"
import type {LoginController} from "../api/main/LoginController"
import type {Group} from "../api/entities/sys/Group"
import {ListColumnWrapper} from "../gui/ListColumnWrapper"
import {KnowledgeBaseEntryView} from "../knowledgebase/view/KnowledgeBaseEntryView"
import {promiseMap} from "../api/common/utils/PromiseUtils"

assertMainOrNode()

/**
 *  List that is rendered within the knowledgeBase Settings
 */

export class KnowledgeBaseListView implements UpdatableSettingsViewer {
	_list: List<KnowledgeBaseEntry, KnowledgeBaseRow>
	_listId: ?Id
	_settingsView: SettingsView
	_templateGroupRoot: TemplateGroupRoot
	_templateGroup: Group
	_entityClient: EntityClient
	_logins: LoginController

	constructor(settingsView: SettingsView, entityClient: EntityClient, logins: LoginController, templateGroupRoot: TemplateGroupRoot, templateGroup: Group) {
		this._settingsView = settingsView
		this._entityClient = entityClient
		this._logins = logins
		this._templateGroupRoot = templateGroupRoot
		this._templateGroup = templateGroup
		this._initKnowledgeBaseList()
	}

	_initKnowledgeBaseList() {
		const knowledgebaseListId = this._templateGroupRoot.knowledgeBase
		const listConfig: ListConfig<KnowledgeBaseEntry, KnowledgeBaseRow> = {
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				return this._entityClient.loadRange(KnowledgeBaseEntryTypeRef, knowledgebaseListId, startId, count, true)
			},
			loadSingle: (elementId) => {
				return this._entityClient.load(KnowledgeBaseEntryTypeRef, [knowledgebaseListId, elementId])
			},
			sortCompare: (a: KnowledgeBaseEntry, b: KnowledgeBaseEntry) => {
				var titleA = a.title.toUpperCase();
				var titleB = b.title.toUpperCase();
				return (titleA < titleB) ? -1 : (titleA > titleB) ? 1 : 0
			},
			elementSelected: (selectedEntries: Array<KnowledgeBaseEntry>, elementClicked) => {
				if (selectedEntries.length === 0 && this._settingsView.detailsViewer) {
					this._settingsView.detailsViewer = null
				} else {
					this._settingsView.detailsViewer = new KnowledgeBaseSettingsDetailsViewer(selectedEntries[0], !this.userCanEdit())
					this._settingsView.focusSettingsDetailsColumn()
				}
				m.redraw()
			},
			createVirtualRow: () => {
				return new KnowledgeBaseRow()
			},
			showStatus: false,
			className: "knowledgeBase-list",
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false
			},
			elementsDraggable: false,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		}
		this._listId = knowledgebaseListId
		this._list = new List(listConfig)
		this._list.loadInitial()
		m.redraw()
	}

	view(): Children {
		return m(ListColumnWrapper, {
				headerContent: this.userCanEdit()
					? m(".mr-negative-s.align-self-end", m(ButtonN, {
						label: "addEntry_label",
						type: ButtonType.Primary,
						click: () => {
							showKnowledgeBaseEditor(null, this._templateGroupRoot)
						}
					}))
					: null
			},
			this._list ? m(this._list) : null
		)
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<*> {
		return promiseMap(updates, update => {
			const list = this._list
			if (list && this._listId && isUpdateForTypeRef(KnowledgeBaseEntryTypeRef, update)
				&& isSameId(this._listId, update.instanceListId)) {
				return this._list.entityEventReceived(update.instanceId, update.operation)
				           .then(() => {
					           const selected = this._list.getSelectedEntities()[0]
					           if (update.operation === OperationType.UPDATE && selected
						           && isSameId(getElementId(selected), update.instanceId)) {
						           this._settingsView.detailsViewer = new KnowledgeBaseSettingsDetailsViewer(selected, !this.userCanEdit())
						           this._settingsView.focusSettingsDetailsColumn()
					           } else if (update.operation === OperationType.CREATE) {
						           this._list.scrollToIdAndSelect(update.instanceId)
					           }
				           })
			}
		})
	}

	userCanEdit(): boolean {
		return hasCapabilityOnGroup(this._logins.getUserController().user, this._templateGroup, ShareCapability.Write)
	}
}

export class KnowledgeBaseRow implements VirtualRow<KnowledgeBaseEntry> {
	top: number;
	domElement: ?HTMLElement;
	entity: ?KnowledgeBaseEntry;
	_domEntryTitle: HTMLElement;

	constructor() {
		this.top = 0
	}

	update(entry: KnowledgeBaseEntry, selected: boolean): void {
		if (!this.domElement) {
			return
		}
		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}
		this._domEntryTitle.textContent = entry.title
	}

	render(): Children {
		return [
			m(".top", [
				m(".name.text-ellipsis", {oncreate: (vnode) => this._domEntryTitle = vnode.dom}),
			]),
		]
	}
}

class KnowledgeBaseSettingsDetailsViewer implements UpdatableSettingsViewer {

	entry: KnowledgeBaseEntry
	readonly: boolean

	constructor(entry: KnowledgeBaseEntry, readonly: boolean) {
		this.entry = entry
		this.readonly = readonly
	}

	view(vnode) {
		return m(".plr-l", m(KnowledgeBaseEntryView, {
			entry: this.entry,
			onTemplateSelected: templateId => m.route.set(`/settings/templates/${listIdPart(templateId)}}`),
			readonly: this.readonly
		}))
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<*> {
		return Promise.resolve()
	}
}