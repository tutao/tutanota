import m, { Children } from "mithril"
import type { SettingsView, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "./SettingsView"
import type { KnowledgeBaseEntry, TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { KnowledgeBaseEntryTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { Button, ButtonType } from "../gui/base/Button.js"
import { lang } from "../misc/LanguageViewModel"
import type { ListConfig, VirtualRow } from "../gui/base/List"
import { List } from "../gui/base/List"
import type { EntityUpdateData } from "../api/main/EventController"
import { isUpdateForTypeRef } from "../api/main/EventController"
import { size } from "../gui/size"
import { EntityClient } from "../api/common/EntityClient"
import { showKnowledgeBaseEditor } from "./KnowledgeBaseEditor"
import { GENERATED_MAX_ID, getElementId, isSameId, listIdPart } from "../api/common/utils/EntityUtils"
import { hasCapabilityOnGroup } from "../sharing/GroupUtils"
import { OperationType, ShareCapability } from "../api/common/TutanotaConstants"
import type { LoginController } from "../api/main/LoginController"
import type { Group } from "../api/entities/sys/TypeRefs.js"
import { ListColumnWrapper } from "../gui/ListColumnWrapper"
import { KnowledgeBaseEntryView } from "../knowledgebase/view/KnowledgeBaseEntryView"
import { NBSP, promiseMap } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env"
import { SelectableRowContainer, setSelectedRowStyle } from "../gui/SelectableRowContainer.js"

assertMainOrNode()

/**
 *  List that is rendered within the knowledgeBase Settings
 */
export class KnowledgeBaseListView implements UpdatableSettingsViewer {
	private _list!: List<KnowledgeBaseEntry, KnowledgeBaseRow>
	private _listId: Id | null = null
	private _settingsView: SettingsView
	private _templateGroupRoot: TemplateGroupRoot
	private _templateGroup: Group
	private _entityClient: EntityClient
	private _logins: LoginController

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
			fetch: async (startId, count) => {
				// fetch works like in ContactListView, because we have a custom sort order there too
				if (startId === GENERATED_MAX_ID) {
					// load all entries at once to apply custom sort order
					const allEntries = await this._entityClient.loadAll(KnowledgeBaseEntryTypeRef, knowledgebaseListId)
					return { items: allEntries, complete: true }
				} else {
					throw new Error("fetch knowledgeBase entry called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this._entityClient.load<KnowledgeBaseEntry>(KnowledgeBaseEntryTypeRef, [knowledgebaseListId, elementId])
			},
			sortCompare: (a: KnowledgeBaseEntry, b: KnowledgeBaseEntry) => {
				var titleA = a.title.toUpperCase()
				var titleB = b.title.toUpperCase()
				return titleA < titleB ? -1 : titleA > titleB ? 1 : 0
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
			className: "knowledgeBase-list",
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		}
		this._listId = knowledgebaseListId
		this._list = new List(listConfig)

		this._list.loadInitial()

		m.redraw()
	}

	view(): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: this.userCanEdit()
					? m(
							".plr-l.mr-negative-s.align-self-end",
							m(Button, {
								label: "addEntry_label",
								type: ButtonType.Primary,
								click: () => {
									showKnowledgeBaseEditor(null, this._templateGroupRoot)
								},
							}),
					  )
					: null,
			},
			this._list ? m(this._list) : null,
		)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<any> {
		return promiseMap(updates, (update) => {
			const list = this._list

			if (list && this._listId && isUpdateForTypeRef(KnowledgeBaseEntryTypeRef, update) && isSameId(this._listId, update.instanceListId)) {
				return this._list.entityEventReceived(update.instanceId, update.operation).then(() => {
					const selected = this._list.getSelectedEntities()[0]

					if (update.operation === OperationType.UPDATE && selected && isSameId(getElementId(selected), update.instanceId)) {
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
	top: number = 0
	domElement: HTMLElement | null = null
	entity: KnowledgeBaseEntry | null = null
	private entryTitleDom!: HTMLElement
	private innerContainerDom!: HTMLElement

	update(entry: KnowledgeBaseEntry, selected: boolean): void {
		if (!this.domElement) {
			return
		}

		setSelectedRowStyle(this.innerContainerDom, selected)
		this.entryTitleDom.textContent = entry.title
	}

	render(): Children {
		return m(
			SelectableRowContainer,
			{
				oncreate: (vnode) => {
					this.innerContainerDom = vnode.dom as HTMLElement
				},
			},
			m(".flex.col.flex-grow", [
				m(".smaller.text-ellipsis", {
					oncreate: (vnode) => (this.entryTitleDom = vnode.dom as HTMLElement),
				}),
				// to create a second row
				m(".smaller", NBSP),
			]),
		)
	}
}

class KnowledgeBaseSettingsDetailsViewer implements UpdatableSettingsDetailsViewer {
	entry: KnowledgeBaseEntry
	readonly: boolean

	constructor(entry: KnowledgeBaseEntry, readonly: boolean) {
		this.entry = entry
		this.readonly = readonly
	}

	renderView(): Children {
		return m(
			".plr-l",
			m(KnowledgeBaseEntryView, {
				entry: this.entry,
				onTemplateSelected: (templateId) => m.route.set(`/settings/templates/${listIdPart(templateId)}}`),
				readonly: this.readonly,
			}),
		)
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<any> {
		return Promise.resolve()
	}
}
