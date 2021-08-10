//
//  TUTAlarmManager.m
//  tutanota
//
//  Created by Tutao GmbH on 07.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTAlarmManager.h"
#import "Utils/TUTEncodingConverter.h"
#import "Utils/TUTErrorFactory.h"
#import "Utils/TUTUtils.h"
#import "Utils/TUTLog.h"
#import "Utils/AsyncBlockOperation.h"
#import "Keychain/TUTKeychainManager.h"
#import "Alarms/TUTMissedNotification.h"
#import "Alarms/TUTAlarmModel.h"
#import "Crypto/TUTAes128Facade.h"

#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

#import <UserNotifications/UserNotifications.h>

NSString *const TUTOperationCreate = @"0";
NSString *const TUTOperationUpdate = @"1";
NSString *const TUTOperationDelete = @"2";

// iOS (13.3 at least) has a limit on saved alarms which empirically inferred to be.
// It means that only *last* 64 alarms are stored in the internal plist by SpringBoard.
// If we schedule too many some alarms will not be fired. We should be careful to not
// schedule too far into the future.
//
// Better approach would be to calculate occurences from all alarms, sort them and take
// the first 64. Or schedule later ones first so that newer ones have higher priority.
static const int EVENTS_SCHEDULED_AHEAD = 24;
static const long MISSED_NOTIFICATION_TTL_SEC = 30L * 24 * 60 * 60; // 30 days

static const int OK_HTTP_CODE = 200;
static const int NOT_AUTHENTICATED_HTTP_CODE = 401;
static const int NOT_FOUND_HTTP_CODE = 404;
static const int TOO_MANY_REQUESTS_HTTP_CODE = 429;
static const int SERVICE_UNAVAILABLE_HTTP_CODE = 503;

@interface TUTAlarmManager ()
@property (nonnull, readonly) TUTKeychainManager *keychainManager;
@property (nonnull, readonly) TUTUserPreferenceFacade *userPreference;
@property (nonnull, readonly) NSOperationQueue *fetchQueue;
@end

@implementation TUTAlarmManager

- (instancetype) initWithUserPreferences:(TUTUserPreferenceFacade *) userPref{
    
    self = [super init];
    if (self) {
        _keychainManager = [TUTKeychainManager new];
        _userPreference = userPref;
        _fetchQueue = [NSOperationQueue new];
        // important: we don't want any concurrency for this queue
        _fetchQueue.maxConcurrentOperationCount = 1;
    }
    return self;
}

