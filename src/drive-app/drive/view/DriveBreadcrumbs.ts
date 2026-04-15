import m, { Children, Component, Vnode } from "mithril"
import { driveTypeRefs } from "@tutao/typerefs"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { getElementId, getListId } from "@tutao/typerefs"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "@tutao/app-env"
import { Dropdown } from "../../../common/gui/base/Dropdown"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton"
import { theme } from "../../../common/gui/theme"
import { driveFolderName, isDraggingDriveItems } from "./DriveGuiUtils"
import { FolderItem } from "./DriveUtils"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { modal } from "../../../common/gui/base/Modal"

export interface DriveBreadcrumbsAttrs {
	currentFolder: driveTypeRefs.DriveFolder | null
	parents: readonly driveTypeRefs.DriveFolder[]
	loadParents: () => Promise<driveTypeRefs.DriveFolder[]>
	onDropInto?: (f: FolderItem, event: DragEvent) => unknown
	onClick?: (f: driveTypeRefs.DriveFolder, event: MouseEvent) => unknown
}

export interface BreadcrumbLinkAttrs {
	label: Translation
	href: string
	onDrop?: (event: DragEvent) => unknown
	onClick?: (event: MouseEvent) => unknown
}

const BREADCRUMBS_ITEM_MAXWIDTH = "20ch"
const BREADCRUMB_BORDER_DRAGOVER = `1px solid ${theme.primary}`
const BREADCRUMB_BORDER_NONE = `1px solid transparent`

class BreadcrumbLink implements Component<BreadcrumbLinkAttrs> {
	private isDraggedOver: boolean = false

	view({ attrs: { label, href, onDrop, onClick } }: Vnode<BreadcrumbLinkAttrs>): Children {
		return m(
			m.route.Link,
			{
				href,
				selector: "a.click.no-text-decoration.state-bg.pl-8.pr-8.pt-4.pb-4.border-radius-4.text-ellipsis.font-weight-500",
				"data-testid": `btn:${lang.getTestId(label)}`,
				style: { "max-width": BREADCRUMBS_ITEM_MAXWIDTH, border: this.isDraggedOver ? BREADCRUMB_BORDER_DRAGOVER : BREADCRUMB_BORDER_NONE },
				onclick: onClick,
				onkeyup: (e: KeyboardEvent, dom: HTMLElement) => {
					if (isKeyPressed(e.key, Keys.SPACE)) {
						m.route.set(href)
					}
				},
				ondragover: (event: DragEvent) => {
					this.isDraggedOver = (onDrop ?? false) && isDraggingDriveItems(event.dataTransfer)
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

function folderRoute(entry: driveTypeRefs.DriveFolder): string {
	return `/drive/${getListId(entry)}/${getElementId(entry)}`
}

export class DriveBreadcrumbs implements Component<DriveBreadcrumbsAttrs> {
	view({ attrs: { currentFolder, parents, loadParents, onDropInto, onClick } }: Vnode<DriveBreadcrumbsAttrs>): Children {
		return m("div.flex.items-center.column-gap-4", [
			parents
				.map((entry, index) => {
					return [
						// if it's the first item and it has a parent it means we don't have the full path
						index === 0 && entry.parent
							? [
									m(BaseButton, {
										class: "click state-bg pl-8 pr-8 pt-4 pb-4 border-radius-4",
										text: "…",
										onclick: (_, dom) => this.onLoadParents(dom, loadParents, onClick, undefined),
										ondragover: (event: DragEvent) => {
											if (event.target && isDraggingDriveItems(event.dataTransfer)) {
												const dom = event.target as HTMLElement
												this.onLoadParents(dom, loadParents, undefined, onDropInto)
											}
										},
										label: "showParentFolders_action",
									} satisfies BaseButtonAttrs),
									m(Icon, {
										icon: Icons.ChevronRight,
										size: IconSize.PX24,
										style: { fill: theme.on_surface_variant },
									}),
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
						m(Icon, {
							icon: Icons.ChevronRight,
							size: IconSize.PX24,
							style: { fill: theme.on_surface_variant },
						}),
					]
				})
				.flat(),
			currentFolder
				? [
						m(
							".pl-8.pr-8.pt-4.pb-4.text-ellipsis.font-weight-500",
							{
								style: {
									// match the border of breadcrumb links
									border: BREADCRUMB_BORDER_NONE,
									"max-width": BREADCRUMBS_ITEM_MAXWIDTH,
								},
							},
							" " + driveFolderName(currentFolder).text,
						),
					]
				: null,
		])
	}
	private async onLoadParents(
		dom: HTMLElement,
		loadParents: () => Promise<driveTypeRefs.DriveFolder[]>,
		onClick: DriveBreadcrumbsAttrs["onClick"],
		onDropInto: DriveBreadcrumbsAttrs["onDropInto"],
	) {
		const loadedParents = await loadParents()

		const dropdown = new Dropdown(() => {
			let timeoutId: number | null = null

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
					drop: (event) => {
						dropdown.close()
						onDropInto?.({ type: "folder", folder: parent }, event)
					},
					dragover: (event) => {
						if (timeoutId != null) {
							clearTimeout(timeoutId)
						}

						const target = event.target as HTMLElement
						target.classList.add("state-bg", "selected")
					},
					dragleave: (event) => {
						const target = event.target as HTMLElement
						target.classList.remove("state-bg", "selected")

						timeoutId = setTimeout(() => dropdown.close(), 500) as unknown as number
					},
				}
			})
		}, 200)
		dropdown.setOrigin(dom.getBoundingClientRect())
		modal.displayUnique(dropdown, false)
	}
}
