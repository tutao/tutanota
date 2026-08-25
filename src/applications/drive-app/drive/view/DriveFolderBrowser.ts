import m, { Children, Component, Vnode } from "mithril"
import { getElementId } from "../../../../platform-kit/meta"
import { DriveFolderBrowserEntry, DriveFolderBrowserEntryAttrs } from "./DriveFolderBrowserEntry"
import { FolderItem, folderItemEntity } from "./DriveUtils"
import { isEmpty, lastIndex } from "../../../../platform-kit/utils"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { Keys } from "../../../../ui/utils/KeyboardKeys"
import { ListState } from "../../../../ui/base/List"

export interface DriveFolderBrowserAttrs {
	listState: ListState<FolderItem>
	disabledTargetIds: ReadonlySet<Id>
	style?: Record<string, unknown>
	onSingleSelection: (f: FolderItem) => unknown
	onSingleInclusiveSelection: (f: FolderItem) => unknown
	onRangeSelectionTowards: (f: FolderItem) => unknown
}

export class DriveFolderBrowser implements Component<DriveFolderBrowserAttrs> {
	// index of the active child for keyboard navigation
	private activeIndex: number = 0
	private dom: HTMLElement | null = null

	view({
		attrs: { listState, disabledTargetIds, style, onSingleSelection, onSingleInclusiveSelection, onRangeSelectionTowards },
	}: Vnode<DriveFolderBrowserAttrs>): Children {
		const items = listState.items

		return m(
			".flex.col.gap-4.scroll",
			{
				style,
				role: "grid",
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.J, Keys.DOWN)) {
						this.activeIndex = Math.min(this.activeIndex + 1, lastIndex(items))
						this.focusActiveChild()
					} else if (isKeyPressed(e.key, Keys.K, Keys.UP)) {
						this.activeIndex = Math.max(0, this.activeIndex - 1)
						this.focusActiveChild()
					}
				},
				oncreate: ({ dom }) => {
					this.dom = dom as HTMLElement
					// Focus the first child the first time this folder is displayed. Do it in raf to run after
					// dialog focus shenanigans.
					requestAnimationFrame(() => this.focusActiveChild())
				},
			},
			[
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
								isInvalidTarget: disabledTargetIds.has(elementId),
								selected: listState.selectedItems.has(item),
								onSingleSelection,
								onSingleInclusiveSelection,
								onRangeSelectionTowards,
							} satisfies DriveFolderBrowserEntryAttrs & { key: string })
						}),
			],
		)
	}
	private focusActiveChild() {
		const child = this.dom?.children[this.activeIndex] as HTMLElement | undefined
		child?.focus()
	}
}