- (void)fetchMissedNotifications:(void(^)(NSError *_Nullable error))completionHandler {
    __weak TUTAlarmManager *weakSelf = self;
    
    // We use fetch queue to avoid race condition for cases when multiple notifications are received one after another
    [_fetchQueue addAsyncOperationWithBlock:^(dispatch_block_t  _Nonnull queueCompletionHandler) {
        __strong TUTAlarmManager *strongSelf = weakSelf;
        
        void (^complete)(NSError *_Nullable) = ^void(NSError *_Nullable error) {
            queueCompletionHandler();
            completionHandler(error);
        };
        if (!strongSelf) {
            TUTLog(@"Not fetching missed notifications, self is deallocated");
            complete(nil);
            return;
        }
        let sseInfo = strongSelf.userPreference.sseInfo;
        if (!sseInfo){
            TUTLog(@"No stored SSE info");
            complete(nil);
            return;
        }
        
        NSMutableDictionary<NSString *, NSString *> *additionalHeaders = [NSMutableDictionary new];
        [TUTUtils addSystemModelHeadersTo:additionalHeaders];
        if (sseInfo.userIds.count == 0) {
            TUTLog(@"No users to download missed notification with");
            [strongSelf unscheduleAllAlarmsForUserId:nil];
            queueCompletionHandler();
            complete(nil);
            return;
        }
        NSString *userId = sseInfo.userIds[0];
        additionalHeaders[@"userIds"] = userId;
        if (strongSelf.userPreference.lastProcessedNotificationId) {
            additionalHeaders[@"lastProcessedNotificationId"] = strongSelf.userPreference.lastProcessedNotificationId;
        }
        let configuration = NSURLSessionConfiguration.ephemeralSessionConfiguration;
        configuration.HTTPAdditionalHeaders = additionalHeaders;
        
        let urlSession = [NSURLSession sessionWithConfiguration:configuration];
        let urlString = [strongSelf missedNotificationUrl:sseInfo.sseOrigin pushIdentifier:sseInfo.pushIdentifier];

        TUTLog(@"Downloading missed notification with userId %@", userId);

        [[urlSession dataTaskWithURL:[NSURL URLWithString:urlString] completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
            let httpResponse = (NSHTTPURLResponse *) response;
            TUTLog(@"Fetched missed notifications with status code %zd, error: %@", httpResponse.statusCode, error);
            if (error) {
                complete(error);
            } else if (httpResponse.statusCode == NOT_AUTHENTICATED_HTTP_CODE) {
                TUTLog(@"Not authenticated to download missed notification w/ user %@", userId);
                // Not authenticated, remove user id and try again with the next one
                [strongSelf unscheduleAllAlarmsForUserId:userId];
                [strongSelf.userPreference removeUser:userId];
                queueCompletionHandler();
                [strongSelf fetchMissedNotifications:completionHandler];
            } else if (httpResponse.statusCode == SERVICE_UNAVAILABLE_HTTP_CODE ||
                       httpResponse.statusCode == TOO_MANY_REQUESTS_HTTP_CODE) {
              int suspensionTime = [strongSelf extractSuspensionTimeFrom:httpResponse];
              TUTLog(@"ServiceUnavailible when downloading missed notifications, waiting for %d s", suspensionTime);
              dispatch_after(dispatch_time(DISPATCH_TIME_NOW, suspensionTime * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                TUTLog(@"Timer fired");
                [weakSelf fetchMissedNotifications:completionHandler];
              });
              queueCompletionHandler();
            } else if (httpResponse.statusCode == NOT_FOUND_HTTP_CODE) {
                complete(nil);
            } else if (httpResponse.statusCode != OK_HTTP_CODE) {
                let error = [NSError errorWithDomain:TUT_NETWORK_ERROR
                                                code:httpResponse.statusCode
                                            userInfo:@{@"message": @"Failed to fetch missed notification"}
                             ];
                complete(error);
            } else {
                strongSelf.userPreference.lastMissedNotificationCheckTime = [NSDate new];
                NSError *jsonError;
                NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
                if (jsonError) {
                    TUTLog(@"Failed to parse response for the missed notification request %@", jsonError);
                    complete(jsonError);
                    return;
                }
                let missedNotification = [TUTMissedNotification fromJSON:json];
                strongSelf.userPreference.lastProcessedNotificationId =
                missedNotification.lastProcessedNotificationId;
                
              [strongSelf processNewAlarms:missedNotification.alarmNotifications completion:complete];

            }
        }] resume];
    }];
    
    
}

- (int)extractSuspensionTimeFrom:(NSHTTPURLResponse *)httpResponse {
  NSString *_Nullable retryAfterHeader = httpResponse.allHeaderFields[@"Retry-After"];
  if (retryAfterHeader == nil) {
    retryAfterHeader = httpResponse.allHeaderFields[@"Suspension-Time"];
  }
  int suspensionTime;
  if (retryAfterHeader != nil) {
    suspensionTime = retryAfterHeader.intValue;
  } else {
    suspensionTime = 0;
  }
  return suspensionTime;
}

- (BOOL)hasNotificationTTLExpired {
    let lastMissedNotificationCheckTime = _userPreference.lastMissedNotificationCheckTime;
    if (!lastMissedNotificationCheckTime) {
        return NO;
    }
    let sinceNow = lastMissedNotificationCheckTime.timeIntervalSinceNow;
    // Important: timeIntervalSinceNow is negative if it's in the past
    return sinceNow < 0 && fabs(sinceNow) > MISSED_NOTIFICATION_TTL_SEC;
}

-(void)resetStoredState {
    TUTLog(@"Resetting current state");
    [self unscheduleAllAlarmsForUserId:nil];
    [_userPreference clear];
    NSError *error;
    [_keychainManager removePushIdentifierKeys:&error];
    if (error) {
        TUTLog(@"Failed to remove pushIdentifier keys %@", error);
    }
}

