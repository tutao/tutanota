import { newPromise } from "@tutao/tutanota-utils/dist/Utils.js"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { locator } from "../../api/main/CommonLocator.js"
import { RegistrationCaptchaService } from "../../api/entities/sys/Services.js"
import { CaptchaChallenge, createRegistrationCaptchaServiceData } from "../../api/entities/sys/TypeRefs.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar.js"
import { Button, ButtonAttrs, ButtonType } from "../../gui/base/Button.js"
import m, { Children } from "mithril"
import { theme } from "../../gui/theme.js"
import { getColorLuminance, isMonochrome } from "../../gui/base/Color.js"
import { TextField } from "../../gui/base/TextField.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { uint8ArrayToBase64 } from "@tutao/tutanota-utils"

const enum CaptchaType {
	Visual,
	Audio,
}

export class CaptchaDialogViewModel {
	public currentInput: string = ""
	private selectedCaptcha: CaptchaType = CaptchaType.Visual
	private readonly audioBlobUrl: string
	private readonly imageData: string
	public readonly audioCaptchaDescription: string
	public readonly visualCaptchaDescription: string

	constructor(audioChallenge: CaptchaChallenge, visualChallenge: CaptchaChallenge) {
		this.imageData = `data:image/png;base64,${uint8ArrayToBase64(visualChallenge.challenge)}`
		const audioBlob = new Blob([audioChallenge.challenge], { type: "audio/wav" })
		this.audioBlobUrl = URL.createObjectURL(audioBlob)
		this.audioCaptchaDescription = audioChallenge.description
		this.visualCaptchaDescription = visualChallenge.description
	}

	getAudioUrl(): string {
		return this.audioBlobUrl
	}

	getVisualData(): string {
		return this.imageData
	}

	getSelectedCaptchaType(): CaptchaType {
		return this.selectedCaptcha
	}

	/**
	 * Accepts multiple formats for a time of day and always returns 12h-format with leading zeros.
	 * @returns {string} HH:MM if parsed, null otherwise
	 */
	getNormalizedInput(): string | null {
		if (this.currentInput.match(/^[0-2]?[0-9]:[0-5]?[0-9]$/)) {
			let [h, m] = this.currentInput
				.trim()
				.split(":")
				.map((t) => Number(t))

			// regex correctly matches 0-59 minutes, but matches hours 0-29, so we need to make sure hours is 0-24
			if (h > 24) {
				return null
			}

			return [h % 12, m].map((a) => String(a).padStart(2, "0")).join(":")
		} else {
			return null
		}
	}

	toggleCaptchaType() {
		this.currentInput = ""
		if (this.selectedCaptcha === CaptchaType.Audio) {
			this.selectedCaptcha = CaptchaType.Visual
		} else {
			this.selectedCaptcha = CaptchaType.Audio
		}
	}

	public revokeBlobUrl() {
		URL.revokeObjectURL(this.audioBlobUrl)
	}
}

export function showCaptchaDialog(audioChallenge: CaptchaChallenge, visualChallenge: CaptchaChallenge, token: string): Promise<string | null> {
	const viewModel = new CaptchaDialogViewModel(audioChallenge, visualChallenge)
	return newPromise<string | null>((resolve, reject) => {
		let dialog: Dialog

		const cancelAction = () => {
			dialog.close()
			viewModel.revokeBlobUrl()
			resolve(null)
		}

		const okAction = () => {
			let parsedInput = viewModel.getNormalizedInput()

			// User entered an incorrectly formatted time
			if (parsedInput == null) {
				Dialog.message("captchaInvalidInput_msg")
				return
			}

			dialog.close()
			viewModel.revokeBlobUrl()
			locator.serviceExecutor
				.post(
					RegistrationCaptchaService,
					createRegistrationCaptchaServiceData({
						token,
						visualChallengeResponse: viewModel.getSelectedCaptchaType() === CaptchaType.Visual ? parsedInput : null,
						audioChallengeResponse: viewModel.getSelectedCaptchaType() === CaptchaType.Audio ? parsedInput : null,
					}),
				)
				.then(() => {
					resolve(token)
				})
				.catch((e) => {
					reject(e)
				})
		}

		let actionBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: cancelAction,
					type: ButtonType.Secondary,
				},
			],
			right: [
				{
					label: "ok_action",
					click: okAction,
					type: ButtonType.Primary,
				},
			],
			middle: "captchaDisplay_label",
		}

		dialog = new Dialog(DialogType.EditSmall, {
			view: () => renderDialogContent(actionBarAttrs, viewModel),
		})
			.setCloseHandler(cancelAction)
			.show()
	})
}

function renderVisualCaptcha(viewModel: CaptchaDialogViewModel) {
	// The captcha is black-on-white, which will not look correct on anything where the background is not
	// white. We can use CSS filters to fix this.
	let captchaFilter = {}
	if (theme.elevated_bg != null && isMonochrome(theme.elevated_bg)) {
		captchaFilter = {
			filter: `invert(${1.0 - getColorLuminance(theme.elevated_bg)}`,
		}
	}

	return m(
		".flex-grow",

		[
			m("", viewModel.visualCaptchaDescription),
			m("img.pt-ml.center-h.block", {
				src: viewModel.getVisualData(),
				alt: lang.get("captchaDisplay_label"),
				style: captchaFilter,
			}),
		],
	)
}

function renderAudioCaptcha(viewModel: CaptchaDialogViewModel) {
	return m(".flex.col.flex-grow.gap-vpad-s", [
		m("", viewModel.audioCaptchaDescription),
		m(
			"div.full-width.flex.col.justify-center",
			m("audio.full-width", {
				controls: true,
				src: viewModel.getAudioUrl(),
			}),
		),
	])
}

function renderDialogContent(actionBarAttrs: DialogHeaderBarAttrs, viewModel: CaptchaDialogViewModel): Children {
	const toggleLabel =
		viewModel.getSelectedCaptchaType() === CaptchaType.Visual
			? lang.makeTranslation("tryAudioCaptcha_action", "Try an audio captcha")
			: lang.makeTranslation("tryVisualCaptcha_action", "Try a visual captcha")

	return [
		m(DialogHeaderBar, actionBarAttrs),
		m(
			".pt.plr-l.pb.flex.col.column-gap.justify-center",
			{
				style: { "min-height": "350px" },
			},
			[
				viewModel.getSelectedCaptchaType() === CaptchaType.Visual ? renderVisualCaptcha(viewModel) : renderAudioCaptcha(viewModel),
				m(TextField, {
					label: lang.makeTranslation("captcha_input", lang.get("captchaInput_label")),
					helpLabel: () => lang.get("captchaInputInfo_msg"),
					value: viewModel.currentInput,
					oninput: (value) => (viewModel.currentInput = value),
				}),
				m(Button, {
					label: toggleLabel,
					type: ButtonType.Secondary,
					click: (_) => viewModel.toggleCaptchaType(),
				} satisfies ButtonAttrs),
			],
		),
	]
}
