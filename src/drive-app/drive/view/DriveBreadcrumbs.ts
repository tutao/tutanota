import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderType } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { getElementId, getListId } from "../../../common/api/common/utils/EntityUtils"
import { pureComponent } from "../../../common/gui/base/PureComponent"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"
import { createAsyncDropdown } from "../../../common/gui/base/Dropdown"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton"

export interface DriveBreadcrumbAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	loadParents: () => Promise<DriveFolder[]>
}

const BreadcrumbLink = pureComponent<{ label: Translation; href: string }>(({ label, href }) => {
	return m(
		m.route.Link,
		{
			href,
			selector: "a.click.no-text-decoration.state-bg.pl-8.pr-8.pt-4.pb-4.border-radius-4",
			"data-testid": `btn:${lang.getTestId(label)}`,
			onkeyup: (e: KeyboardEvent, dom: HTMLElement) => {
				if (isKeyPressed(e.key, Keys.SPACE)) {
					m.route.set(href)
				}
			},
		},
		label.text,
	)
})

function folderRoute(entry: DriveFolder): string {
	return `/drive/${getListId(entry)}/${getElementId(entry)}`
}

export class DriveBreadcrumbs implements Component<DriveBreadcrumbAttrs> {
	view({ attrs: { currentFolder, parents, loadParents } }: Vnode<DriveBreadcrumbAttrs>): Children {
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
							label: lang.makeTranslation(`nav:${entry.name}`, folderName(entry)),
							href: folderRoute(entry),
						}),
						m("", "/"),
					]
				})
				.flat(),
			currentFolder ? [m("", " " + folderName(currentFolder))] : null,
		])
	}
	private onLoadParents(dom: HTMLElement, loadParents: () => Promise<DriveFolder[]>) {
		const newClickEvent = new MouseEvent("click")
		createAsyncDropdown({
			lazyButtons: async () => {
				const loadedParents = await loadParents()
				return loadedParents.map((parent) => {
					const name = folderName(parent)
					return {
						label: lang.makeTranslation(name, name),
						click: () => {
							m.route.set(folderRoute(parent))
						},
					}
				})
			},
		})(newClickEvent, dom)
	}
}

function folderName(folder: DriveFolder): string {
	switch (folder.type) {
		case DriveFolderType.Root:
			// FIXME
			return "Home"
		case DriveFolderType.Trash:
			// FIXME
			return "Trash"
		default:
			return folder.name
	}
}
