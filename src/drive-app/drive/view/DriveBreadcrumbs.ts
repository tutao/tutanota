import m, { Children, Component, Vnode } from "mithril"
import { FolderItem } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { getElementId, getListId } from "../../../common/api/common/utils/EntityUtils"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"
import { createAsyncDropdown } from "../../../common/gui/base/Dropdown"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton"
import { theme } from "../../../common/gui/theme"
import { driveFolderName } from "./DriveGuiUtils"

export interface DriveBreadcrumbsAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	loadParents: () => Promise<DriveFolder[]>
	onDropInto: (f: FolderItem, event: DragEvent) => unknown
}

export interface BreadcrumbLinkAttrs {
	label: Translation
	href: string
	onDrop: (event: DragEvent) => unknown
}

class BreadcrumbLink implements Component<BreadcrumbLinkAttrs> {
	private isDraggedOver: boolean = false

	view({ attrs: { label, href, onDrop } }: Vnode<BreadcrumbLinkAttrs>): Children {
		return m(
			m.route.Link,
			{
				href,
				selector: "a.click.no-text-decoration.state-bg.pl-8.pr-8.pt-4.pb-4.border-radius-4",
				"data-testid": `btn:${lang.getTestId(label)}`,
				style: { border: this.isDraggedOver ? `1px solid ${theme.primary}` : `1px solid transparent` },
				onkeyup: (e: KeyboardEvent, dom: HTMLElement) => {
					if (isKeyPressed(e.key, Keys.SPACE)) {
						m.route.set(href)
					}
				},
				ondragover: () => {
					this.isDraggedOver = true
				},
				ondragleave: () => {
					this.isDraggedOver = false
				},
				ondrop: (event: DragEvent) => {
					this.isDraggedOver = false
					onDrop(event)
					console.log("king, you dropped this:", event)
				},
			},
			label.text,
		)
	}
}

function folderRoute(entry: DriveFolder): string {
	return `/drive/${getListId(entry)}/${getElementId(entry)}`
}

export class DriveBreadcrumbs implements Component<DriveBreadcrumbsAttrs> {
	view({ attrs: { currentFolder, parents, loadParents, onDropInto } }: Vnode<DriveBreadcrumbsAttrs>): Children {
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
										onclick: (_, dom) => this.onLoadParents(dom, loadParents),
										label: lang.makeTranslation("btn:showParentFolders", "Show parent folders"),
									} satisfies BaseButtonAttrs),
									m("", "/"),
								]
							: null,
						m(BreadcrumbLink, {
							label: driveFolderName(entry),
							href: folderRoute(entry),
							onDrop: (event) => {
								onDropInto({ type: "folder", folder: entry }, event)
							},
						}),
						m("", "/"),
					]
				})
				.flat(),
			currentFolder ? [m("", " " + driveFolderName(currentFolder).text)] : null,
		])
	}
	private onLoadParents(dom: HTMLElement, loadParents: () => Promise<DriveFolder[]>) {
		const newClickEvent = new MouseEvent("click")
		createAsyncDropdown({
			lazyButtons: async () => {
				const loadedParents = await loadParents()
				return loadedParents.map((parent) => {
					return {
						label: driveFolderName(parent),
						click: () => {
							m.route.set(folderRoute(parent))
						},
					}
				})
			},
		})(newClickEvent, dom)
	}
}
