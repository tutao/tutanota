import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel"
import { Card } from "../../../gui/base/Card"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import jsQR from "jsqr"
import { KeyVerificationQrPayload } from "../KeyVerificationQrPayload"
import { MalformedQrPayloadError } from "../../../api/common/error/MalformedQrPayloadError"
import { KeyVerificationResultType, KeyVerificationSourceOfTruth } from "../../../api/common/TutanotaConstants"
import { PermissionType } from "../../../native/common/generatedipc/PermissionType"
import { isApp } from "../../../api/common/Env"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { SingleLineTextField } from "../../../gui/base/SingleLineTextField"
import { Icons } from "../../../gui/base/icons/Icons"
import { ButtonColor, getColors } from "../../../gui/base/Button"
import { TextFieldType } from "../../../gui/base/TextField"

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
}

export class VerificationByQrCodePage implements Component<VerificationByQrCodePageAttrs> {
	private dom: HTMLElement | null = null
	qrVideo: HTMLVideoElement | null = null
	qrMediaStream: MediaStream | null = null
	qrCameraState: QrCameraState = QrCameraState.STOPPED

	oncreate(vnode: VnodeDOM<VerificationByQrCodePageAttrs>): any {
		this.requestCameraPermission(vnode.attrs.model).then((r) => m.redraw())
	}

	view(vnode: Vnode<VerificationByQrCodePageAttrs>): Children {
		const { model, goToSuccessPage } = vnode.attrs

		const markAsVerifiedTranslationKey: TranslationKey = "keyManagement.markAsVerified_action"
		return m(".pt.pb.flex.col.gap-vpad", [
			m(Card, [
				m(
					"",
					m(".h4.mb-0.pl-vpad-s", lang.get("keyManagement.qrVerification_label")),
					m("p.mt-xs.mb-s.pl-vpad-s", lang.get("keyManagement.verificationByQrCodeScan_label")),
				),
			]),
			m(Card, {
				style: { padding: "0" },
				// TODO: move QR stuff from MethodExecutionPage
			}),
			model.result === KeyVerificationResultType.QR_OK ? this.renderConfirmation(model) : this.renderQrVideoStream(model),
			m(
				".align-self-center.full-width",
				m(LoginButton, {
					label: markAsVerifiedTranslationKey,
					onclick: () => {
						model.trust()
						goToSuccessPage()
					},
					disabled: model.result !== KeyVerificationResultType.QR_OK,
				}),
			),
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

	private renderConfirmation(model: KeyVerificationModel) {
		return m(
			".flex.flex-column.gap-vpad",
			{},
			m(SingleLineTextField, {
				ariaLabel: lang.get("mailAddress_label"),
				placeholder: lang.get("mailAddress_label"),
				disabled: true,
				classes: ["flex", "gap-vpad-s", "items-center", "pl-vpad-s", "outlined"],
				leadingIcon: {
					icon: Icons.At,
					color: getColors(ButtonColor.Content).button,
				},
				value: model.mailAddress,
				type: TextFieldType.Text,
			}),
			m(
				Card,
				{ classes: ["flex", "flex-column", "gap-vpad"] },
				m(MonospaceTextDisplay, {
					text: model.getFingerprint(),
					placeholder: lang.get("keyManagement.invalidMailAddress_msg"),
					chunkSize: 4,
					border: false,
					classes: ".mb-s",
				}),
			),
		)
	}

	private renderQrVideoStream(model: KeyVerificationModel): Children {
		return [m(".center", this.getStateMessage()), this.getVideoElement(model)]
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
							this.cleanupVideo()
						} else if (e instanceof DOMException && e.name === "NotAllowedError") {
							this.cleanupVideo()
							this.qrCameraState = QrCameraState.PERMISSION_DENIED
							m.redraw()
						} else {
							throw e
						}
					}
				},
				style: { display: "block", "max-width": "100%" },
			})
			return m(".mt.mb.border-radius", { style: { overflow: "clip" } }, video)
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

		const thisScanner = Date.now()

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

					let payload: KeyVerificationQrPayload
					try {
						payload = JSON.parse(code.data) as KeyVerificationQrPayload
						if (payload.mailAddress == null || payload.fingerprint == null) {
							throw new MalformedQrPayloadError("")
						}

						model.mailAddress = payload.mailAddress

						const serverFingerprint = await model.keyVerificationFacade.getFingerprint(
							payload.mailAddress,
							KeyVerificationSourceOfTruth.PublicKeyService,
						)
						if (serverFingerprint == null) {
							model.result = KeyVerificationResultType.QR_MAIL_ADDRESS_NOT_FOUND
						} else if (serverFingerprint.fingerprint !== payload.fingerprint) {
							model.result = KeyVerificationResultType.QR_FINGERPRINT_MISMATCH
						} else {
							model.publicKeyFingerprint = serverFingerprint
							model.result = KeyVerificationResultType.QR_OK
						}
					} catch (e) {
						if (e instanceof SyntaxError || e instanceof MalformedQrPayloadError) {
							// SyntaxError: JSON.parse failed
							// MalformedQrPayloadError: malformed payload
							// throw new UserError("keyManagement.qrCodeInvalid_msg")
							model.result = KeyVerificationResultType.QR_MALFORMED_PAYLOAD
						} else {
							throw e
						}
					} finally {
						// await this.reloadParent()

						if (model.result === KeyVerificationResultType.QR_OK) {
							m.redraw()
						}
					}
				}
			}
		}

		requestAnimationFrame(() => {
			if (this.qrCameraState == QrCameraState.SCANNING) {
				this.runQrScannerTick(video, canvas, context2d, model)
			}
		})
	}

	async requestCameraPermission(model: KeyVerificationModel): Promise<void> {
		this.qrCameraState = QrCameraState.PERMISSION_CHECK

		if (isApp()) {
			const hasPermission = await model.mobileSystemFacade.hasPermission(PermissionType.Camera)
			if (hasPermission) {
				this.qrCameraState = QrCameraState.INIT_VIDEO
			} else {
				try {
					await model.mobileSystemFacade.requestPermission(PermissionType.Camera)
					this.qrCameraState = QrCameraState.INIT_VIDEO
				} catch (e) {
					this.qrCameraState = QrCameraState.PERMISSION_DENIED
				}
			}
		} else {
			this.qrCameraState = QrCameraState.INIT_VIDEO
		}
	}
}
