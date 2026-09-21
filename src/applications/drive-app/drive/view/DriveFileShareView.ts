import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import m, { Children, Component, Vnode } from "mithril"
import { TopLevelAttrs } from "../../../../ui/base/TopLevelView"
import { locator } from "../../../common/api/main/CommonLocator"
import { DriveFile } from "@tutao/entities/drive"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Icon, IconSize, progressIcon } from "../../../../ui/base/Icon"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { base64UrlToBase64 } from "@tutao/utils"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { TextField } from "../../../../ui/base/TextField"

export interface DriveFileShareViewAttrs extends TopLevelAttrs {}

type DriveFileShareViewState =
	| {
			status: "success"
			file: DriveFile
	  }
	| {
			status: "loading"
	  }
	| {
			status: "password"
			password: string
	  }
	| {
			status: "error"
			type: "notFound" | "generic"
	  }

export class DriveFileShareView extends BaseTopLevelView implements Component<DriveFileShareViewAttrs> {
	private base64UrlKey = location.hash.slice(1)
	private state: DriveFileShareViewState = { status: "loading" }

	view(vnode: Vnode<DriveFileShareViewAttrs>): Children {
		const state = this.state

		return m(".flex.mlr-64.mt-64.mb-64.fill-absolute", [
			m(".flex.col.flex-space-between", [m(".logo-height", m.trust(theme.logo)), m(".flex.col.gap-8", this.renderForState(state)), m("")]),
			m(".flex.col", ""),
		])
	}

	private renderForState(state: DriveFileShareViewState) {
		switch (state.status) {
			case "loading":
				return this.renderLoading()
			case "password":
				return this.renderPassword(state)
			case "error":
				return this.renderError(state.type)
			case "success":
				return this.renderFile(state.file)
		}
	}

	private renderLoading(): Children {
		return [
			m(
				".flex.items-center",
				progressIcon(),
				// FIXME: translation
				m(".b.h4.ml-8", "Loading file"),
			),
		]
	}

	private renderError(type: "notFound" | "generic"): Children {
		return type === "notFound"
			? [
					// FIXME: translations
					m(".b.h2", "File not found"),
					m(".text-fade", "This file does not exist. It may have been deleted or unshared."),
				]
			: [
					// FIXME: translations
					m(".b.h2", "File not available"),
					m(".text-fade", "An error occurred while loading this file."),
				]
	}

	private renderFile(file: DriveFile): Children {
		return [
			m(
				".flex.items-center",
				m(Icon, {
					icon: Icons.EmptyDocumentFilled,
					title: "emptyString_msg",
					size: IconSize.PX40,
					container: "div",
				}),
				m(".b.h2", file.name),
			),
			m(PrimaryButton, {
				label: "download_action",
				onclick: () => {
					this.downloadFile(file)
				}, //FIXME,
			}),
		]
	}

	private async downloadFile(file: DriveFile) {
		const dataFile = await locator.driveFacade.downloadBlobsForShare(file, base64UrlToBase64(this.base64UrlKey))
		await locator.fileController.saveDataFile(dataFile)
	}

	protected async onNewUrl() {
		const { shareId, nonce } = m.route.param()

		if (location.hash !== "") {
			void this.downloadFileWithKey(shareId, nonce)
		} else {
			this.state = {
				status: "password",
				password: "",
			}
		}
	}

	private async downloadFileWithKey(shareId: Id, nonce: string) {
		// FIXME: assuming the key is there for now
		const base64UrlKey = location.hash.slice(1)

		try {
			// FIXME: I'd expect CryptoError to be thrown if key does not match. However, we receive a "valid" file with an empty name. Why?
			const file = await locator.driveFacade.downloadFileForShare(shareId, base64UrlToBase64(nonce), {
				type: "key",
				sharedKey: base64UrlToBase64(base64UrlKey),
			})
			this.state = {
				status: "success",
				file,
			}
		} catch (e) {
			if (e instanceof NotAuthorizedError || e instanceof NotFoundError) {
				this.state = { status: "error", type: "notFound" }
			} else {
				this.state = { status: "error", type: "generic" }
				handleUncaughtError(e) // FIXME: do we want this?
			}
		}
		m.redraw()
	}

	private async downloadFileWithPassword(shareId: Id, nonce: string, password: string) {
		try {
			// FIXME: I'd expect CryptoError to be thrown if key does not match. However, we receive a "valid" file with an empty name. Why?
			const file = await locator.driveFacade.downloadFileForShare(shareId, base64UrlToBase64(nonce), {
				type: "password",
				password,
			})
			this.state = {
				status: "success",
				file,
			}
		} catch (e) {
			if (e instanceof NotAuthorizedError || e instanceof NotFoundError) {
				this.state = { status: "error", type: "notFound" }
			} else {
				this.state = { status: "error", type: "generic" }
				handleUncaughtError(e) // FIXME: do we want this?
			}
		}
		m.redraw()
	}

	private renderPassword(state: { status: "password"; password: string }): Children {
		return m(".flex.col", [
			m(TextField, {
				value: state.password,
				oninput: (value) => (state.password = value),
				label: "password_label",
			}),
			m(PrimaryButton, {
				label: "ok_action",
				onclick: () => {
					const { shareId, nonce } = m.route.param()
					this.state = { status: "loading" }
					void this.downloadFileWithPassword(shareId, nonce, state.password)
				},
			}),
		])
	}
}
