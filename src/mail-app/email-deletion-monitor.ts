/**
 * Email Deletion Monitor - A utility to track when emails are deleted
 *
 * Usage:
 * 1. Import this file in MailModel.ts
 * 2. Call logEmailDeletion() in the deleteMails method
 * 3. Check browser console for deletion logs
 */

import type { Mail, MailFolder } from "../common/api/entities/tutanota/TypeRefs.js"

export interface DeletionEvent {
	timestamp: Date
	emailCount: number
	emailIds: string[]
	emailSubjects: string[]
	sourceFolder: string | null
	action: "MOVE_TO_TRASH" | "PERMANENT_DELETE"
	userAgent: string
}

class EmailDeletionMonitor {
	private deletionLog: DeletionEvent[] = []
	private isEnabled: boolean = true

	constructor() {
		// Enable monitoring by default in development
		this.isEnabled = window.location.hostname === "localhost" || window.location.hostname.includes("dev")

		if (this.isEnabled) {
			console.log("[EMAIL_DELETION_MONITOR] Monitoring enabled")
		}
	}

	logEmailDeletion(mails: ReadonlyArray<Mail>, sourceFolder: MailFolder | null, action: "MOVE_TO_TRASH" | "PERMANENT_DELETE"): void {
		if (!this.isEnabled) return

		const event: DeletionEvent = {
			timestamp: new Date(),
			emailCount: mails.length,
			emailIds: mails.map((m) => m._id?.[1] || "unknown"),
			emailSubjects: mails.map((m) => m.subject || "No Subject"),
			sourceFolder: sourceFolder?.name || null,
			action,
			userAgent: navigator.userAgent,
		}

		this.deletionLog.push(event)

		// Console logging with clear formatting
		console.group(`[EMAIL_DELETION_MONITOR] ${action} - ${event.timestamp.toISOString()}`)
		console.log("📧 Email count:", event.emailCount)
		console.log("📁 Source folder:", event.sourceFolder)
		console.log("📝 Subjects:", event.emailSubjects)
		console.log("🆔 Email IDs:", event.emailIds)
		console.groupEnd()

		// Keep only last 100 deletion events to prevent memory issues
		if (this.deletionLog.length > 100) {
			this.deletionLog = this.deletionLog.slice(-100)
		}
	}

	getDeletionHistory(): DeletionEvent[] {
		return [...this.deletionLog]
	}

	exportDeletionLog(): string {
		return JSON.stringify(this.deletionLog, null, 2)
	}

	clearLog(): void {
		this.deletionLog = []
		console.log("[EMAIL_DELETION_MONITOR] Log cleared")
	}

	enable(): void {
		this.isEnabled = true
		console.log("[EMAIL_DELETION_MONITOR] Monitoring enabled")
	}

	disable(): void {
		this.isEnabled = false
		console.log("[EMAIL_DELETION_MONITOR] Monitoring disabled")
	}

	// Expose monitoring functions to global scope for easy access from browser console
	exposeToConsole(): void {
		if (typeof window !== "undefined") {
			;(window as any).emailDeletionMonitor = {
				getHistory: () => this.getDeletionHistory(),
				exportLog: () => this.exportDeletionLog(),
				clearLog: () => this.clearLog(),
				enable: () => this.enable(),
				disable: () => this.disable(),
				getStats: () => {
					const log = this.getDeletionHistory()
					return {
						totalDeletions: log.length,
						permanentDeletes: log.filter((e) => e.action === "PERMANENT_DELETE").length,
						trashMoves: log.filter((e) => e.action === "MOVE_TO_TRASH").length,
						lastDeletion: log[log.length - 1]?.timestamp || null,
					}
				},
			}
		}
	}
}

// Export singleton instance
export const emailDeletionMonitor = new EmailDeletionMonitor()

// Automatically expose to console in development
if (typeof window !== "undefined") {
	emailDeletionMonitor.exposeToConsole()
}