-(void)unscheduleAllAlarmsForUserId:(NSString *_Nullable)userId {
    let alarms = [_userPreference alarms];
    foreach(alarm, alarms) {
        if (userId == nil || [alarm.user isEqualToString:userId]) {
            NSError *error;
            [self unscheduleAlarm:alarm error:&error];
            if (error) {
                TUTLog(@"Error duruing unscheduling of all alarms %@", error);
                error = nil;
            }
        }
    }
}

- (NSString *)stringToCustomId:(NSString *)string {
    var base64String = [TUTEncodingConverter bytesToBase64:[TUTEncodingConverter stringToBytes:string]];
    base64String = [base64String stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
    base64String = [base64String stringByReplacingOccurrencesOfString:@"/" withString:@"_"];
    base64String = [base64String stringByReplacingOccurrencesOfString:@"=" withString:@""];
    return base64String;
}

- (NSString *)missedNotificationUrl:(NSString *)origin pushIdentifier:(NSString *)pushIdentifier {
    let base64urlId = [self stringToCustomId:pushIdentifier];
    return [NSString stringWithFormat:@"%@/rest/sys/missednotification/%@", origin, base64urlId];
}

- (void)processNewAlarms:(NSArray<TUTAlarmNotification *> *)notifications completion:(void (^)(NSError * _Nullable))completion {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0), ^{
    NSError* error;
    let savedNotifications = [self.userPreference alarms];
    
    foreach(alarmNotification, notifications) {
      [self handleAlarmNotification:alarmNotification existingAlarms:savedNotifications error:&error];
      if (error) {
        TUTLog(@"error when handling alarm %@", error);
      }
    }
    
    NSLog(@"finished processing %lu alarms", (unsigned long)[notifications count]);
    // Store alarms in one go at the end, because JSON Serialization leaks memory
    [self.userPreference storeAlarms:savedNotifications];

    completion(error);
   });
  }

- (void) handleAlarmNotification:(TUTAlarmNotification*)alarm existingAlarms:(NSMutableArray<TUTAlarmNotification*> *)existingAlarms error:(NSError **)error {
    if ([TUTOperationCreate isEqualToString:alarm.operation] ) {
        [self scheduleAlarm:alarm error:error];
        if (!(*error)) {
          // Avoid duplicates. Alarms are immutable so we can just keep the old version.
          if ([existingAlarms indexOfObject:alarm] == NSNotFound) {
            [existingAlarms addObject:alarm];
          }
        }
    } else if ([TUTOperationDelete isEqualToString:alarm.operation]) {
        TUTAlarmNotification *alarmToUnschedule;
        let index = [existingAlarms indexOfObject:alarm];
        if (index != NSNotFound) {
            alarmToUnschedule = existingAlarms[index];
        } else {
            alarmToUnschedule = alarm;
        }
        [self unscheduleAlarm:alarmToUnschedule error:error];
        if (*error) {
            // don't cancel in case of error as we want to delete saved notifications
            TUTLog(@"Failed to cancel alarm %@ %@", alarm, *error);
        }
        [existingAlarms removeObject:alarm];
    }
}

- (void)scheduleAlarm:(TUTAlarmNotification *)alarmNotification error:(NSError **)error {
    let alarmIdentifier = alarmNotification.alarmInfo.alarmIdentifier;
    var sessionKey = [self resolveSessionKey:alarmNotification];
    if (!sessionKey){
        *error = [TUTErrorFactory createError:@"cannot resolve session key"];
        return;
    }
    let startDate = [alarmNotification getEventStartDec:sessionKey error:error];
    let endDate = [alarmNotification getEventEndDec:sessionKey error:error];
    let trigger = [alarmNotification.alarmInfo getTriggerDec:sessionKey error:error];
    let repeatRule = alarmNotification.repeatRule;
    let summary = [alarmNotification getSummaryDec:sessionKey error:error];
    
    if (*error) {
        return;
    }
    
    if (repeatRule) {
        [self iterateRepeatingAlarmtWithTime:startDate
                                    eventEnd:endDate
                                     trigger:trigger
                                  repeatRule:repeatRule
                                  sessionKey:sessionKey
                                       error:error
                                       block:^(NSDate *time, int occurrence, NSDate *occurrenceDate) {
                                           [self scheduleAlarmOccurrenceEventWithTime:occurrenceDate trigger:trigger summary:summary alarmIdentifier:alarmIdentifier occurrence:occurrence];
                                       }];
        if (*error) {
            let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
            let content = [UNMutableNotificationContent new];
            content.title =  [TUTUtils translate:@"TutaoCalendarAlarmTitle" default:@""];
            content.body = [TUTUtils translate:@"TutaoScheduleAlarmError" default:@"Could not set up an alarm. Please update the application."];
            content.sound = [UNNotificationSound defaultSound];
            let notificationRequest = [UNNotificationRequest requestWithIdentifier:@"parseError" content:content trigger:nil];
            TUTLog(@"Could not set up an alarm. %@", alarmNotification);
            [notificationCenter addNotificationRequest:notificationRequest withCompletionHandler:nil];
        }
    } else {
        [self scheduleAlarmOccurrenceEventWithTime:startDate
                                           trigger:trigger
                                           summary:summary
                                   alarmIdentifier:alarmIdentifier
                                        occurrence:0];
    }
}

