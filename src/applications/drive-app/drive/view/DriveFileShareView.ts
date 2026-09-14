import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import m, { Children, Component, Vnode } from "mithril"
import { TopLevelAttrs } from "../../../../ui/base/TopLevelView"
import { DriveFile, DriveFileShare } from "@tutao/entities/drive"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Icon, IconSize, progressIcon } from "../../../../ui/base/Icon"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { assertNotNull, base64UrlToBase64 } from "@tutao/utils"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { formatDateWithWeekdayAndYearLong } from "../../../../ui/utils/Formatter"
import { DataFile } from "../../../../entities/tutanota/Utils"
import { PasswordFieldNew } from "../../../common/signup/components/PasswordFieldNew"
import { lang } from "../../../../ui/utils/LanguageViewModel"

export interface DriveFileShareViewAttrs extends TopLevelAttrs {
	downloadFileForShare: (
		shareId: Id,
		authToken: string,
		encParam: { type: "key"; sharedKey: Base64 } | { type: "password"; password: string; salt: string; sharedKey: Base64 },
	) => Promise<{ file: DriveFile; fileSessionKey: Uint8Array<ArrayBuffer>; share: DriveFileShare }>
	downloadBlobsForShare: (file: DriveFile, fileSessionKey: Uint8Array<ArrayBuffer>, authToken: Base64) => Promise<DataFile>
	saveDataFile: (file: DataFile) => Promise<void>
}

type DriveFileShareViewState =
	| {
			status: "success"
			file: DriveFile
			fileSessionKey: Uint8Array<ArrayBuffer>
			share: DriveFileShare
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
	private state: DriveFileShareViewState = { status: "loading" }
	private attrs: DriveFileShareViewAttrs

	constructor(vnode: Vnode<DriveFileShareViewAttrs>) {
		super()
		this.attrs = vnode.attrs
	}

	view(vnode: Vnode<DriveFileShareViewAttrs>): Children {
		const state = this.state
		return m(
			".flex.plr-64.pt-16.pb-32.fill-absolute.nav-bg",
			m(".flex.col.flex-space-between.flex-grow", [
				m(".logo-height", m.trust(theme.logo)),
				m(".flex.col.gap-8.align-self-center.max-width-m", this.renderForState(state)),
				m(""),
			]),
		)
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
		return [m(".flex.items-center", progressIcon(), m(".b.h4.ml-8", lang.getTranslationText("loading_msg")))]
	}

	private renderError(type: "notFound" | "generic"): Children {
		return type === "notFound"
			? [m(".b.h2", lang.getTranslationText("fileNotFound_msg")), m(".text-fade", lang.getTranslationText("fileDoesNotExist_msg"))]
			: [m(".b.h2", lang.getTranslationText("fileNotAvailable_msg")), m(".text-fade", lang.getTranslationText("fileLoadingError_msg"))]
	}

	private renderFile(file: DriveFile): Children {
		return [
			m(
				".flex.items-center.gap-8",
				m(Icon, {
					icon: Icons.EmptyDocumentFilled,
					title: "emptyString_msg",
					size: IconSize.PX40,
					container: "div",
				}),
				m(".b.h2", file.name),
			),
			m(PrimaryButton, {
				class: "items-center",
				label: "download_action",
				onclick: () => {
					this.downloadFile(file)
				}, //FIXME,
			}),
			this.state.status === "success" && this.state.share.expirationDate
				? m(
						".text-fade",
						lang.getTranslation("fileExpirationDate_msg", { "{date}": formatDateWithWeekdayAndYearLong(this.state.share.expirationDate) }).text,
					)
				: null,
		]
	}

	private async downloadFile(file: DriveFile) {
		if (this.state.status === "success") {
			const authToken = base64UrlToBase64(m.route.param("authToken"))
			const dataFile = await this.attrs.downloadBlobsForShare(file, this.state.fileSessionKey, authToken)
			await this.attrs.saveDataFile(dataFile)
		}
	}

	protected async onNewUrl() {
		const { shareId, authToken } = m.route.param()

		const fragmentParams = new URLSearchParams(location.hash.slice(1))
		if (fragmentParams.get("salt") == null) {
			void this.downloadFileWithKey(shareId, authToken)
		} else {
			this.state = {
				status: "password",
				password: "",
			}
		}
	}

	private async downloadFileWithKey(shareId: Id, authToken: string) {
		// FIXME: assuming the key is there for now
		const base64UrlKey = assertNotNull(new URLSearchParams(location.hash.slice(1)).get("shareKey"))

		try {
			// FIXME: I'd expect CryptoError to be thrown if key does not match. However, we receive a "valid" file with an empty name. Why?
			const { file, fileSessionKey, share } = await this.attrs.downloadFileForShare(shareId, base64UrlToBase64(authToken), {
				type: "key",
				sharedKey: base64UrlToBase64(base64UrlKey),
			})
			this.state = {
				status: "success",
				file,
				fileSessionKey,
				share,
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

	private async downloadFileWithPassword(shareId: Id, authToken: string, salt: string, password: string) {
		const base64UrlKey = assertNotNull(new URLSearchParams(location.hash.slice(1)).get("shareKey"))

		try {
			const { file, fileSessionKey, share } = await this.attrs.downloadFileForShare(shareId, base64UrlToBase64(authToken), {
				type: "password",
				password,
				salt,
				sharedKey: base64UrlToBase64(base64UrlKey),
			})
			this.state = {
				status: "success",
				file,
				fileSessionKey,
				share,
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
		return m(".flex.col.gap-8", [
			m(PasswordFieldNew, {
				value: state.password,
				oninput: (value) => (state.password = value),
				label: "password_label",
				onReturnKeyPressed: () => {
					this.submitPassword(state)
				},
			}),
			m(PrimaryButton, {
				label: "submit_action",
				onclick: () => {
					this.submitPassword(state)
				},
			}),
		])
	}
	private submitPassword(state: { status: "password"; password: string }) {
		const { shareId, authToken } = m.route.param()
		const salt = assertNotNull(new URLSearchParams(location.hash.slice(1)).get("salt"))
		this.state = { status: "loading" }
		void this.downloadFileWithPassword(shareId, authToken, salt, state.password)
	}
}
