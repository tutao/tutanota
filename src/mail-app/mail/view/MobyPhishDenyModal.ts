import m, { Children } from "mithril"
import { Keys } from "../../../common/api/common/TutanotaConstants.js"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import type { Shortcut } from "../../../common/misc/KeyManager.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { TRUSTED_SENDERS_API_URL } from "./MailViewerViewModel.js"

export class MobyPhishDenyModal implements ModalComponent {
	private viewModel: MailViewerViewModel
	private step: number = 1
	private modalHandle?: ModalComponent

	constructor(viewModel: MailViewerViewModel) {
		this.viewModel = viewModel
	}

	view(): Children {
		return m(
			".modal-overlay",
			{
				onclick: (e: MouseEvent) => this.backgroundClick(e),
			},
			[
				m(
					".modal-content",
					{
						onclick: (e: MouseEvent) => e.stopPropagation(),
					},
					[
						m(
							".dialog.elevated-bg.border-radius",
							{
								style: this.getModalStyle(),
							},
							this.step === 1 ? this.renderFirstStep() : this.renderSecondStep(),
						),
					],
				),
			],
		)
	}

	/** Step 1: First modal screen */
	private renderFirstStep(): Children {
		return [
			m(
				"button.btn",
				{
					onclick: () => {
						this.step = 2 // Move to the second step
						m.redraw() // Redraw the modal with new content
					},
					style: { ...this.getButtonStyle("#F8D7DA", "#F5C6CB"), color: "black" },
				},
				"This is Someone Else",
			),

			m(
				"button.btn",
				{
					onclick: async () => {
						const senderEmail = this.viewModel.getSender().address
						const userEmail = this.viewModel.logins.getUserController().loginUsername

						try {
							const response = await fetch(`${TRUSTED_SENDERS_API_URL}/remove-trusted`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ user_email: userEmail, trusted_email: senderEmail }),
							})

							if (response.ok) {
								console.log(`Removed sender: ${senderEmail}`)
								await this.viewModel.fetchSenderData()
								if (this.modalHandle) {
									modal.remove(this.modalHandle)
								} else {
									console.warn("No modal handle set")
								}
								m.redraw()
							} else {
								console.error(`Failed to remove sender: ${senderEmail}`)
							}
						} catch (error) {
							console.error("Error removing trusted sender:", error)
						}
					},
					style: { ...this.getButtonStyle("#F8D7DA", "#F5C6CB"), color: "black" },
				},
				"Remove from Trusted Senders",
			),

			m(
				"button.btn",
				{
					onclick: () => {
						if (this.modalHandle) {
							modal.remove(this.modalHandle)
						} else {
							console.warn("No modal handle set")
						}
					},
					style: { ...this.getCancelButtonStyle(), color: "black" },
				},
				"Cancel",
			),
		]
	}

	/** Step 2: Confirmation modal */
	private renderSecondStep(): Children {
		return [
			m(
				"p",
				{ style: { fontSize: "18px", fontWeight: "bold", textAlign: "center", color: "black" } },
				"Do you want to add this person as a known sender?",
			),
			m(
				"button.btn",
				{
					onclick: async () => {
						const senderEmail = this.viewModel.getSender().address
						const userEmail = this.viewModel.logins.getUserController().loginUsername
						try {
							const response = await fetch(`${TRUSTED_SENDERS_API_URL}/add-trusted`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ user_email: userEmail, trusted_email: senderEmail }),
							})
							if (response.ok) {
								console.log(`Added sender: ${senderEmail}`)
								await this.viewModel.updateSenderStatus("added_to_trusted")
								await this.viewModel.fetchSenderData()
								if (this.modalHandle) {
									modal.remove(this.modalHandle)
								} else {
									console.warn("No modal handle set")
								}
								m.redraw()
							} else {
								console.error(`Failed to add sender: ${senderEmail}`)
							}
						} catch (error) {
							console.error("Error adding trusted sender:", error)
						}
					},
					style: { ...this.getButtonStyle("#D4EDDA", "#C3E6CB"), color: "black" },
				},
				"Add",
			),
			m(
				"button.btn",
				{
					onclick: async () => {
						const senderEmail = this.viewModel.getSender().address
						await this.viewModel.updateSenderStatus("denied")
						console.log(`Sender denied: ${senderEmail}`)
						if (this.modalHandle) {
							modal.remove(this.modalHandle)
						} else {
							console.warn("No modal handle set")
						}
						m.redraw()
					},
					style: { ...this.getCancelButtonStyle(), color: "black" },
				},
				"Continue without adding",
			),
		]
	}

	/** Reusable button styling */
	private getButtonStyle(defaultColor: string, hoverColor: string) {
		return {
			background: defaultColor,
			color: "#000",
			border: "none",
			padding: "15px",
			borderRadius: "8px",
			cursor: "pointer",
			width: "100%",
			fontSize: "16px",
			fontWeight: "bold",
			textAlign: "center",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			onmouseover: (e: MouseEvent) => ((e.target as HTMLElement).style.background = hoverColor),
			onmouseout: (e: MouseEvent) => ((e.target as HTMLElement).style.background = defaultColor),
		}
	}

	/** Cancel button styling */
	private getCancelButtonStyle() {
		return {
			background: "transparent",
			color: "black",
			border: "none",
			padding: "15px",
			borderRadius: "8px",
			cursor: "pointer",
			width: "100%",
			fontSize: "16px",
			fontWeight: "bold",
			textAlign: "center",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		}
	}

	/** Modal styling */
	private getModalStyle() {
		return {
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			padding: "20px",
			textAlign: "center",
			background: "#fff",
			boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
			borderRadius: "10px",
			width: "320px",
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
		console.log("Background clicked, closing modal...")
		if (this.modalHandle) {
			modal.remove(this.modalHandle)
		} else {
			console.warn("No modal handle set")
		}
	}

	popState(e: Event): boolean {
		if (this.modalHandle) {
			modal.remove(this.modalHandle)
		} else {
			console.warn("No modal handle set")
		}
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
					if (this.modalHandle) {
						modal.remove(this.modalHandle)
					} else {
						console.warn("No modal handle set")
					}
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
