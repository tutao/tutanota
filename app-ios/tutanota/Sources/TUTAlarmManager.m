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
#import "Keychain/TUTKeychainManager.h"
#import  "Alarms/TUTMissedNotification.h"
#import "Crypto/TUTAes128Facade.h"
#import "Keychain/TUTKeychainManager.h"


#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

#import <UserNotifications/UserNotifications.h>

NSString *const TUTOperationCreate = @"0";
NSString *const TUTOperationUpdate = @"1";
NSString *const TUTOperationDelete = @"2";

typedef NS_ENUM(NSInteger, TUTRepeatPeriod) {
    TUTRepeatPeriodDaily,
    TUTRepeatPeriodWeekly,
    TUTRepeatPeriodMonthly,
    TUTRepeatPeriodAnnually
};

typedef NS_ENUM(NSInteger, TUTRepeatEndType) {
    TUTRepeatEndTypeNever,
    TUTRepeatEndTypeCount,
    TUTRepeatEndTypeUntilDate
};

static const int EVENTS_SCHEDULED_AHEAD = 100;

@interface TUTAlarmManager ()
@property (nonnull, readonly) TUTKeychainManager *keychainManager;
@end

@implementation TUTAlarmManager

- (instancetype)init
{
    self = [super init];
    if (self) {
        _keychainManager = [TUTKeychainManager new];
    }
    return self;
}


- (void)scheduleAlarms:(TUTMissedNotification*) notificaiton completionsHandler:(void(^)(void))completionHandler {
    dispatch_group_t group = dispatch_group_create();
    
    foreach(alarmNotification, notificaiton.alarmNotifications) {
        dispatch_group_enter(group);
        [self scheduleLocalAlarm:alarmNotification handler: ^(NSError * _Nullable error) {
            if (error) {
                NSLog(@"schedule error %@", error);
                completionHandler();
            } else {
                NSLog(@"schedule success");
                
            }
            dispatch_group_leave(group);
        }];
    }
    
    dispatch_group_notify(group, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),^{
        completionHandler();
    });
}

- (void)sendConfirmationForIdentifier:(NSString *)identifier
                       confirmationId:(NSString *)confirmationId
                               origin:(NSString *)origin
                    completionHandler:(void (^)(void))completionHandler {
    let configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];
    configuration.HTTPAdditionalHeaders = @{
                                            @"confirmationId": confirmationId
                                            };
    let session = [NSURLSession sessionWithConfiguration:configuration];
    let urlString = [self missedNotificationUrl:origin pushIdentifier:identifier];
    
    let request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:urlString]];
    request.HTTPMethod = @"DELETE";
    
    [[session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if (error) {
            NSLog(@"Notification confirmation failed: %@", error);
            completionHandler();
            return;
        }
        NSLog(@"sent confirmation with status code %zd", ((NSHTTPURLResponse *) response).statusCode);
        completionHandler();
    }] resume];
}

- (void)fetchMissedNotificationsForSSEInfo:(TUTSseInfo *)sseInfo
                         completionHandler:(void(^)(void))completionHandler {
    let additionalHeaders = @{
                              @"userIds": [sseInfo.userIds componentsJoinedByString:@","]
                              };
    
    let configuration = NSURLSessionConfiguration.ephemeralSessionConfiguration;
    configuration.HTTPAdditionalHeaders = additionalHeaders;
    
    let urlSession = [NSURLSession sessionWithConfiguration:configuration];
    let urlString = [self missedNotificationUrl:sseInfo.sseOrigin pushIdentifier:sseInfo.pushIdentifier];
    
    [[urlSession dataTaskWithURL:[NSURL URLWithString:urlString] completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        let httpResponse = (NSHTTPURLResponse *) response;
        NSLog(@"Fetched missed notifications with status code %zd, error: %@", httpResponse.statusCode, error);
        if (error || httpResponse.statusCode != 200) {
            completionHandler();
        } else {
            NSError *jsonError;
            NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
            if (jsonError) {
                NSLog(@"Failed to parse response for the missed notification request %@", jsonError);
                return;
            }
            let missedNotification = [TUTMissedNotification fromJSON:json];
            [self scheduleAlarms:missedNotification completionsHandler:^{
                [self sendConfirmationForIdentifier:sseInfo.pushIdentifier confirmationId:missedNotification.confirmationId origin:sseInfo.sseOrigin completionHandler:^{
                    completionHandler();
                }];
            }];
        }
    }] resume];
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
    return [NSString stringWithFormat:@"%@/rest/sys/missednotification/A/%@", origin, base64urlId];
}

