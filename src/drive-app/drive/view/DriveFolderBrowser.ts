import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"
import { DriveFolderBrowserEntry, DriveFolderBrowserEntryAttrs } from "./DriveFolderBrowserEntry"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"
import { theme } from "../../../common/gui/theme"
import { LoginTextField } from "../../../common/gui/base/LoginTextField"
import { FolderItem, folderItemEntity } from "./DriveUtils"
import { isEmpty, lastIndex } from "@tutao/tutanota-utils"
import { lang } from "../../../common/misc/LanguageViewModel"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"

export interface DriveFolderBrowserAttrs {
	items: readonly FolderItem[]
	disabledTargetIds: ReadonlySet<Id>
	onItemClicked: (f: FolderItem) => unknown
	style?: Record<string, unknown>
	newFolder: DriveFolderBrowserNewFolderEntryAttrs | null
}

export class DriveFolderBrowser implements Component<DriveFolderBrowserAttrs> {
	// index of the active child for keyboard navigation
	private activeIndex: number = 0
	private dom: HTMLElement | null = null

	view({ attrs: { items, disabledTargetIds, onItemClicked, style, newFolder } }: Vnode<DriveFolderBrowserAttrs>): Children {
		return m(
			".flex.col.gap-4.scroll",
			{
				style,
				role: "grid",
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.J, Keys.DOWN)) {
						this.activeIndex = Math.min(this.activeIndex + 1, lastIndex(items))
						this.focusActiveChild(newFolder)
					} else if (isKeyPressed(e.key, Keys.K, Keys.UP)) {
						this.activeIndex = Math.max(0, this.activeIndex - 1)
						this.focusActiveChild(newFolder)
					}
				},
				oncreate: ({ dom }) => {
					this.dom = dom as HTMLElement
					// Focus the first child the first time this folder is displayed. Do it in raf to run after
					// dialog focus shenanigans.
					requestAnimationFrame(() => this.focusActiveChild(newFolder))
				},
			},
			[
				newFolder == null ? null : m(DriveFolderBrowserNewFolderEntry, newFolder),
				isEmpty(items)
					? m(
							".text-center.h2.pt-32.pb-32.font-weight-500.translucent",
							{ "data-testid": lang.getTestId("folderIsEmpty_msg") },
							lang.getTranslationText("folderIsEmpty_msg"),
						)
					: items.map((item, index) => {
							const elementId = getElementId(folderItemEntity(item))
							return m(DriveFolderBrowserEntry, {
								key: elementId,
								item: item,
								isInvalidTarget: disabledTargetIds.has(elementId) || item.type === "file",
								selected: index === this.activeIndex,
								onSingleSelection: onItemClicked,
							} satisfies DriveFolderBrowserEntryAttrs & { key: string })
						}),
			],
		)
	}
	private focusActiveChild(newFolder: DriveFolderBrowserNewFolderEntryAttrs | null) {
		const indexOffset = newFolder == null ? 0 : 1
		const child = this.dom?.children[this.activeIndex + indexOffset] as HTMLElement | undefined
		child?.focus()
	}
}

interface DriveFolderBrowserNewFolderEntryAttrs {
	newFolderName: string
	onNewFolderNameInput: (name: string) => unknown
	onCreateFolder: () => unknown
}

class DriveFolderBrowserNewFolderEntry implements Component<DriveFolderBrowserNewFolderEntryAttrs> {
	view({ attrs: { newFolderName, onNewFolderNameInput, onCreateFolder } }: Vnode<DriveFolderBrowserNewFolderEntryAttrs>): Children {
		return m(
			".flex.row.folder-row.items-center.plr-12.pt-16.pb-16.gap-12",
			{
				style: {
					background: theme.surface,
					"border-radius": "10px",
				},
			},
			[
				m(LoginTextField, {
					class: "flex-grow",
					label: "folderName_label",
					value: newFolderName,
					oninput: onNewFolderNameInput,
					onReturnKeyPressed: onCreateFolder,
					onDomInputCreated: (dom) => dom.focus(),
				}),
				m(LoginButton, {
					label: "createFolder_action",
					width: "flex",
					onclick: onCreateFolder,
				}),
			],
		)
	}
}
