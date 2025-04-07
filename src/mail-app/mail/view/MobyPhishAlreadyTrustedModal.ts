// src/mail-app/mail/view/MobyPhishAlreadyTrustedModal.ts

import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import { MailViewerViewModel } from "./MailViewerViewModel.js"; // May not be strictly needed but good practice

export class MobyPhishAlreadyTrustedModal implements ModalComponent {
    private modalHandle?: ModalComponent;
    private viewModel: MailViewerViewModel; // Keep viewModel reference if needed later

    constructor(viewModel: MailViewerViewModel) {
         this.viewModel = viewModel;
    }

    view(): Children {
        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    // Info Icon
                    m("p", { style: { textAlign: "center", marginBottom: "10px" } },
                      m(Icon, { icon: Icons.Info, style: { fill: '#17A2B8', width: '24px', height: '24px' } }) // Info Icon Style
                    ),
                    // Message
                    m("p", {
                        style: { fontSize: "14px", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" }
                    }, [
                        "This sender is already on your trusted list.",
                        m("br"),
                        "Please use the ", m("strong", "Confirm"), " button (", m(Icon, {icon: Icons.Checkmark, style: {fill: 'green', verticalAlign: 'middle', height: '1em'}}),") in the banner if you wish to proceed with this email."
                    ]),

                    // OK Button
                    m("button.btn", {
                        onclick: () => this.closeModal(),
                        // Use a neutral/info style
                        style: this.getButtonStyle("#17A2B8", "#138496") // Info color (adjust as needed)
                    }, "OK")
                ])
            ])
        ]);
    }

    private closeModal(): void {
        if (this.modalHandle) {
            modal.remove(this.modalHandle);
        }
    }

    // --- Styling and Lifecycle Methods (Copied & adjusted from reference) ---

    private getButtonStyle(defaultColor: string, hoverColor: string) {
         // Copied from MobyPhishConfirmSenderModal, adjusted color
        const baseStyle: { [key: string]: any } = {
            background: defaultColor,
            color: "#ffffff", // White text for info button
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
            marginTop: "10px"
        };
        baseStyle.onmouseover = (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor;
        baseStyle.onmouseout = (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor;
        return baseStyle;
    }

     private getModalStyle() {
         // Copied from MobyPhishConfirmSenderModal
         return {
             position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
             padding: "25px", textAlign: "center", background: "#fff",
             boxShadow: "0px 5px 15px rgba(0,0,0,0.25)", borderRadius: "10px",
             width: "90%", maxWidth: "380px", // Adjusted max-width slightly if needed
             display: "flex", flexDirection: "column", gap: "10px"
         };
     }

    hideAnimation(): Promise<void> { return Promise.resolve(); }
    onClose(): void {}
    backgroundClick(e: MouseEvent): void { this.closeModal(); }
    popState(): boolean { this.closeModal(); return false; }
    callingElement(): HTMLElement | null { return null; }
    shortcuts(): Shortcut[] { return [{ key: Keys.ESC, exec: () => { this.closeModal(); return true; }, help: "close_alt" }]; }
    setModalHandle(handle: ModalComponent) { this.modalHandle = handle; }
}