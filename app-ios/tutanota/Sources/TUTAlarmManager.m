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

#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

#import <UserNotifications/UserNotifications.h>

@implementation TUTAlarmManager
- (void)scheduleAlarmsFromAlarmInfos:(NSArray<NSDictionary *> *)alarmInfos completionsHandler:(void(^)(void))completionHandler {
    dispatch_group_t group = dispatch_group_create();
    
    foreach(alarmInfo, (NSArray<NSDictionary *> *) alarmInfos) {
        dispatch_group_enter(group);
        [TUTAlarmManager scheduleLocalAlarm:alarmInfo handler: ^(NSError * _Nullable error) {
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

+ (void) scheduleLocalAlarm:(NSDictionary*)alarmInfo handler:(nullable void(^)(NSError *__nullable error))completionHandler {
    NSLog(@"Alarm info: %@", alarmInfo);
    NSString *identifier = alarmInfo[@"identifier"];
    let notificationCenter = UNUserNotificationCenter.currentNotificationCenter;
    
    if ([@"0" isEqualToString:alarmInfo[@"operation"]] ) { // create
        let trigger = ((NSString *) alarmInfo[@"trigger"]).longLongValue;
        let date = [NSDate dateWithTimeIntervalSince1970:trigger / 1000];
        unsigned unitFlags = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute;
        
        let cal = [NSCalendar currentCalendar];
        let dateComponents = [cal components:unitFlags fromDate:date];
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
    } else if( [@"2" isEqualToString:alarmInfo[@"operation"]] ) { // delete
        NSLog(@"Cancelling a notification %@", identifier);
        [notificationCenter removePendingNotificationRequestsWithIdentifiers:@[identifier]];
        completionHandler(nil);
    }
}
                         
@end
