//
//  AlarmOccurrence.swift
//  tutanota
//
//  Created by Tutao GmbH on 10.03.20.
//  Copyright © 2020 Tutao GmbH. All rights reserved.
//

import Foundation

@objcMembers internal class AlarmOccurrence : NSObject {
    public let identifier: String
    public let occurrence: Int32
    public let alarmTime: Date
    public let eventStart: Date
    public let summary: String
    
    internal init(identifier: String, occurrence: Int32, alarmTime: Date, eventStart: Date, summary: String) {
        self.identifier = identifier
        self.occurrence = occurrence
        self.alarmTime = alarmTime
        self.eventStart = eventStart
        self.summary = summary
    }
}
