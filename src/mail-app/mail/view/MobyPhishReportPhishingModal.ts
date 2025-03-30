import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel } from "./MailViewerViewModel.js";
import { API_BASE_URL } from "./MailViewerViewModel.js";

export class MobyPhishReportPhishingModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;

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
                }, [
                    m("p", { style: { fontSize: "18px", fontWeight: "bold", textAlign: "center", color: "#D9534F" } }, 
                        "Warning: This sender is NOT in your trusted list."
                    ),
                    m("p", { style: { fontSize: "16px", textAlign: "center" } }, 
                        "Do you want to add this sender to your trusted list?"
                    ),

                    // "Report as Phishing" button
                    m("button.btn", {
                        onclick: async () => {
                            const senderEmail = this.viewModel.getSender().address;
                            const userEmail = this.viewModel.logins.getUserController().loginUsername;

                            try {
                                const response = await fetch(`${API_BASE_URL}/update-email-status`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        user_email: userEmail,
                                        email_id: this.viewModel.mail._id[1],
                                        sender_email: senderEmail,
                                        status: "reported_phishing",
                                        interaction_type: "interacted"
                                    }),
                                });

                                if (response.ok) {
                                    console.log(`Reported phishing attempt: ${senderEmail}`);
                                    await this.viewModel.fetchSenderData();
                                    if (this.modalHandle) {
                                        modal.remove(this.modalHandle);
                                    } else {
                                        console.warn("No modal handle set");
                                    }
                                    m.redraw();
                                } else {
                                    console.error("Failed to report phishing.");
                                }
                            } catch (error) {
                                console.error("Error reporting phishing:", error);
                            }
                        },
                        style: this.getButtonStyle("#D9534F", "#C9302C") // Red
                    }, "Report as Phishing"),

                    // "Confirm Anyway" button
                    m("button.btn", {
                        onclick: async () => {
                            const senderEmail = this.viewModel.getSender().address;
                            const userEmail = this.viewModel.logins.getUserController().loginUsername;

                            try {
                                // Step 1 – Add to trusted senders
                                const addResponse = await fetch(`${API_BASE_URL}/add-trusted`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        user_email: userEmail,
                                        trusted_email: senderEmail
                                    }),
                                });

                                if (!addResponse.ok) {
                                    console.error("Failed to add sender to trusted list.");
                                    return;
                                }

                                console.log(`Sender added to trusted list: ${senderEmail}`);

                                // Step 2 – Let viewModel handle status update, DOM re-render, etc.
                                await this.viewModel.updateSenderStatus("confirmed", "interacted");

                                // Step 3 – Close modal
                                if (this.modalHandle) {
                                    modal.remove(this.modalHandle);
                                } else {
                                    console.warn("No modal handle set");
                                }

                                m.redraw();
                            } catch (error) {
                                console.error("Error confirming and trusting sender:", error);
                            }
                        }
,
                        style: this.getButtonStyle("#5BC0DE", "#31B0D5") // Blue
                    }, "Add as Trusted Sender"),

                    // "Cancel" button
                    m("button.btn", {
                        onclick: () => {
                            if (this.modalHandle) {
                                modal.remove(this.modalHandle);
                            } else {
                                console.warn("No modal handle set");
                            }
                        },
                        style: this.getCancelButtonStyle()
                    }, "Cancel")
                ])
            ])
        ]);
    }

    /** Button styling */
    private getButtonStyle(defaultColor: string, hoverColor: string) {
        return {
            background: defaultColor,
            color: "#FFF",
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
        if (this.modalHandle) {
            modal.remove(this.modalHandle);
        } else {
            console.warn("No modal handle set");
        }

    }

    popState(e: Event): boolean {
        if (this.modalHandle) {
            modal.remove(this.modalHandle);
        } else {
            console.warn("No modal handle set");
        }
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
                    if (this.modalHandle) {
                        modal.remove(this.modalHandle);
                    } else {
                        console.warn("No modal handle set");
                    }
                    return true;
                },
                help: "close_alt",
            }
        ];
    }

    setModalHandle(handle: ModalComponent) {
        this.modalHandle = handle;
    }

}
