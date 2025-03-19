import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";

export class MobyPhishDenyModal implements ModalComponent {
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
                    m("button.btn", {
                        onclick: () => console.log("This is someone else clicked"),
                        style: {
                            background: "#F8D7DA", // Soft red
                            color: "#000",
                            border: "none",
                            padding: "15px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "100%", // Full-width buttons
                            fontSize: "16px",
                            fontWeight: "bold",
                        },
                        onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.background = "#F5C6CB",
                        onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.background = "#F8D7DA"
                    }, "This is Someone Else"),

                    m("button.btn", {
                        onclick: () => console.log("Remove from Trusted Senders clicked"),
                        style: {
                            background: "#F8D7DA", // Soft red
                            color: "#000",
                            border: "none",
                            padding: "15px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "100%", // Full-width buttons
                            fontSize: "16px",
                            fontWeight: "bold",
                        },
                        onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.background = "#F5C6CB",
                        onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.background = "#F8D7DA"
                    }, "Remove from Trusted Senders"),

                    m("button.btn", {
                        onclick: () => modal.remove(this),
                        style: {
                            background: "transparent",
                            color: "#000",
                            border: "none",
                            padding: "15px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "100%", // Full-width buttons
                            fontSize: "16px",
                            fontWeight: "bold",
                        }
                    }, "Cancel")
                ])
            ])
        ]);
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
