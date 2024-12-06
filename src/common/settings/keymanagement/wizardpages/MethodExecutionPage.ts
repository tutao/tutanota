import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../gui/base/WizardDialog"
import { KeyVerificationWizardData } from "../KeyVerificationWizard"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { KeyVerificationMethodType, KeyVerificationResultType } from "../../../api/common/TutanotaConstants"
import { TextField, TextFieldType } from "../../../gui/base/TextField"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel"
import jsQR from "jsqr"
import { KeyVerificationQrPayload } from "../KeyVerificationQrPayload"
import { MalformedQrPayloadError } from "../../../api/common/error/MalformedQrPayloadError"
import { LoginButton } from "../../../gui/base/buttons/LoginButton"
import { Dialog } from "../../../gui/base/Dialog"
import { getCleanedMailAddress } from "../../../misc/parsing/MailAddressParser"

export class MethodExecutionPage implements WizardPageN<KeyVerificationWizardData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<KeyVerificationWizardData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<KeyVerificationWizardData>>): Children {
		const attrs: MethodExecutionPageAttrs = vnode.attrs as MethodExecutionPageAttrs
		const verificationMethod = attrs.data.method

		if (verificationMethod === KeyVerificationMethodType.text) {
			return this.renderTextMethod(attrs)
		} else if (verificationMethod === KeyVerificationMethodType.qr) {
			return this.renderQrMethod(attrs)
		} else {
			return "This should not happen. Please report."
		}
	}

	private renderTextMethod(attrs: MethodExecutionPageAttrs): Children {
		return m(
			".pb",
			m("p", m("span", "This is some introduction text explaining how to use the ", m("span.b", "text method. "), "It can also be a few lines longer.")),
			m(TextField, {
				label: "mailAddress_label",
				value: attrs.data.mailAddress,
				type: TextFieldType.Email,
				oninput: (newValue) => (attrs.data.mailAddress = newValue),
			}),
			m(TextField, {
				class: "pb",
				label: "keyManagement.fingerprint_label",
				value: attrs.data.fingerprint,
				type: TextFieldType.Email,
				oninput: (newValue) => (attrs.data.fingerprint = newValue),
			}),
			m(LoginButton, {
				label: () => "Verify", // TODO: translate
				onclick: async () => {
					const validationError: TranslationKey | null = this.validateInputs(attrs.data)
					if (validationError) {
						await Dialog.message(validationError)
					} else {
						await attrs.data.keyVerificationFacade.addToPool(attrs.data.mailAddress, attrs.data.fingerprint)
						attrs.data.result = KeyVerificationResultType.SUCCESS
						emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
					}
				},
			}),
		)
	}

	private validateInputs(data: KeyVerificationWizardData): TranslationKey | null {
		/* TODO:
		Properly validate mail address. Only Tuta domains are reasonable for this problem space
		so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(data.mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		// validate fingerprint (syntactically): it's expected to be a 64-char hex digest
		const fingerprintRegex = /^[0-9a-f]{64}$/
		if (!fingerprintRegex.test(data.fingerprint)) {
			return "keyManagement.invalidFingerprint_msg"
		}

		return null // null means OK
	}

	private renderQrMethod(attrs: MethodExecutionPageAttrs): Children {
		const video = m("video", {
			oncreate: async (videoNode) => {
				attrs.qrVideo = assertNotNull(videoNode.dom as HTMLVideoElement)
				await this.runQrScanner(attrs)
			},
			style: { display: "block", "max-width": "100%" },
		})

		return [
			m(
				"p",
				m("span", "This is some introduction text explaining how to use the ", m("span.b", "QR code method. "), "It can also be a few lines longer."),
			),
			attrs.qrWaitingForVideo ? m(".center", lang.get("keyManagement.waitingForVideo_msg")) : m(""),
			m(".mt.mb.border-radius", { style: { overflow: "clip" } }, video),
		]
	}

	private async runQrScanner(attrs: MethodExecutionPageAttrs) {
		attrs.qrMediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
		const video = assertNotNull(attrs.qrVideo)

		video.srcObject = attrs.qrMediaStream
		await video.play()

		const canvas = document.createElement("canvas")
		const context2d = assertNotNull(canvas.getContext("2d", { willReadFrequently: true }))

		const thisScanner = Date.now()

		const runScannerTick = async () => {
			console.log("[scanner tick]", thisScanner)
			if (video.readyState === video.HAVE_ENOUGH_DATA) {
				if (attrs.qrWaitingForVideo) {
					attrs.qrWaitingForVideo = false
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

							await attrs.data.keyVerificationFacade.addToPool(attrs.data.mailAddress, attrs.data.fingerprint)
							attrs.data.result = KeyVerificationResultType.SUCCESS
						} catch (e) {
							if (e instanceof SyntaxError || e instanceof MalformedQrPayloadError) {
								// SyntaxError: JSON.parse failed
								// MalformedQrPayloadError: malformed payload
								// throw new UserError("keyManagement.invalidQrCode_msg")
								attrs.data.result = KeyVerificationResultType.FAIL_QR
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

			if (!attrs.qrStopScanning) {
				requestAnimationFrame(runScannerTick)
			}
		}

		requestAnimationFrame(runScannerTick)
	}
}

export class MethodExecutionPageAttrs implements WizardPageAttrs<KeyVerificationWizardData> {
	data: KeyVerificationWizardData

	qrVideo: HTMLVideoElement | null = null
	qrMediaStream: MediaStream | null = null
	qrWaitingForVideo: boolean = true
	qrStopScanning: boolean = false

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

	isEnabled(): boolean {
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}

	async loadAction(): Promise<boolean> {
		this.startup()
		return true
	}

	async unloadAction(): Promise<boolean> {
		this.cleanup()
		return true
	}

	private startup() {
		this.qrStopScanning = false
	}

	private cleanup() {
		this.qrStopScanning = true

		this.qrVideo?.pause()

		if (this.qrMediaStream != null) {
			for (const stream of this.qrMediaStream.getTracks()) {
				stream.stop()
			}
		}
	}
}
