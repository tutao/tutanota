import Foundation

// iOS (13.3 at least) has a limit on saved alarms which was empirically inferred.
// It means that only *last* X alarms are stored in the internal plist by SpringBoard.
// If we schedule too many some alarms will not be fired. We should be careful to not
// schedule too far into the future.
let EVENTS_SCHEDULED_AHEAD = 14
let SYSTEM_ALARM_LIMIT = 64

private let TAG = "AlarmManager"
private func log(_ message: String) { TUTSLog("\(TAG) \(message)") }

/// Entry point for dealing with alarms
/// Receives alarm notifications and makes sure that the persisted state is correct and that alarms are scheduled with the system.
/// We can only schedule limited number of alarms ahead so they need to be periodically re-scheduled.
public class AlarmManager {
	private let alarmPersistor: any AlarmPersistor
	private let alarmCryptor: any AlarmCryptor
	private let alarmScheduler: any AlarmScheduler
	private let alarmCalculator: any AlarmCalculator

	public init(alarmPersistor: any AlarmPersistor, alarmCryptor: any AlarmCryptor, alarmScheduler: any AlarmScheduler, alarmCalculator: any AlarmCalculator) {
		self.alarmPersistor = alarmPersistor
		self.alarmCryptor = alarmCryptor
		self.alarmScheduler = alarmScheduler
		self.alarmCalculator = alarmCalculator
	}

	/// Process new alarms into the app. Will persist the changes and reschedule as appropriate
	public func processNewAlarms(_ alarms: [EncryptedAlarmNotification]) throws {
		log("processNewAlarms")
		// We will modify this list and the overwrite persisted alarms with what is inside this list
		var savedNotifications = self.alarmPersistor.alarms
		var resultError: Error?
		for alarmNotification in alarms {
			do { try self.handleAlarmNotification(alarmNotification, existingAlarms: &savedNotifications) } catch {
				log("Error while handling alarm \(error)")
				resultError = error
			}
		}

		log("Finished processing \(alarms.count) alarms")
		self.alarmPersistor.store(alarms: savedNotifications)

		self.rescheduleAlarms()
		log("Finished processNewAlarms")
		if let error = resultError { throw error }
	}

	/// Remove everything persisted and unschedule all alarms
	public func resetStoredState() {
		log("Resetting stored state")
		self.unscheduleAllAlarms(userId: nil)
		self.alarmPersistor.clear()
	}

	/// Take the alarms from the persistor and schedule the soonest occurrences
	public func rescheduleAlarms() {
		log("rescheduleAlarms")
		let decryptedAlarms = self.savedAlarms()
			.compactMap { encryptedAlarm in
				do { return try alarmCryptor.decrypt(alarm: encryptedAlarm) } catch {
					log("Error when decrypting alarm \(encryptedAlarm) \(error)")
					return nil
				}
			}
		let occurences = alarmCalculator.futureOccurrences(acrossAlarms: decryptedAlarms, upToForEach: EVENTS_SCHEDULED_AHEAD, upToOverall: SYSTEM_ALARM_LIMIT)

		// Reverse in order to schedule the soonest one the last. This add reliability if we still schedule more alarms than iOS can handle because it seeems
		// like it evicts the oldest ones from storage.
		for occurrence in occurences.reversed() {
			self.schedule(
				alarmOccurrence: occurrence,
				trigger: occurrence.alarm.alarmInfo.trigger,
				summary: occurrence.alarm.summary,
				alarmIdentifier: occurrence.alarm.alarmInfo.alarmIdentifer
			)
		}
		log("finished rescheduleAlarms")
	}

	private func savedAlarms() -> Set<EncryptedAlarmNotification> {
		let savedNotifications = self.alarmPersistor.alarms

		// de-duplicate alarms by their identifier
		let set = Set(savedNotifications)
		if set.count != savedNotifications.count {
			log("Duplicated alarms detected, re-saving...")
			self.alarmPersistor.store(alarms: Array(set))
		}

		return set
	}

	private func handleAlarmNotification(_ alarm: EncryptedAlarmNotification, existingAlarms: inout [EncryptedAlarmNotification]) throws {
		switch alarm.operation {
		case .Create:
			// When new alarm is received we just add it to the persistor and then we will reschedule all of them
			if !existingAlarms.contains(alarm) { existingAlarms.append(alarm) }
		case .Delete:
			// When alarm is deleted we need to unschedule all occurences right away, otherwise we will not
			// know about it anymore.
			// Delete notificaiton alarm might not have some details so we try to find a persisted one first
			let alarmToUnschedule = existingAlarms.first { $0 == alarm } ?? alarm
			do { try self.unschedule(alarm: alarmToUnschedule) } catch {
				log("Failed to cancel alarm \(alarm) \(error)")
				throw error
			}
			if let index = existingAlarms.firstIndex(of: alarmToUnschedule) { existingAlarms.remove(at: index) }
		default:
			// There are no updates for alarms
			fatalError("Unexpected operation for alarm: \(alarm.operation)")
		}
	}

	/// Unschedule all alarms associated with userId or all of them if userId is nil
	/// clears every unscheduled alarm from the persistent storage
	public func unscheduleAllAlarms(userId: String?) {
		let alarms = self.alarmPersistor.alarms
		var alarmsToKeep: [EncryptedAlarmNotification] = []
		for alarm in alarms {
			if userId != nil && userId != alarm.user {
				alarmsToKeep.append(alarm)
				continue
			}
			do { try self.unschedule(alarm: alarm) } catch { log("Error while unscheduling of all alarms \(error)") }
		}
		self.alarmPersistor.store(alarms: alarmsToKeep)
	}

	private func unschedule(alarm encAlarmNotification: EncryptedAlarmNotification) throws {
		let alarmNotification = try alarmCryptor.decrypt(alarm: encAlarmNotification)

		let occurrenceIds = prefix(alarmCalculator.futureOccurrences(ofAlarm: alarmNotification), EVENTS_SCHEDULED_AHEAD)
			.map { ocurrenceIdentifier(alarmIdentifier: $0.alarm.identifier, occurrence: $0.occurrenceNumber) }
		log("Cancelling alarm \(alarmNotification.identifier)")
		self.alarmScheduler.unscheduleAll(occurrenceIds: occurrenceIds)
	}

	private func schedule(alarmOccurrence: AlarmOccurence, trigger: AlarmInterval, summary: String, alarmIdentifier: String) {
		let alarmTime = AlarmModel.alarmTime(trigger: trigger, eventTime: alarmOccurrence.eventOccurrenceTime)

		let identifier = ocurrenceIdentifier(alarmIdentifier: alarmIdentifier, occurrence: alarmOccurrence.occurrenceNumber)

		let info = ScheduledAlarmInfo(
			alarmTime: alarmTime,
			occurrence: alarmOccurrence.occurrenceNumber,
			identifier: identifier,
			summary: summary,
			eventDate: alarmOccurrence.eventOccurrenceTime
		)

		self.alarmScheduler.schedule(info: info)
	}
}

// visible for testing
func ocurrenceIdentifier(alarmIdentifier: String, occurrence: Int) -> String { "\(alarmIdentifier)#\(occurrence)" }
