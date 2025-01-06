import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType, KeyVerificationResultType, KeyVerificationSourceOfTruth } from "../../../api/common/TutanotaConstants"
import { TextField, TextFieldType } from "../../../gui/base/TextField"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel"
import jsQR from "jsqr"
import { KeyVerificationQrPayload } from "../KeyVerificationQrPayload"
import { MalformedQrPayloadError } from "../../../api/common/error/MalformedQrPayloadError"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"
import { MonospaceTextDisplay } from "../../../gui/base/MonospaceTextDisplay"
import { KeyVerificationWizardPage } from "../KeyVerificationWizardPage"
import { PermissionType } from "../../../native/common/generatedipc/PermissionType"
import { isApp } from "../../../api/common/Env"

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

		const { method, mailAddress, fingerprint } = attrs.data
		const { keyVerificationFacade, reloadParent } = attrs.data

		if (method === KeyVerificationMethodType.text) {
			return m(
				KeyVerificationWizardPage,
				{
					nextButtonLabel: () => "Mark as verified" /* TODO: translate */,
					disableNextButton: this.disableNextButton,
					beforeNextPageHook: async () => {
						await keyVerificationFacade.trust(mailAddress, fingerprint)
						await reloadParent()
						return true
					},
				},
				this.renderTextMethod(attrs),
			)
		} else if (method === KeyVerificationMethodType.qr) {
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

	private renderTextMethod(attrs: MethodExecutionPageAttrs): Children {
		const { keyVerificationFacade } = attrs.data

		return m(
			".pb",
			m("p", m("span", "This is some introduction text explaining how to use the ", m("span.b", "text method. "), "It can also be a few lines longer.")),
			m(TextField, {
				class: "mb",
				label: "mailAddress_label",
				value: attrs.data.mailAddress,
				type: TextFieldType.Email,
				oninput: async (newValue) => {
					console.log("text input, new value: ", newValue)
					attrs.data.mailAddress = newValue

					let invalidMailAddress = true

					if (this.validateMailAddress(attrs.data.mailAddress) == null) {
						try {
							attrs.data.fingerprint = assertNotNull(
								await keyVerificationFacade.getFingerprint(attrs.data.mailAddress, KeyVerificationSourceOfTruth.PublicKeyService),
							)
							invalidMailAddress = false
						} catch (e) {
							invalidMailAddress = true
						}
					}

					if (invalidMailAddress) {
						this.disableNextButton = true
						attrs.data.fingerprint = ""
					} else {
						this.disableNextButton = false
					}

					m.redraw()
				},
			}),
			m(MonospaceTextDisplay, {
				text: attrs.data.fingerprint,
				placeholder: "Email address not valid", // TODO: translate
				chunkSize: 4,
			}),
		)
	}

	private validateMailAddress(mailAddress: string): TranslationKey | null {
		/* TODO:
        Properly validate mail address. Only Tuta domains are reasonable for this problem space
        so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		return null // null means OK
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

	private getStateMessage(): String {
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
						attrs.data.fingerprint = payload.fingerprint

						//await attrs.data.keyVerificationFacade.addToPool(attrs.data.mailAddress, attrs.data.fingerprint)
						attrs.data.result = KeyVerificationResultType.QR_OK
					} catch (e) {
						if (e instanceof SyntaxError || e instanceof MalformedQrPayloadError) {
							// SyntaxError: JSON.parse failed
							// MalformedQrPayloadError: malformed payload
							// throw new UserError("keyManagement.invalidQrCode_msg")
							attrs.data.result = KeyVerificationResultType.QR_FAIL
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

	headerTitle(): string {
		if (this.data.method === KeyVerificationMethodType.text) {
			return "Text-based verification" // TODO: translate
		} else if (this.data.method === KeyVerificationMethodType.qr) {
			return "QR code-based verification" // TODO: translate
		} else {
			return "Key verification" // TODO: translate
		}
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}

	isEnabled(): boolean {
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}
}
