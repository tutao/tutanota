import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel } from "./MailViewerViewModel.js";

export class MobyPhishConfirmSenderModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;
    private selectedSender: string = ""; // Initialize as empty
    private trustedSenders: string[];
    // Optional: State for showing an error (if you prefer the warning approach)
    // private showError: boolean = false;

    constructor(viewModel: MailViewerViewModel, trustedSenders: string[]) {
        this.viewModel = viewModel;
        // Filter out any empty/null senders just in case
        this.trustedSenders = trustedSenders.filter(sender => sender && sender.trim());
    }

    view(): Children {
        const isConfirmDisabled = !this.selectedSender.trim(); // Check if input is empty or just whitespace

        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    m("p", {
                        style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" } // Added margin
                    }, "Who do you believe this email is from?"),

                    // Input field
                    m("input[type=text]", {
                        placeholder: "Search or type a known sender...",
                        value: this.selectedSender,
                        oninput: (e: Event) => {
                            this.selectedSender = (e.target as HTMLInputElement).value;
                            // Optional: If using the warning approach, clear error on input
                            // this.showError = false;
                        },
                        list: "trusted-senders-list",
                        style: {
                            padding: "10px",
                            width: "100%", // Ensure it takes full width within padding
                            boxSizing: "border-box", // Include padding in width calculation
                            borderRadius: "8px",
                            border: "1px solid #ccc"
                            // Optional: Style for error state if using the warning approach
                            // border: this.showError ? "1px solid red" : "1px solid #ccc"
                        },
                        // Add aria attributes for better accessibility
                        "aria-label": "Enter or select the trusted sender email",
                        "aria-autocomplete": "list",
                        "aria-controls": "trusted-senders-list",
                        required: true // Indicate it's required
                    }),
                    m("datalist#trusted-senders-list", this.trustedSenders.map(sender =>
                        m("option", { value: sender })
                    )),

                    // Optional: Error message (if using the warning approach)
                    /*
                    this.showError ? m(".error-message", {
                        style: { color: 'red', fontSize: '12px', marginTop: '5px', textAlign: 'left', width: '100%' }
                    }, "Please enter or select a sender name.") : null,
                    */

                    // Confirm Button (conditionally disabled)
                    m("button.btn", {
                        onclick: () => {
                            // Optional: Double check if using the warning approach
                            /*
                            if (isConfirmDisabled) {
                                this.showError = true;
                                return; // Stop execution
                            }
                            */
                            if (isConfirmDisabled) return; // Prevent action if disabled (belt and braces)

                            console.log(`User claims this email is from: ${this.selectedSender.trim()}`);
                            // TODO: Implement the logic to handle the confirmed sender
                            // Example: this.viewModel.handleSenderConfirmation(this.selectedSender.trim());
                            modal.remove(this.modalHandle!);
                            m.redraw(); // Ensure UI updates if necessary elsewhere
                        },
                        disabled: isConfirmDisabled, // Disable based on input state
                        style: this.getButtonStyle("#D4EDDA", "#C3E6CB", isConfirmDisabled) // Pass disabled state for styling
                    }, "Confirm"),

                    // Cancel Button
                    m("button.btn", {
                        onclick: () => modal.remove(this.modalHandle!),
                        style: this.getCancelButtonStyle()
                    }, "Cancel")
                ])
            ])
        ]);
    }

    // Modified style function to handle disabled state
    private getButtonStyle(defaultColor: string, hoverColor: string, disabled: boolean) {
        const baseStyle: { [key: string]: any } = { // Use a more specific type if possible, but any works for dynamic styles
            background: disabled ? "#cccccc" : defaultColor, // Grey background when disabled
            color: disabled ? "#666666" : "#000", // Darker text when disabled
            border: "none",
            padding: "15px",
            borderRadius: "8px",
            cursor: disabled ? "not-allowed" : "pointer", // Indicate non-interactive state
            width: "100%",
            fontSize: "16px",
            fontWeight: "bold",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease, opacity 0.2s ease", // Smooth transition
            opacity: disabled ? 0.6 : 1 // Dim button when disabled
        };

        if (!disabled) {
            baseStyle.onmouseover = (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor;
            baseStyle.onmouseout = (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor;
        }

        return baseStyle;
    }

    // Unchanged style function for Cancel button
    private getCancelButtonStyle() {
        return {
            background: "transparent",
            color: "#000", // Consider making this theme-aware if needed
            border: "1px solid #ccc", // Add subtle border to distinguish better
            padding: "15px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            fontSize: "16px",
            fontWeight: "normal", // Less emphasis than confirm
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "5px", // Add some space above cancel
            transition: "background-color 0.2s ease",
            onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.backgroundColor = "#f0f0f0", // Subtle hover
            onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.backgroundColor = "transparent"
        };
    }

    // Unchanged modal style function
    private getModalStyle() {
        return {
            position: "fixed", // Changed from absolute for better viewport centering
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "25px", // Slightly more padding
            textAlign: "center",
            background: "#fff", // Use theme variable if available: theme.dialog_bg
            boxShadow: "0px 5px 15px rgba(0,0,0,0.25)", // Softer shadow
            borderRadius: "10px",
            width: "90%", // Responsive width
            maxWidth: "380px", // Max width for larger screens
            display: "flex",
            flexDirection: "column",
            gap: "15px" // Increased gap between elements
        };
    }

    hideAnimation(): Promise<void> {
        // Add fade-out or other animations if desired
        return Promise.resolve();
    }

    onClose(): void {}

    backgroundClick(e: MouseEvent): void {
        modal.remove(this.modalHandle!);
    }

    popState(): boolean {
        modal.remove(this.modalHandle!);
        return false; // Prevents browser back navigation
    }

    callingElement(): HTMLElement | null {
        // If you want focus to return to the button that opened the modal,
        // you might need to pass that element to the constructor and return it here.
        return null;
    }

    shortcuts(): Shortcut[] {
        return [{
            key: Keys.ESC,
            exec: () => {
                modal.remove(this.modalHandle!);
                return true; // Indicate the shortcut was handled
            },
            help: "close_alt" // Tooltip or help text ID
        }];
    }

    setModalHandle(handle: ModalComponent) {
        this.modalHandle = handle;
    }
}