- (void)unscheduleAlarm:(TUTAlarmNotification *)alarm error:(NSError **)error {
    let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
    let alarmIdentifier =   alarm.alarmInfo.alarmIdentifier;
    if (alarm.repeatRule) {
        var sessionKey = [self resolveSessionKey:alarm];
        if (!sessionKey) {
            *error = [TUTErrorFactory createError:@"cannot resolve session key"];
            return;
        }
        
        let startDate = [alarm getEventStartDec:sessionKey error:error];
        let endDate = [alarm getEventEndDec:sessionKey error:error];
        let trigger = [alarm.alarmInfo getTriggerDec:sessionKey error:error];
        if (*error) {
            TUTLog(@"Failed to decrypt alarm to unschedule");
            return;
        }
        let repeatRule = alarm.repeatRule;
        NSMutableArray *occurrences = [NSMutableArray new];
        [self iterateRepeatingAlarmtWithTime:startDate
                                    eventEnd:endDate
                                     trigger:trigger
                                  repeatRule:repeatRule
                                  sessionKey:sessionKey
                                       error:error
                                       block:^(NSDate *time, int occurrence, NSDate *occurrenceDate) {
                                           let occurrenceIdentifier = [self occurrenceIdentifier:alarmIdentifier occurrence:occurrence];
                                           [occurrences addObject:occurrenceIdentifier];
                                       }];
        [notificationCenter removePendingNotificationRequestsWithIdentifiers:occurrences];
        TUTLog(@"Cancelling a repeat notification %@", alarmIdentifier);
    } else {
        let occurrenceIdentifier = [self occurrenceIdentifier:alarmIdentifier occurrence:0];
        NSMutableArray *occurrences = [NSMutableArray new];
        [occurrences addObject:occurrenceIdentifier];
        [notificationCenter removePendingNotificationRequestsWithIdentifiers:occurrences];
        TUTLog(@"Cancelling a single notification %@", alarmIdentifier);
    }
}

-(NSData *_Nullable)resolveSessionKey:(TUTAlarmNotification *)alarmNotification {
    NSError *error;
    foreach(notificationSessionKey, alarmNotification.notificationSessionKeys) {
        error = nil;
        let pushIdentifierSessionSessionKey = [_keychainManager getKeyWithError:notificationSessionKey.pushIdentifier.elementId error:&error];
        if (!error && pushIdentifierSessionSessionKey) {
            var encSessionKey = [TUTEncodingConverter base64ToBytes:notificationSessionKey.pushIdentifierSessionEncSessionKey];
            var sessionKey = [TUTAes128Facade decryptKey:encSessionKey
                                       withEncryptionKey:pushIdentifierSessionSessionKey error:&error];
            if (error){
                TUTLog(@"Failed to decrypt key %@ %@", notificationSessionKey.pushIdentifier.elementId, error);
            }
            return sessionKey;
        }
    }
    TUTLog(@"Failed to resolve session key %@, last error: %@", alarmNotification.alarmInfo.alarmIdentifier, error);
    return nil;
}

