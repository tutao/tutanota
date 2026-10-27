import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import m, { Children, Component, Vnode } from "mithril"
import { TopLevelAttrs } from "../../../../ui/base/TopLevelView"
import { DriveFile, DriveFileShare } from "@tutao/entities/drive"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Icon, IconSize, progressIcon } from "../../../../ui/base/Icon"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { base64ToUint8Array, base64UrlToBase64 } from "@tutao/utils"
import { NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { formatDateWithWeekdayAndYearLong } from "../../../../ui/utils/Formatter"
import { DataFile } from "../../../../entities/tutanota/Utils"
import { PasswordFieldNew } from "../../../common/signup/components/PasswordFieldNew"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Dialog } from "../../../../ui/base/Dialog"
import { CryptoError } from "@tutao/crypto/error"

interface PasswordShareUrl {
	shareId: Id
	authToken: string
	shareKey: Uint8Array
	salt: Uint8Array
}

interface KeyShareUrl {
	shareId: Id
	authToken: string
	shareKey: Uint8Array
}

type ParsedShareUrl = { type: "password"; url: PasswordShareUrl } | { type: "key"; url: KeyShareUrl }

function isValidStringParam(value: unknown): value is NonEmptyString {
	return typeof value === "string" && value !== ""
}

function parseBase64UrlParam(param: unknown): Uint8Array | null {
	if (!isValidStringParam(param)) {
		return null
	}
	try {
		return base64ToUint8Array(base64UrlToBase64(param))
	} catch (e) {
		return null
	}
}

function parseShareUrl(params: Record<string, unknown>, hash: string): ParsedShareUrl | null {
	const { shareId, authToken: encodedAuthToken } = params

	if (!isValidStringParam(shareId) || !isValidStringParam(encodedAuthToken)) {
		return null
	}
	let authToken: string
	try {
		authToken = base64UrlToBase64(encodedAuthToken)
	} catch (e) {
		return null
	}

	const fragmentParams = new URLSearchParams(hash.slice(1))

	const shareKey = parseBase64UrlParam(fragmentParams.get("shareKey"))
	if (shareKey == null) {
		return null
	}
	const saltString = fragmentParams.get("salt")

	if (saltString != null) {
		// if salt is present, it is a password case
		const salt = parseBase64UrlParam(saltString)
		if (salt == null) {
			return null
		}
		return {
			type: "password",
			url: {
				shareId,
				authToken,
				salt,
				shareKey,
			},
		}
	} else {
		return {
			type: "key",
			url: {
				shareId,
				authToken,
				shareKey,
			},
		}
	}
}

export interface DriveFileShareViewAttrs extends TopLevelAttrs {
	downloadFileForShare: (
		shareId: Id,
		authToken: string,
		encParam: { type: "key"; shareKey: Uint8Array } | { type: "password"; password: string; salt: Uint8Array; shareKey: Uint8Array },
	) => Promise<{ file: DriveFile; fileSessionKey: Uint8Array<ArrayBuffer>; share: DriveFileShare }>
	downloadBlobsForShare: (file: DriveFile, fileSessionKey: Uint8Array<ArrayBuffer>, authToken: Base64) => Promise<DataFile>
	saveDataFile: (file: DataFile) => Promise<void>
}

type PasswordViewState = {
	status: "password"
	url: PasswordShareUrl
	password: string
}
type ViewState =
	| {
			status: "success"
			file: DriveFile
			fileSessionKey: Uint8Array<ArrayBuffer>
			share: DriveFileShare
			url: KeyShareUrl | PasswordShareUrl
	  }
	| {
			status: "loading"
	  }
	| PasswordViewState
	| {
			status: "error"
			type: "notFound" | "generic"
	  }
/**
 * Publicly accessible View for Drive file via shared link
 */
export class DriveFileShareView extends BaseTopLevelView implements Component<DriveFileShareViewAttrs> {
	private state: ViewState = { status: "loading" }
	private attrs: DriveFileShareViewAttrs

	constructor(vnode: Vnode<DriveFileShareViewAttrs>) {
		super()
		this.attrs = vnode.attrs
	}

	view(): Children {
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

	private renderForState(state: ViewState) {
		switch (state.status) {
			case "loading":
				return this.renderLoading()
			case "password":
				return this.renderPassword(state)
			case "error":
				return this.renderError(state.type)
			case "success":
				return this.renderFile(state.file, state.url)
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

	private renderFile(file: DriveFile, url: KeyShareUrl): Children {
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
					this.downloadFile(file, url)
				},
			}),
			this.state.status === "success" && this.state.share.expirationDate
				? m(
						".text-fade",
						lang.getTranslation("fileExpirationDate_msg", { "{date}": formatDateWithWeekdayAndYearLong(this.state.share.expirationDate) }).text,
					)
				: null,
		]
	}

	private async downloadFile(file: DriveFile, { authToken }: KeyShareUrl) {
		if (this.state.status === "success") {
			try {
				const dataFile = await this.attrs.downloadBlobsForShare(file, this.state.fileSessionKey, authToken)
				await this.attrs.saveDataFile(dataFile)
			} catch (e) {
				Dialog.message("couldNotAttachFile_msg")
				console.log("could not download the file", e)
			}
		}
	}

	protected async onNewUrl() {
		const parsedShareUrl = parseShareUrl(m.route.param(), location.hash)

		if (parsedShareUrl == null) {
			this.state = { status: "error", type: "generic" }
			return
		}

		if (parsedShareUrl.type === "key") {
			void this.downloadFileWithKey(parsedShareUrl.url)
		} else {
			this.state = {
				status: "password",
				url: parsedShareUrl.url,
				password: "",
			}
		}
	}

	private async downloadFileWithKey(url: KeyShareUrl) {
		const { authToken, shareId, shareKey } = url
		try {
			const { file, fileSessionKey, share } = await this.attrs.downloadFileForShare(shareId, base64UrlToBase64(authToken), {
				type: "key",
				shareKey,
			})
			this.state = {
				status: "success",
				file,
				fileSessionKey,
				share,
				url,
			}
		} catch (e) {
			if (e instanceof NotAuthorizedError || e instanceof NotFoundError) {
				this.state = { status: "error", type: "notFound" }
			} else if (e instanceof CryptoError) {
				this.state = { status: "error", type: "generic" }
				console.log(e)
			} else {
				this.state = { status: "error", type: "generic" }
				handleUncaughtError(e)
			}
		}
		m.redraw()
	}

	private async downloadFileWithPassword(url: PasswordShareUrl, password: string) {
		const { shareId, salt, authToken, shareKey } = url
		try {
			const { file, fileSessionKey, share } = await this.attrs.downloadFileForShare(shareId, authToken, {
				type: "password",
				password,
				salt,
				shareKey,
			})
			this.state = {
				status: "success",
				file,
				fileSessionKey,
				share,
				url,
			}
		} catch (e) {
			if (e instanceof NotAuthorizedError || e instanceof NotFoundError) {
				this.state = { status: "error", type: "notFound" }
			} else if (e instanceof CryptoError) {
				this.state = { status: "error", type: "generic" }
				console.log(e)
			} else {
				this.state = { status: "error", type: "generic" }
				handleUncaughtError(e)
			}
		}
		m.redraw()
	}

	private renderPassword(state: PasswordViewState): Children {
		return m(".flex.col.gap-8", [
			m(PasswordFieldNew, {
				value: state.password,
				oninput: (value) => {
					this.state = { ...state, password: value }
				},
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
	private submitPassword({ password, url }: PasswordViewState) {
		this.state = { status: "loading" }
		void this.downloadFileWithPassword(url, password)
	}
}
