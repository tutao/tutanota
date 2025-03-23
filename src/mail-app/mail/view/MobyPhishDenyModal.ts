import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel } from "./MailViewerViewModel";
import { API_BASE_URL } from "./MailViewerViewModel";

export class MobyPhishDenyModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private step: number = 1; // which step of the modal is being displayed

    constructor(viewModel: MailViewerViewModel) {
        this.viewModel = viewModel;
    }

    view(): Children {
        return m(".modal-overlay", {
            onclick: (e: MouseEvent) => this.backgroundClick(e)
        }, [
            m(".modal-content", {
                onclick: (e: MouseEvent) => e.stopPropagation()
            }, [
                m(".dialog.elevated-bg.border-radius", {
                    style: this.getModalStyle()
                }, this.step === 1 ? this.renderFirstStep() : this.renderSecondStep())
            ])
        ]);
    }

    /** Step 1: First modal screen */
    private renderFirstStep(): Children {
        return [
            m("button.btn", {
                onclick: () => {
                    this.step = 2; // Move to the second step
                    m.redraw(); // Redraw the modal with new content
                },
                style: this.getButtonStyle("#F8D7DA", "#F5C6CB")
            }, "This is Someone Else"),

            m("button.btn", {
                onclick: async (e: MouseEvent) => {
                    const senderEmail = this.viewModel.getSender().address;
                    const userEmail = this.viewModel.logins.getUserController().loginUsername;

                    try {
                        const response = await fetch(`${API_BASE_URL}/remove-trusted`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_email: userEmail, trusted_email: senderEmail }),
                        });

                        if (response.ok) {
                            console.log(`Removed sender: ${senderEmail}`);
                            await this.viewModel.fetchSenderData();
                            this.backgroundClick(e);
                            m.redraw();
                        } else {
                            console.error(`Failed to remove sender: ${senderEmail}`);
                        }
                    } catch (error) {
                        console.error("Error removing trusted sender:", error);
                    }
                },
                style: this.getButtonStyle("#F8D7DA", "#F5C6CB")
            }, "Remove from Trusted Senders"),

            m("button.btn", {
                onclick: (e: MouseEvent) => this.backgroundClick(e),
                style: this.getCancelButtonStyle()
            }, "Cancel")
        ];
    }

    /** Step 2: Confirmation modal */
    private renderSecondStep(): Children {
        return [
            m("p", { style: { fontSize: "18px", fontWeight: "bold", textAlign: "center" } }, 
                "Do you want to add this person as a known sender?"
            ),

            m("button.btn", {
                onclick: async (e: MouseEvent) => {
                    const senderEmail = this.viewModel.getSender().address;
                    const userEmail = this.viewModel.logins.getUserController().loginUsername;

                    try {
                        const response = await fetch(`${API_BASE_URL}/add-trusted`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_email: userEmail, trusted_email: senderEmail }),
                        });

                        if (response.ok) {
                            console.log(`Added sender: ${senderEmail}`);
                            await this.viewModel.updateSenderStatus("added_to_trusted", "interacted");
                            await this.viewModel.fetchSenderData();
                            this.backgroundClick(e);
                            m.redraw();
                        } else {
                            console.error(`Failed to add sender: ${senderEmail}`);
                        }
                    } catch (error) {
                        console.error("Error adding trusted sender:", error);
                    }
                },
                style: this.getButtonStyle("#D4EDDA", "#C3E6CB")
            }, "Add"),

            m("button.btn", {
                onclick: async (e: MouseEvent) => {
                    const senderEmail = this.viewModel.getSender().address;
                    await this.viewModel.updateSenderStatus("denied", "interacted");
                    console.log(`Sender denied: ${senderEmail}`);
                    this.backgroundClick(e);
                    m.redraw();
                },
                style: this.getCancelButtonStyle()
            }, "Continue without adding")
        ];
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
            onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor,
            onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor
        };
    }

    /** Cancel button styling */
    private getCancelButtonStyle() {
        return {
            background: "transparent",
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
            justifyContent: "center"
        };
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
            gap: "10px"
        };
    }

    hideAnimation(): Promise<void> {
        return Promise.resolve();
    }

    onClose(): void {}

    backgroundClick(e: MouseEvent): void {
        console.log("Background clicked, closing modal...");
        modal.remove(this);
    }

    popState(e: Event): boolean {
        modal.remove(this);
        return false;
    }

    callingElement(): HTMLElement | null {
        return null;
    }

    shortcuts(): Shortcut[] {
        return [
            {
                key: Keys.ESC, 
                exec: () => {
                    modal.remove(this);
                    return true;
                },
                help: "close_alt",
            }
        ];
    }
}