-(void)iterateRepeatingAlarmtWithTime:(NSDate *)eventTime
                             eventEnd:(NSDate *)eventEnd
                              trigger:(NSString *)trigger
                           repeatRule:(TUTRepeatRule *)repeatRule
                           sessionKey:(NSData *)sessionKey
                                error:(NSError **)error
                                block:(void(^)(NSDate *time, int occurrence, NSDate *occurrenceDate))block {
    
    let cal = NSCalendar.currentCalendar;
    let timeZoneName = [repeatRule getTimezoneDec:sessionKey error:error];
    cal.timeZone = [NSTimeZone timeZoneWithName:timeZoneName];
    
    let frequency = [repeatRule getFrequencyDec:sessionKey error:error];
    let interval = [repeatRule getIntervalDec:sessionKey error:error];
    let endType = [repeatRule getEndTypeDec:sessionKey error:error];
    let endValue = [repeatRule getEndValueDec:sessionKey error:error];
    
    if (*error) {
        TUTLog(@"Could not decrypt repeating alarm %@", *error);
        return;
    }
    
    let now = [NSDate new];
    
    [TUTAlarmModel iterateRepeatingAlarmWithNow:now
                                        timeZone:timeZoneName
                                      eventStart:eventTime
                                       eventEnd:eventEnd
                                   repeatPerioud:frequency
                                        interval:interval
                                         endType:endType
                                        endValue:endValue
                                         trigger:trigger
                                  localTimeZone:NSTimeZone.localTimeZone
                                   scheduleAhead:EVENTS_SCHEDULED_AHEAD
                                           block:block];
}

-(void)scheduleAlarmOccurrenceEventWithTime:(NSDate *)eventTime
                                    trigger:(NSString *)trigger
                                    summary:(NSString *)summary
                            alarmIdentifier:(NSString *)alarmIdentifier
                                 occurrence:(int)occurrence {
    let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
    if (!summary) {
        summary = @"Calendar event";
    }
    let alarmTime = [TUTAlarmModel alarmTimeWithTrigger:trigger eventTime:eventTime];
    let fortNightSeconds = 60 * 60 * 24 * 14;
    if (alarmTime.timeIntervalSinceNow < 0) {
        TUTLog(@"Event alarm is in the past: %@ %@", alarmIdentifier, eventTime);
        return;
    }
    if (alarmTime.timeIntervalSinceNow > fortNightSeconds) {
        TUTLog(@"Event alarm is too far into the future: %@ %@", alarmIdentifier, eventTime);
        return;
    }
    
    let formattedTime = [NSDateFormatter localizedStringFromDate:eventTime dateStyle:NSDateFormatterShortStyle timeStyle:NSDateFormatterShortStyle];
    let notificationText = [NSString stringWithFormat:@"%@: %@", formattedTime, summary];
    
    unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute;
    
    let cal = [NSCalendar currentCalendar];
    let dateComponents = [cal components:unitFlags fromDate:alarmTime];
    
    let notificationTrigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:NO];
    
    let content = [UNMutableNotificationContent new];
    content.title =  [TUTUtils translate:@"TutaoCalendarAlarmTitle" default:@"Calendar reminder"];
    content.body = notificationText;
    content.sound = [UNNotificationSound defaultSound];
    
    // Create the request
    let identifier = [self occurrenceIdentifier:alarmIdentifier occurrence:occurrence];
    let request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:notificationTrigger];
    // Schedule the request with the system.
    TUTLog(@"Scheduling a notification %@ at: %@", identifier, [cal dateFromComponents:dateComponents]);
    [notificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
        if (error) {
            TUTLog(@"Failed to schedule a notification: %@", error);
        }
    }];
}



-(NSString *)occurrenceIdentifier:(NSString *)alarmIdentifier occurrence:(int)occurrence {
    return [NSString stringWithFormat:@"%@#%d", alarmIdentifier, occurrence];
}

-(void)rescheduleAlarms {
    TUTLog(@"Re-scheduling alarms");
    // This is not some work we wait for so we can push it to the lower priority queue.
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0), ^{
        foreach(notification, self.savedAlarms) {
            NSError *error;
            [self scheduleAlarm:notification error:&error];
            if (error) {
                TUTLog(@"Error when re-scheduling alarm %@ %@", notification, error);
            }
        }
    });
}

-(NSSet<TUTAlarmNotification *> *)savedAlarms {
  let savedNotifications = [self->_userPreference alarms];
  let set = [NSSet setWithArray:savedNotifications];
  if (set.count != savedNotifications.count) {
    TUTLog(@"Duplicated alarms detected, re-saving...");
    [self.userPreference storeAlarms:set.allObjects];
  }
  return set;
}

@end
