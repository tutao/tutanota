import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType, KeyVerificationResultType, KeyVerificationSourceOfTruth } from "../../../api/common/TutanotaConstants"
import { TextField, TextFieldType } from "../../../gui/base/TextField"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang, MaybeTranslation, TranslationKey } from "../../../misc/LanguageViewModel"
import jsQR from "jsqr"
import { KeyVerificationQrPayload } from "../KeyVerificationQrPayload"
import { MalformedQrPayloadError } from "../../../api/common/error/MalformedQrPayloadError"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"
import { PermissionType } from "../../../native/common/generatedipc/PermissionType"
import { isApp } from "../../../api/common/Env"
import { completeStageNow } from "./KeyVerificationWizardUtils"

enum QrCameraState {
	STOPPED,
	PERMISSION_CHECK,
	INIT_VIDEO,
	SCANNING,
	PERMISSION_DENIED,
}

export class MethodExecutionPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null

	private disableNextButton: boolean = true

	qrVideo: HTMLVideoElement | null = null
	qrMediaStream: MediaStream | null = null
	qrCameraState: QrCameraState = QrCameraState.STOPPED

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
		if (vnode.attrs.data.method == KeyVerificationMethodType.qr) {
			this.requestCameraPermission(vnode.attrs.data).then((r) => m.redraw())
		}
	}

	async requestCameraPermission(keyVerificationWizardData: KeyVerificationWizardData): Promise<void> {
		this.qrCameraState = QrCameraState.PERMISSION_CHECK

		if (isApp()) {
			const hasPermission = await keyVerificationWizardData.mobileSystemFacade.hasPermission(PermissionType.Camera)
			if (hasPermission) {
				this.qrCameraState = QrCameraState.INIT_VIDEO
			} else {
				try {
					await keyVerificationWizardData.mobileSystemFacade.requestPermission(PermissionType.Camera)
					this.qrCameraState = QrCameraState.INIT_VIDEO
				} catch (e) {
					this.qrCameraState = QrCameraState.PERMISSION_DENIED
				}
			}
		} else {
			this.qrCameraState = QrCameraState.INIT_VIDEO
		}
	}

	onremove(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.cleanupVideo()
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

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const attrs: MethodExecutionPageAttrs = vnode.attrs as MethodExecutionPageAttrs

		const { method } = attrs.data

		if (method === KeyVerificationMethodType.qr) {
			return m(
				KeyVerificationWizardPage,
				{
					hideNextButton: true,
				},
				this.renderQrMethod(attrs),
			)
		} else {
			return "This should not happen. Please report."
		}
	}

	private renderQrMethod(attrs: MethodExecutionPageAttrs): Children {
		return [m(".center", this.getStateMessage()), this.getVideoElement(attrs)]
	}

	private getVideoElement(attrs: MethodExecutionPageAttrs): Children | null {
		if (this.qrCameraState == QrCameraState.INIT_VIDEO || this.qrCameraState == QrCameraState.SCANNING) {
			const video = m("video[autoplay][muted][playsinline]", {
				oncreate: async (videoNode) => {
					this.qrVideo = assertNotNull(videoNode.dom as HTMLVideoElement)
					try {
						await this.runQrScanner(attrs)
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

	private async runQrScanner(attrs: MethodExecutionPageAttrs) {
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

		requestAnimationFrame(() => this.runQrScannerTick(video, canvas, context2d, attrs))
	}

	private async runQrScannerTick(video: HTMLVideoElement, canvas: HTMLCanvasElement, context2d: CanvasRenderingContext2D, attrs: MethodExecutionPageAttrs) {
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

						attrs.data.mailAddress = payload.mailAddress

						const serverFingerprint = await attrs.data.keyVerificationFacade.getFingerprint(
							payload.mailAddress,
							KeyVerificationSourceOfTruth.PublicKeyService,
						)
						if (serverFingerprint == null) {
							attrs.data.result = KeyVerificationResultType.QR_MAIL_ADDRESS_NOT_FOUND
						} else if (serverFingerprint.fingerprint !== payload.fingerprint) {
							attrs.data.result = KeyVerificationResultType.QR_FINGERPRINT_MISMATCH
						} else {
							attrs.data.publicKeyFingerprint = serverFingerprint
							attrs.data.result = KeyVerificationResultType.QR_OK
						}
					} catch (e) {
						if (e instanceof SyntaxError || e instanceof MalformedQrPayloadError) {
							// SyntaxError: JSON.parse failed
							// MalformedQrPayloadError: malformed payload
							// throw new UserError("keyManagement.qrCodeInvalid_msg")
							attrs.data.result = KeyVerificationResultType.QR_MALFORMED_PAYLOAD
						} else {
							throw e
						}
					} finally {
						// attrs.cleanup()
						await attrs.data.reloadParent()

						emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE)
					}
				}
			}
		}

		requestAnimationFrame(() => {
			if (this.qrCameraState == QrCameraState.SCANNING) {
				this.runQrScannerTick(video, canvas, context2d, attrs)
			}
		})
	}
}

export class MethodExecutionPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	constructor(data: KeyVerificationWizardData) {
		this.data = data
	}

	headerTitle(): MaybeTranslation {
		if (this.data.method === KeyVerificationMethodType.text) {
			return "keyManagement.textVerification_label"
		} else if (this.data.method === KeyVerificationMethodType.qr) {
			return "keyManagement.qrVerification_label"
		} else {
			return "keyManagement.keyVerification_label"
		}
	}

	async nextAction(showErrorDialog: boolean): Promise<boolean> {
		const usageTest = this.data.usageTest
		let stageNumber: number | null = null

		console.log("MethodExecutionPage: nextAction")

		if (this.data.method === KeyVerificationMethodType.text) {
			stageNumber = 5
		} else if (this.data.method === KeyVerificationMethodType.qr) {
			stageNumber = this.data.result === KeyVerificationResultType.QR_OK ? 5 : 6
		}

		if (stageNumber != null) {
			const stage = usageTest.getStage(stageNumber)
			await completeStageNow(stage)
			return true
		}

		return false
	}

	isEnabled(): boolean {
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}
}
