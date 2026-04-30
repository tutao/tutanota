import m, { Children, Component, Vnode } from "mithril"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { DataFile } from "../../../common/api/common/DataFile"
import { modal } from "../../../common/gui/base/Modal"
import { Shortcut } from "../../../common/misc/KeyManager"
import { uint8ArrayToString } from "@tutao/utils"
import { theme } from "../../../common/gui/theme"

export interface FileViewerAttrs {
	mimeType: string
	// for some things we would be content with just having a URL that can be loaded but for some we need to load
	// the data (and it's best to not do it over IPC but via special URL)
	file: DataFile | FileReference
	url: string
}

export class FileViewer implements Component<FileViewerAttrs> {
	static show({ file }: { file: DataFile | FileReference }) {
		// FIXME: revoke the URL!!
		const url = prepareViewingUrl(file)
		// FIXME: this dialog type is not it, we need some kind of wider dialog
		modal.display({
			view() {
				return m(FileViewer, { url, mimeType: file.mimeType, file })
			},
			backgroundClick() {
				modal.remove(this)
			},
			onClose() {
				// revoke the url here
			},
			async hideAnimation(): Promise<void> {},
			shortcuts(): Shortcut[] {
				return []
			},
			callingElement(): HTMLElement | null {
				// FIXME: show calling button
				return null
			},
			popState(e: Event): boolean {
				return true
			},
		})
	}

	view({ attrs: { mimeType, url, file } }: Vnode<FileViewerAttrs>): Children {
		return m(
			"",
			{
				style: {},
			},
			this.renderViewer({ url, mimeType, file }),
		)
	}

	private renderViewer({ url, mimeType, file }: FileViewerAttrs): Children {
		const mainType = mimeGetMainType(mimeType)
		switch (mainType) {
			case "image":
				return m("img", { src: url, style: { maxWidth: "100%", maxHeight: "90vh", margin: "0 auto" } })
			case "text": {
				// FIXME: a terrible hack for now, we need to resolve this data earlier
				return this.renderTextViewer(file)
			}
			case "application": {
				if (mimeType === "application/json") {
					return this.renderTextViewer(file)
				} else {
					return this.renderUnknownFileTYpe(mimeType)
				}
			}
			default:
				return this.renderUnknownFileTYpe(mimeType)
		}
	}
	private renderUnknownFileTYpe(mimeType: string) {
		return m("", `Unknown type: ${mimeType}`)
	}

	private renderTextViewer(file: DataFile | FileReference) {
		const content = (file as DataFile).data
		const text = uint8ArrayToString("utf-8", content)
		return m(
			".scroll",
			{
				style: {
					maxWidth: "80rem",
					backgroundColor: theme.surface,
					margin: "0 auto",
				},
			},
			text,
		)
	}
}

function prepareViewingUrl(file: DataFile | FileReference): string {
	if (file._type === "DataFile") {
		const blob = new Blob([file.data], { type: file.mimeType })
		return URL.createObjectURL(blob)
	} else {
		throw new Error("FIXME")
	}
}

function mimeGetMainType(mimeType: string): string {
	return mimeType.split("/")[0]
}
