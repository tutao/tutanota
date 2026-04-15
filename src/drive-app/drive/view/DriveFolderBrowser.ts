import m, { Children, Component, Vnode } from "mithril"
import { getElementId } from "@tutao/typerefs"
import { DriveFolderBrowserEntry, DriveFolderBrowserEntryAttrs } from "./DriveFolderBrowserEntry"
import { FolderItem, folderItemEntity } from "./DriveUtils"
import { isEmpty, lastIndex } from "@tutao/utils"
import { lang } from "../../../common/misc/LanguageViewModel"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "@tutao/app-env"

export interface DriveFolderBrowserAttrs {
	items: readonly FolderItem[]
	disabledTargetIds: ReadonlySet<Id>
	onItemClicked: (f: FolderItem) => unknown
	style?: Record<string, unknown>
}

export class DriveFolderBrowser implements Component<DriveFolderBrowserAttrs> {
	// index of the active child for keyboard navigation
	private activeIndex: number = 0
	private dom: HTMLElement | null = null

	view({ attrs: { items, disabledTargetIds, onItemClicked, style } }: Vnode<DriveFolderBrowserAttrs>): Children {
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
								isInvalidTarget: disabledTargetIds.has(elementId) || item.type === "file",
								selected: index === this.activeIndex,
								onSingleSelection: onItemClicked,
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
