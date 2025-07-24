import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel"
import { Card } from "../../../gui/base/Card"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { KeyVerificationModel, PublicIdentity } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import jsQR from "jsqr"
import { IdentityKeyQrVerificationResult, IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"
import { isApp } from "../../../api/common/Env"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { SingleLineTextField } from "../../../gui/base/SingleLineTextField"
import { Icons } from "../../../gui/base/icons/Icons"
import { ButtonColor, getColors } from "../../../gui/base/Button"
import { TextFieldType } from "../../../gui/base/TextField"
import { Icon } from "../../../gui/base/Icon"
import { theme } from "../../../gui/theme"
import { BootIcons } from "../../../gui/base/icons/BootIcons"
import { TitleSection } from "../../../gui/TitleSection"

export type QrCodePageErrorType =
	| "camera_permission_denied"
	| "malformed_qr"
	| "email_not_found"
	| "qr_code_mismatch"
	| "camera_not_found"
	| "video_source_error"
	| "unknown"

export type GoToErrorPageHandler = (et: QrCodePageErrorType) => void

enum QrCameraState {
	STOPPED,
	PERMISSION_CHECK,
	INIT_VIDEO,
	SCANNING,
	PERMISSION_DENIED,
}

type VerificationByQrCodePageAttrs = {
	model: KeyVerificationModel
	goToSuccessPage: () => void
	goToErrorPage: GoToErrorPageHandler
}

export class VerificationByQrCodeInputPage implements Component<VerificationByQrCodePageAttrs> {
	qrVideo: HTMLVideoElement | null = null
	qrMediaStream: MediaStream | null = null
	qrCameraState: QrCameraState = QrCameraState.STOPPED
	goToErrorPage: GoToErrorPageHandler | null = null

	oncreate(vnode: VnodeDOM<VerificationByQrCodePageAttrs>): any {
		this.requestCameraPermission(vnode.attrs.model).then((r) => m.redraw())
		this.goToErrorPage = vnode.attrs.goToErrorPage
	}

	onremove() {
		this.cleanupVideo()
	}

	view(vnode: Vnode<VerificationByQrCodePageAttrs>): Children {
		const { model, goToSuccessPage } = vnode.attrs
		const qrOk = model.getKeyVerificationResult() === IdentityKeyQrVerificationResult.QR_OK

		const markAsVerifiedTranslationKey: TranslationKey = "keyManagement.markAsVerified_action"
		return m(".pt.pb.flex.col.gap-vpad", [
			m(Card, [
				m(TitleSection, {
					title: lang.get("keyManagement.qrVerification_label"),
					subTitle: lang.get("keyManagement.verificationByQrCodeScan_label"),
					icon: Icons.QuestionMarkOutline,
				}),
			]),
			qrOk ? this.renderConfirmation(assertNotNull(model.getPublicIdentity())) : this.renderQrVideoStream(model),
			qrOk
				? m(
						".align-self-center.full-width",
						m(LoginButton, {
							label: markAsVerifiedTranslationKey,
							onclick: async () => {
								await model.trust(IdentityKeyVerificationMethod.qr)
								goToSuccessPage()
							},
							disabled: !qrOk,
							icon: !qrOk
								? undefined
								: m(Icon, {
										icon: Icons.Checkmark,
										class: "mr-xsm",
										style: {
											fill: theme.content_button_icon_selected,
										},
									}),
						}),
					)
				: undefined,
		])
	}

	private cleanupVideo() {
		this.qrCameraState = QrCameraState.STOPPED

		this.qrVideo?.pause()

		if (this.qrMediaStream != null) {
			for (const stream of this.qrMediaStream.getTracks()) {
				stream.stop()
			}
		}
	}

	private renderConfirmation(publicIdentity: PublicIdentity) {
		return m(
			".flex.flex-column.gap-vpad",
			{},
			m(SingleLineTextField, {
				ariaLabel: lang.get("mailAddress_label"),
				placeholder: lang.get("mailAddress_label"),
				disabled: true,
				classes: ["flex", "gap-vpad-s", "items-center", "pl-vpad-s", "outlined"],
				leadingIcon: {
					icon: BootIcons.Contacts,
					color: getColors(ButtonColor.Content).button,
				},
				value: publicIdentity.mailAddress,
				type: TextFieldType.Text,
			}),
			m(
				Card,
				{ classes: ["flex", "flex-column", "gap-vpad"] },
				// TODO: Translate
				m(
					"",
					"Compare the fingerprint displayed below to the one you received from the contact. Click on “Mark as verified” only if both fingerprints match.",
				),
				m(MonospaceTextDisplay, {
					text: publicIdentity.fingerprint,
					placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
					chunkSize: 4,
					border: false,
					classes: ".mb-s.mt-s",
				}),
			),
		)
	}

	private renderQrVideoStream(model: KeyVerificationModel): Children {
		return m(Card, [m(".center", this.getStateMessage()), this.getVideoElement(model)])
	}

	private getVideoElement(model: KeyVerificationModel): Children | null {
		if (this.qrCameraState == QrCameraState.INIT_VIDEO || this.qrCameraState == QrCameraState.SCANNING) {
			const video = m("video[autoplay][muted][playsinline]", {
				oncreate: async (videoNode) => {
					this.qrVideo = assertNotNull(videoNode.dom as HTMLVideoElement)
					try {
						await this.runQrScanner(model)
					} catch (e) {
						if (e instanceof DOMException && e.name === "AbortError") {
							// Operation cancelled by user. Nothing we can really do about it.
						} else if (e instanceof DOMException && e.name === "NotAllowedError") {
							this.qrCameraState = QrCameraState.PERMISSION_DENIED
							this.goToErrorPage?.("camera_permission_denied")
							m.redraw()
						} else if (e instanceof DOMException && e.name === "NotFoundError") {
							this.goToErrorPage?.("camera_not_found")
							m.redraw()
						} else if (e instanceof DOMException && e.name === "NotReadableError") {
							this.goToErrorPage?.("video_source_error")
							m.redraw()
						} else {
							throw e
						}
					}
				},
				style: { display: "block", "max-width": "100%" },
			})
			return m(".mt.mb.ml.mr.border-radius", { style: { overflow: "clip" } }, video)
		}
	}

	private getStateMessage(): string {
		switch (this.qrCameraState) {
			case QrCameraState.SCANNING:
				return "Scan QR code"
			case QrCameraState.INIT_VIDEO:
				return lang.get("keyManagement.waitingForVideo_msg")
			case QrCameraState.PERMISSION_DENIED:
				return "Enable camera permision in device settings"
			case QrCameraState.PERMISSION_CHECK:
				return "Waiting for permission"
			default:
				return ""
		}
	}

	private async runQrScanner(model: KeyVerificationModel) {
		// "environment" tells the web engine to prefer the rear camera if there are multiple
		this.qrMediaStream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: { facingMode: "environment" },
		})
		const video = assertNotNull(this.qrVideo)

		video.srcObject = this.qrMediaStream
		await video.play()

		const canvas = document.createElement("canvas")
		const context2d = assertNotNull(canvas.getContext("2d", { willReadFrequently: true }))

		requestAnimationFrame(() => this.runQrScannerTick(video, canvas, context2d, model))
	}

	private async runQrScannerTick(video: HTMLVideoElement, canvas: HTMLCanvasElement, context2d: CanvasRenderingContext2D, model: KeyVerificationModel) {
		if (video.readyState === video.HAVE_ENOUGH_DATA) {
			if (this.qrCameraState == QrCameraState.INIT_VIDEO) {
				this.qrCameraState = QrCameraState.SCANNING
				m.redraw()
			}

			// These are the logical dimensions of the camera's video stream.
			// They are unrelated to the size of the video element.
			canvas.height = video.videoHeight
			canvas.width = video.videoWidth

			// Fetch image from video stream by painting onto a canvas and reading from it
			context2d.drawImage(video, 0, 0, canvas.width, canvas.height)
			const imageData = context2d.getImageData(0, 0, canvas.width, canvas.height)

			if (imageData) {
				const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
				if (code) {
					// at this point, a QR code has been detected and decoded
					const verificationResult = await model.validateQrCodeAddress(code)
					if (verificationResult !== IdentityKeyQrVerificationResult.QR_OK) {
						this.goToErrorPage?.(this.resultToErrorType(verificationResult))
					}

					this.cleanupVideo()
					m.redraw()
				}
			}
		}

		requestAnimationFrame(() => {
			if (this.qrCameraState == QrCameraState.SCANNING) {
				this.runQrScannerTick(video, canvas, context2d, model)
			}
		})
	}

	resultToErrorType(kr: IdentityKeyQrVerificationResult | undefined): QrCodePageErrorType {
		switch (kr) {
			case IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH: {
				return "qr_code_mismatch"
			}
			case IdentityKeyQrVerificationResult.QR_MAIL_ADDRESS_NOT_FOUND: {
				return "email_not_found"
			}
			case IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD: {
				return "malformed_qr"
			}
		}
		return "unknown"
	}

	async requestCameraPermission(model: KeyVerificationModel): Promise<void> {
		this.qrCameraState = QrCameraState.PERMISSION_CHECK
		if (isApp()) {
			const hasPermission = await model.requestCameraPermission()
			if (hasPermission) {
				this.qrCameraState = QrCameraState.INIT_VIDEO
			} else {
				this.qrCameraState = QrCameraState.PERMISSION_DENIED
			}
		} else {
			this.qrCameraState = QrCameraState.INIT_VIDEO
		}
	}
}
