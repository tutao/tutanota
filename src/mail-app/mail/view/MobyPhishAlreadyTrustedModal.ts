// src/mail-app/mail/view/MobyPhishAlreadyTrustedModal.ts

import m, { Children } from "mithril"
import { Keys } from "../../../common/api/common/TutanotaConstants.js"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import type { Shortcut } from "../../../common/misc/KeyManager.js"
import { Icon } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"

// Inject CSS only once
const styleId = "moby-phish-hover-style"
if (!document.getElementById(styleId)) {
	const style = document.createElement("style")
	style.id = styleId
	style.textContent = `
        .mobyphish-btn {
            background: #850122;
            color: black;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s ease;
            margin-top: 10px;
            opacity: 1;
        }

        .mobyphish-btn:hover {
            opacity: 0.7;
        }
    `
	document.head.appendChild(style)
}

export class MobyPhishAlreadyTrustedModal implements ModalComponent {
	private modalHandle?: ModalComponent
	private viewModel: MailViewerViewModel

	constructor(viewModel: MailViewerViewModel) {
		this.viewModel = viewModel
	}

	view(): Children {
		return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
			m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
				m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
					// Message
					m(
						"p",
						{
							style: {
								fontSize: "14px",
								textAlign: "center",
								marginBottom: "20px",
								lineHeight: "1.5",
								color: "black",
							},
						},
						[
							"This sender is already on your trusted list.",
							m("br"),
							"Please use the ",
							m("strong", { style: { color: "black" } }, "Confirm"),
							" button (",
							m(Icon, {
								icon: Icons.Checkmark,
								style: { fill: "green", verticalAlign: "middle", height: "1em" },
							}),
							") in the banner to proceed with this email.",
						],
					),

					// OK Button
					m(
						"button.mobyphish-btn",
						{
							onclick: () => this.closeModal(),
							style: { color: "black" },
						},
						"OK",
					),
				]),
			]),
		])
	}

	private closeModal(): void {
		if (this.modalHandle) {
			modal.remove(this.modalHandle)
		}
	}

	private getModalStyle() {
		return {
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			padding: "25px",
			textAlign: "center",
			background: "#fff",
			boxShadow: "0px 5px 15px rgba(0,0,0,0.25)",
			borderRadius: "10px",
			width: "90%",
			maxWidth: "380px",
			display: "flex",
			flexDirection: "column",
			gap: "10px",
		}
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	onClose(): void {}

	backgroundClick(e: MouseEvent): void {
		this.closeModal()
	}

	popState(): boolean {
		this.closeModal()
		return false
	}

	callingElement(): HTMLElement | null {
		return null
	}

	shortcuts(): Shortcut[] {
		return [
			{
				key: Keys.ESC,
				exec: () => {
					this.closeModal()
					return true
				},
				help: "close_alt",
			},
		]
	}

	setModalHandle(handle: ModalComponent) {
		this.modalHandle = handle
	}
}
