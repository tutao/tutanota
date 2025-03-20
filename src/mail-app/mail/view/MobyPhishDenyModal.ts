import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel } from "./MailViewerViewModel";
import { API_BASE_URL } from "./MailViewerViewModel";

export class MobyPhishDenyModal implements ModalComponent {
    private viewModel: MailViewerViewModel;

    constructor(viewModel: MailViewerViewModel) {
        this.viewModel = viewModel;
    }

    view(): Children {
        return m(".modal-overlay", {
            onclick: (e: MouseEvent) => this.backgroundClick(e) // Handle background click properly
        }, [
            m(".modal-content", {
                onclick: (e: MouseEvent) => e.stopPropagation() // Prevent modal from closing when clicking inside it
            }, [
                m(".dialog.elevated-bg.border-radius", {
                    style: {
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: "20px",
                        textAlign: "center",
                        background: "#fff", // Ensure modal is visible
                        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)", // Subtle shadow
                        borderRadius: "10px",
                        width: "320px", // Fixed width for better appearance
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px" // Adds spacing between buttons
                    }
                }, [
                    // "This is someone else" button
                    m("button.btn", {
                        onclick: () => console.log("This is someone else clicked"),
                        style: this.getButtonStyle("#F8D7DA", "#F5C6CB")
                    }, "This is Someone Else"),

                    // "Remove from Trusted Senders" button
                    m("button.btn", {
                        onclick: async () => {
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
                                    modal.remove(this); 
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

                    // Cancel button
                    m("button.btn", {
                        onclick: () => modal.remove(this),
                        style: {
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
                        }
                    }, "Cancel")
                ])
            ])
        ]);
    }

    // Reusable button styling function
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
