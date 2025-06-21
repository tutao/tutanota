# Email Deletion Monitoring

This document explains how to monitor email deletions in the Tutanota mail application.

## Components Overview

### 1. Email Deletion Components
The main components responsible for email deletion are:

- **`MailModel.deleteMails()`** (`src/mail-app/mail/model/MailModel.ts:349-380`)
  - Core method that handles email deletion logic
  - If emails are in trash/spam folders it permanently deletes them
  - Otherwise it moves them to trash folder

- **`promptAndDeleteMails()`** (`src/mail-app/mail/view/MailGuiUtils.ts:73-93`)
  - Shows confirmation dialog
  - Calls `MailModel.deleteMails()`
  - Handles errors and user feedback

- **UI Components that trigger deletion:**
  - `MailViewerToolbar.ts` the Delete button in mail viewer
  - `MobileMailActionBar.ts` the Mobile delete button
  - `MobileMailMultiselectionActionBar.ts` - Multi-select delete
  - `MailListView.ts` - Swipe-to-delete gesture

### 2. Monitoring System
The monitoring system consists of:

- **`email-deletion-monitor.ts`** - Core monitoring functionality
- **Integration in `MailModel.ts`** - Hooks into deletion methods

## How to Use the Monitoring

### 1. Start the Application
Run the application in development mode. The monitoring is automatically enabled for:
- `localhost`
- Domains containing "dev"

### 2. Monitor in Browser Console
Open browser developer tools (F12) and check the console. When emails are deleted, you'll see detailed logs like:

```
[EMAIL_DELETION_MONITOR] MOVE_TO_TRASH - 2024-01-15T10:30:45.123Z
  📧 Email count: 3
  📁 Source folder: Inbox
  📝 Subjects: ["Important Email", "Newsletter", "Meeting Reminder"]
  🆔 Email IDs: ["abc123", "def456", "ghi789"]
```

### 3. Access Monitoring Functions
In the browser console, you can access additional monitoring functions:

```javascript
// Get deletion history
emailDeletionMonitor.getHistory()

// Get deletion statistics
emailDeletionMonitor.getStats()

// Export deletion log as JSON
emailDeletionMonitor.exportLog()

// Clear the log
emailDeletionMonitor.clearLog()

// Enable/disable monitoring
emailDeletionMonitor.enable()
emailDeletionMonitor.disable()
```

### 4. Example Console Commands

```javascript
// View last 5 deletions
console.table(emailDeletionMonitor.getHistory().slice(-5))

// Count permanent vs trash deletions
const stats = emailDeletionMonitor.getStats()
console.log(`Total: ${stats.totalDeletions}, Permanent: ${stats.permanentDeletes}, Trash: ${stats.trashMoves}`)

// Export and save log
const logData = emailDeletionMonitor.exportLog()
console.log(logData) // Copy this to save to a file
```

## Deletion Event Structure

Each deletion event contains:

```typescript
interface DeletionEvent {
  timestamp: Date           // When the deletion occurred
  emailCount: number        // Number of emails deleted
  emailIds: string[]        // Array of email IDs
  emailSubjects: string[]   // Array of email subjects
  sourceFolder: string      // Folder emails were deleted from
  action: 'MOVE_TO_TRASH' | 'PERMANENT_DELETE'  // Type of deletion
  userAgent: string         // Browser information
}
```

## Monitoring Scenarios

### Scenario 1: Regular Email Deletion
1. Select emails in inbox
2. Click delete button
3. Monitor logs show `MOVE_TO_TRASH` action

### Scenario 2: Permanent Deletion
1. Go to trash folder
2. Select emails
3. Click delete button
4. Monitor logs show `PERMANENT_DELETE` action

### Scenario 3: Swipe to Delete (Mobile)
1. Swipe email in list view
2. Monitor logs show `MOVE_TO_TRASH` action

## Customization

To modify monitoring behavior, edit `src/mail-app/email-deletion-monitor.ts`:

- Change logging format in `logEmailDeletion()`
- Modify console exposure in `exposeToConsole()`
- Adjust log retention in constructor (currently 100 events)
- Add custom event handlers

## Troubleshooting

### No logs appearing?
- Check if monitoring is enabled: `emailDeletionMonitor.enable()`
- Verify you're in development environment
- Check browser console for errors

