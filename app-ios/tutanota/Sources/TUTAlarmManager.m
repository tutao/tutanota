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

#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

#import <UserNotifications/UserNotifications.h>

#import  "Alarms/TUTMissedNotification.h"
#import "Crypto/TUTAes128Facade.h"
#import "Keychain/TUTKeychainManager.h"

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
                         completionHandler:(NotificationLoadingCompletionHandler)completionHandler {
    let additionalHeaders = @{
                              @"userIds": [sseInfo.userIds componentsJoinedByString:@","]
                              };

    let configuration = NSURLSessionConfiguration.ephemeralSessionConfiguration;
    configuration.HTTPAdditionalHeaders = additionalHeaders;
    
    let urlSession = [NSURLSession sessionWithConfiguration:configuration];
    let urlString = [self missedNotificationUrl:sseInfo.sseOrigin pushIdentifier:sseInfo.pushIdentifier];
    
    [[urlSession dataTaskWithURL:[NSURL URLWithString:urlString] completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        let httpResponse = (NSHTTPURLResponse *) response;
        if (error) {
            completionHandler(nil, error);
        } else if (httpResponse.statusCode == 404) {
            completionHandler(nil, nil);
        } else if (httpResponse.statusCode != 200) {
            let error = [TUTErrorFactory createError:[NSString stringWithFormat:@"Missed notification response with status code: %zd", httpResponse.statusCode]];
            completionHandler(nil, error);
        } else {
            NSError *jsonError;
            NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
            if (jsonError) {
                NSLog(@"Failed to parse response for the missed notification request %@", jsonError);
                return;
            }
            completionHandler(json, nil);
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
    NSLog(@"Alarm notification: %@", alarmNotification);
    let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
    
    var sessionKey = [self resolveSessionKey:alarmNotification];
    if (!sessionKey){
        completionHandler([TUTErrorFactory createError:@"cannot resolve session key"]);
        return;
    }
    
    NSError *error;
    let identifier = [alarmNotification.alarmInfo getAlarmIdentifierDec:sessionKey error:&error];
    if (error) {
        completionHandler(error);
        return;
    }
    
    if ([@"0" isEqualToString:alarmNotification.operation] ) { // create
        let trigger = [alarmNotification.alarmInfo getTriggerDec:sessionKey error:&error];
        let eventTime = [alarmNotification getEventStartDec:sessionKey error:&error];
        if (error) {
            completionHandler(error);
            return;
        }
        let alarmTime = [self getAlarmTimeWithTrigger:trigger eventTime:eventTime];
        
        unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute;
        
        let cal = [NSCalendar currentCalendar];
        let dateComponents = [cal components:unitFlags fromDate:alarmTime];
        let notificationTrigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:NO];
        
        let content = [UNMutableNotificationContent new];
        content.title = @"Reminder";
        content.body = @"Tutanota calendar event";
        content.sound = [UNNotificationSound defaultSound];
        
        // Create the request
        let request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:notificationTrigger];
        // Schedule the request with the system.
        NSLog(@"Scheduling a notification %@ at: %@", identifier, dateComponents);
        [notificationCenter addNotificationRequest:request withCompletionHandler:completionHandler];
    } else if( [@"2" isEqualToString:alarmNotification.operation] ) { // delete
        NSLog(@"Cancelling a notification %@", identifier);
        [notificationCenter removePendingNotificationRequestsWithIdentifiers:@[identifier]];
        completionHandler(nil);
    }
}

- (NSDate *)getAlarmTimeWithTrigger:(NSString*)alarmTrigger eventTime:(NSDate *)eventTime {
    let cal = [NSCalendar currentCalendar];
    if( [@"5M" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:5 toDate:eventTime options:0];
    } else if( [@"10M" isEqualToString:alarmTrigger] ){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:10 toDate:eventTime options:0];
    } else if([@"30M"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitMinute value:30 toDate:eventTime options:0];
    } else if([@"1H" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitHour value:1 toDate:eventTime options:0];
    } else if([@"1D" isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:1 toDate:eventTime options:0];
    } else if([@"2D"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:2 toDate:eventTime options:0];
    } else if([@"3D"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitDay value:3 toDate:eventTime options:0];
    } else if([@"1W"isEqualToString:alarmTrigger]){
        return [cal dateByAddingUnit:NSCalendarUnitWeekOfYear value:1 toDate:eventTime options:0];
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
                         
@end