- (void) scheduleLocalAlarm:(TUTAlarmNotification*)alarmNotification handler:(nullable void(^)(NSError *__nullable error))completionHandler {
    var sessionKey = [self resolveSessionKey:alarmNotification];
    if (!sessionKey){
        completionHandler([TUTErrorFactory createError:@"cannot resolve session key"]);
        return;
    }
    
    NSError *error;
    let alarmIdentifier = [alarmNotification.alarmInfo getAlarmIdentifierDec:sessionKey error:&error];
    if (error) {
        completionHandler(error);
        return;
    }
    
    if ([TUTOperationCreate isEqualToString:alarmNotification.operation] ) {
        NSError *error;
        let startDate = [alarmNotification getEventStartDec:sessionKey error:&error];
        let trigger = [alarmNotification.alarmInfo getTriggerDec:sessionKey error:&error];
        let repeatRule = alarmNotification.repeatRule;
        let summary = [alarmNotification getSummaryDec:sessionKey error:&error];
        
        if (repeatRule) {
            [self scheduleRepeatingAlarmEventWithTime:startDate
                                              trigger:trigger
                                              summary:summary
                                      alarmIdentifier:alarmIdentifier
                                           repeatRule:repeatRule
                                           sessionKey:sessionKey];
        } else {
            [self scheduleAlarmOccurrenceEventWithTime:startDate
                                               trigger:trigger
                                               summary:summary
                                       alarmIdentifier:alarmIdentifier
                                            occurrence:0];
        }
        completionHandler(nil);
    } else if ([TUTOperationDelete isEqualToString:alarmNotification.operation]) {
        let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
        NSMutableArray<NSString *> *identifiers = [[NSMutableArray alloc] initWithCapacity:EVENTS_SCHEDULED_AHEAD];
        for (int i = 0; i < EVENTS_SCHEDULED_AHEAD; i++) {
            let identifier = [self occurrenceIdentifier:alarmIdentifier occurrence:i];
            [identifiers addObject: identifier];
        }
        NSLog(@"Cancelling a notification %@", alarmIdentifier);
        [notificationCenter removePendingNotificationRequestsWithIdentifiers:identifiers];
        completionHandler(nil);
    }
}

- (NSDate *)getAlarmTimeWithTrigger:(NSString*)alarmTrigger eventTime:(NSDate *)eventTime {
    let cal = [NSCalendar currentCalendar];
    if( [@"5M" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:-5 toDate:eventTime options:0];
    } else if( [@"10M" isEqualToString:alarmTrigger] ){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:-10 toDate:eventTime options:0];
    } else if([@"30M"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:-30 toDate:eventTime options:0];
    } else if([@"1H" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitHour value:-1 toDate:eventTime options:0];
    } else if([@"1D" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:-1 toDate:eventTime options:0];
    } else if([@"2D"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:-2 toDate:eventTime options:0];
    } else if([@"3D"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:-3 toDate:eventTime options:0];
    } else if([@"1W"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitWeekOfYear value:-1 toDate:eventTime options:0];
    } else {
        return eventTime;
    }
}

-(NSData *_Nullable)resolveSessionKey:(TUTAlarmNotification *)alarmNotification {
    foreach(notificationSessionKey, alarmNotification.notificationSessionKeys) {
        NSError *error;
        let pushIdentifierSessionSessionKey = [_keychainManager getKeyWithError:notificationSessionKey.pushIdentifier.elementId error:&error];
        if (error) {
            NSLog(@"Failed to retrieve key %@ %@", notificationSessionKey.pushIdentifier.elementId, error);
        } else if (pushIdentifierSessionSessionKey) {
            var encSessionKey = [TUTEncodingConverter base64ToBytes:notificationSessionKey.pushIdentifierSessionEncSessionKey];
            var sessionKey = [TUTAes128Facade decryptKey:encSessionKey
                                       withEncryptionKey:pushIdentifierSessionSessionKey error:&error];
            if (error){
                NSLog(@"Failed to decrypt key %@ %@", notificationSessionKey.pushIdentifier.elementId, error);
            }
            return sessionKey;
        }
    }
    return nil;
}

