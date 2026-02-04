import m, { Children, Component, Vnode } from "mithril"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { getElementId, getListId } from "../../../common/api/common/utils/EntityUtils"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"
import { createAsyncDropdown } from "../../../common/gui/base/Dropdown"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton"
import { theme } from "../../../common/gui/theme"
import { driveFolderName } from "./DriveGuiUtils"
import { FolderItem } from "./DriveUtils"

export interface DriveBreadcrumbsAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	loadParents: () => Promise<DriveFolder[]>
	onDropInto?: (f: FolderItem, event: DragEvent) => unknown
	onClick?: (f: DriveFolder, event: MouseEvent) => unknown
}

export interface BreadcrumbLinkAttrs {
	label: Translation
	href: string
	onDrop?: (event: DragEvent) => unknown
	onClick?: (event: MouseEvent) => unknown
}

const BREADCRUMBS_ITEM_MAXWIDTH = "20ch"

class BreadcrumbLink implements Component<BreadcrumbLinkAttrs> {
	private isDraggedOver: boolean = false

	view({ attrs: { label, href, onDrop, onClick } }: Vnode<BreadcrumbLinkAttrs>): Children {
		return m(
			m.route.Link,
			{
				href,
				selector: "a.click.no-text-decoration.state-bg.pl-8.pr-8.pt-4.pb-4.border-radius-4.text-ellipsis",
				"data-testid": `btn:${lang.getTestId(label)}`,
				style: { "max-width": BREADCRUMBS_ITEM_MAXWIDTH, border: this.isDraggedOver ? `1px solid ${theme.primary}` : `1px solid transparent` },
				onclick: onClick,
				onkeyup: (e: KeyboardEvent, dom: HTMLElement) => {
					if (isKeyPressed(e.key, Keys.SPACE)) {
						m.route.set(href)
					}
				},
				ondragover: () => {
					this.isDraggedOver = (onDrop ?? false) && true
				},
				ondragleave: () => {
					this.isDraggedOver = false
				},
				ondrop: onDrop
					? (event: DragEvent) => {
							this.isDraggedOver = false
							onDrop(event)
							console.log("king, you dropped this:", event)
						}
					: undefined,
			},
			label.text,
		)
	}
}

function folderRoute(entry: DriveFolder): string {
	return `/drive/${getListId(entry)}/${getElementId(entry)}`
}

export class DriveBreadcrumbs implements Component<DriveBreadcrumbsAttrs> {
	view({ attrs: { currentFolder, parents, loadParents, onDropInto, onClick } }: Vnode<DriveBreadcrumbsAttrs>): Children {
		return m("div.flex.items-center.column-gap-12", [
			parents
				.map((entry, index) => {
					return [
						// if it's the first item and it has a parent it means we don't have the full path
						index === 0 && entry.parent
							? [
									m(BaseButton, {
										class: "click state-bg pl-8 pr-8 pt-4 pb-4 border-radius-4",
										text: "…",
										onclick: (_, dom) => this.onLoadParents(dom, loadParents, onClick),
										label: "showParentFolders_action",
									} satisfies BaseButtonAttrs),
									m("", "/"),
								]
							: null,
						m(BreadcrumbLink, {
							label: driveFolderName(entry),
							href: folderRoute(entry),
							onClick: (e: MouseEvent) => {
								onClick?.(entry, e)
							},
							onDrop: onDropInto
								? (event) => {
										onDropInto({ type: "folder", folder: entry }, event)
									}
								: undefined,
						}),
						m("", "/"),
					]
				})
				.flat(),
			currentFolder
				? [
						m(
							".pl-8.pr-8.pt-4.pb-4.text-ellipsis",
							{
								style: {
									// match the border of breadcrumb links
									border: "1px solid transparent",
									"max-width": BREADCRUMBS_ITEM_MAXWIDTH,
								},
							},
							" " + driveFolderName(currentFolder).text,
						),
					]
				: null,
		])
	}
	private onLoadParents(dom: HTMLElement, loadParents: () => Promise<DriveFolder[]>, onClick: DriveBreadcrumbsAttrs["onClick"]) {
		const newClickEvent = new MouseEvent("click")
		createAsyncDropdown({
			lazyButtons: async () => {
				const loadedParents = await loadParents()
				return loadedParents.map((parent) => {
					return {
						label: driveFolderName(parent),
						click: (event) => {
							if (onClick) {
								onClick(parent, event)
							} else {
								m.route.set(folderRoute(parent))
							}
						},
					}
				})
			},
		})(newClickEvent, dom)
	}
}