### Missing deletion events?
- Some deletions might bypass the main `deleteMails()` method
- Check other deletion methods like `clearFolder()` or `finallyDeleteCustomMailFolder()`

### Performance concerns?
- Monitor keeps only last 100 events
- Disable monitoring in production: `emailDeletionMonitor.disable()`

# Email Deletion and MobyPhish Button Logging

This document describes the console logging that has been added to track email deletion and MobyPhish button interactions in the mail view components.

## Email Deletion Logging

All email deletion logs use the prefix `📧 EMAIL_DELETION_LOG:` for easy filtering.

### Files Modified:

1. **src/mail-app/mail/view/MailGuiUtils.ts**
   - `showDeleteConfirmationDialog()`: Logs when delete confirmation dialog is shown, tracks which mails will be permanently deleted vs moved to trash
   - `promptAndDeleteMails()`: Logs the start of delete process, user confirmation/cancellation, success/failure of deletion

2. **src/mail-app/mail/view/MailViewerToolbar.ts**
   - `renderDeleteButton()`: Logs when delete button is clicked from the toolbar

3. **src/mail-app/mail/view/MobileMailActionBar.ts**
   - `deleteButton()`: Logs when delete button is clicked from mobile action bar

4. **src/mail-app/mail/view/MailView.ts**
   - Keyboard shortcuts (DELETE and BACKSPACE keys): Logs when these keys are pressed to delete emails
   - `deleteMails()`: Logs when the main delete function is called

### Log Format Examples:
```
📧 EMAIL_DELETION_LOG: Showing delete confirmation dialog for 3 mail(s)
📧 EMAIL_DELETION_LOG: Mail abc123 will be permanently deleted (final delete)
📧 EMAIL_DELETION_LOG: Mail xyz789 will be moved to trash
📧 EMAIL_DELETION_LOG: User confirmed deletion of 3 mail(s)
📧 EMAIL_DELETION_LOG: Successfully deleted 3 mail(s)
📧 EMAIL_DELETION_LOG: DELETE key pressed for 2 mail(s), mail IDs: abc123, xyz789
```

## MobyPhish Button Logging

All MobyPhish logs use the prefix `🔒 MOBYPHISH_LOG:` for easy filtering.

### Files Modified:

1. **src/mail-app/mail/view/MailViewerViewModel.ts**
   - `updateSenderStatus()`: Logs status changes (confirmed, trusted_once, reported_phishing, etc.)
   - `showPhishingModal()`: Logs when the phishing modal is opened
   - `resetSenderStatusForCurrentEmail()`: Logs when sender status is reset (untrust action)

2. **src/mail-app/mail/view/MailViewerHeader.ts**
   - Banner button actions: Logs clicks on Confirm, Add Sender, Trust Once, Remove, Learn More buttons
   - Untrust button: Logs when untrust button is clicked

3. **src/mail-app/mail/view/MobyPhishConfirmSenderModal.ts**
   - Initial view confirm button: Logs when user confirms sender identity
   - Warning view buttons: Logs "Report as Phishing" and "Add to Trusted List" button clicks
   - Email mismatch detection: Logs when entered email doesn't match actual sender

4. **src/mail-app/mail/view/MobyPhishAlreadyTrustedModal.ts**
   - OK button: Logs when user acknowledges that sender is already trusted

### Log Format Examples:
```
🔒 MOBYPHISH_LOG: updateSenderStatus called with status="confirmed" for sender="example@domain.com"
🔒 MOBYPHISH_LOG: Confirm button clicked for sender="example@domain.com", isTrusted=false, senderStatus=""
🔒 MOBYPHISH_LOG: "Report as Phishing" button clicked for sender="suspicious@example.com"
🔒 MOBYPHISH_LOG: Successfully added sender="trusted@example.com" to trusted list
🔒 MOBYPHISH_LOG: Untrust button clicked for sender="example@domain.com"
```

## Usage

To monitor these logs in the browser console:

1. **Email Deletion**: Filter console for `📧 EMAIL_DELETION_LOG`
2. **MobyPhish Interactions**: Filter console for `🔒 MOBYPHISH_LOG`
3. **All Monitoring**: Filter console for `_LOG:` to see both types

These logs will help track user behavior and identify potential issues with email deletion and sender trust functionality. 