-(void)scheduleRepeatingAlarmEventWithTime:(NSDate *)eventTime
                                   trigger:(NSString *)trigger
                                   summary:(NSString *)summary
                           alarmIdentifier:(NSString *)alarmIdentifier
                                repeatRule:(TUTRepeatRule *)repeatRule
                                sessionKey:(NSData *)sessionKey {
    NSError *error;
    
    let cal = NSCalendar.currentCalendar;
    let timeZoneName = [repeatRule getTimezonDec:sessionKey error:&error];
    cal.timeZone = [NSTimeZone timeZoneWithName:timeZoneName];
    
    let frequency = [repeatRule getFrequencyDec:sessionKey error:&error];
    let interval = [repeatRule getIntervalDec:sessionKey error:&error];
    let calendarUnit = [self calendarUnitForRepeatPeriod:frequency];
    let endType = [repeatRule getEndTypeDec:sessionKey error:&error];
    let endValue = [repeatRule getEndValueDec:sessionKey error:&error];
    var occurrences = 0;
    let now = [NSDate new];
    
    while (occurrences < EVENTS_SCHEDULED_AHEAD &&
           (endType != TUTRepeatEndTypeCount || endValue < occurrences)) {
        let occurrenceDate = [cal dateByAddingUnit:calendarUnit value:interval * occurrences toDate:eventTime options:0];
        if (endType == TUTRepeatEndTypeUntilDate && occurrenceDate.timeIntervalSince1970 > endValue / 1000) {
            break;
        } else if ([now compare:occurrenceDate] == NSOrderedAscending) { // Only schedule alarms in the future
            [self scheduleAlarmOccurrenceEventWithTime:occurrenceDate trigger:trigger summary:summary alarmIdentifier:alarmIdentifier occurrence:occurrences];
        }
        occurrences++;
    }
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
    let alarmTime = [self getAlarmTimeWithTrigger:trigger eventTime:eventTime];
    
    let formattedTime = [NSDateFormatter localizedStringFromDate:eventTime dateStyle:NSDateFormatterShortStyle timeStyle:NSDateFormatterShortStyle];
    let notificationText = [NSString stringWithFormat:@"%@: %@ %@ %@", formattedTime, summary, alarmIdentifier, alarmTime];
    
    
    unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute;
    
    let cal = [NSCalendar currentCalendar];
    let dateComponents = [cal components:unitFlags fromDate:alarmTime];
    
    let notificationTrigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:NO];
    
    let content = [UNMutableNotificationContent new];
    // TODO: localize
    content.title = @"Calendar reminder";
    content.body = notificationText;
    content.sound = [UNNotificationSound defaultSound];
    
    // Create the request
    let identifier = [self occurrenceIdentifier:alarmIdentifier occurrence:occurrence];
    let request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:notificationTrigger];
    // Schedule the request with the system.
    NSLog(@"Scheduling a notification %@ at: %@", identifier, dateComponents);
    [notificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
        if (error) {
            NSLog(@"Failed to schedule a notification: %@", error);
        }
    }];
}

-(NSCalendarUnit)calendarUnitForRepeatPeriod:(TUTRepeatPeriod)repeatPeriod {
    switch (repeatPeriod) {
        case TUTRepeatPeriodDaily:
            return NSCalendarUnitDay;
        case TUTRepeatPeriodWeekly:
            return NSCalendarUnitWeekOfYear;
        case TUTRepeatPeriodMonthly:
            return NSCalendarUnitMonth;
        case TUTRepeatPeriodAnnually:
            return NSCalendarUnitYear;
        default:
            NSLog(@"Did not find repeat period: %zd", repeatPeriod);
            return NSCalendarUnitDay;
            break;
    }
}

-(NSString *)occurrenceIdentifier:(NSString *)alarmIdentifier occurrence:(int)occurrence {
    return [NSString stringWithFormat:@"%@#%d", alarmIdentifier, occurrence];
}

@end
