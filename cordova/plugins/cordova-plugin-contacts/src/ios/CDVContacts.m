/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "CDVContacts.h"
#import <UIKit/UIKit.h>

@implementation CDVContactsPicker

@synthesize allowsEditing;
@synthesize callbackId;
@synthesize options;
@synthesize pickedContactDictionary;

@end
@implementation CDVNewContactsController

@synthesize callbackId;

@end

@implementation CDVContacts

// overridden to clean up Contact statics
- (void)onAppTerminate
{
    // NSLog(@"Contacts::onAppTerminate");
}

// iPhone only method to create a new contact through the GUI
- (void)newContact:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;

    CDVAddressBookHelper* abHelper = [[CDVAddressBookHelper alloc] init];
    CDVContacts* __weak weakSelf = self;  // play it safe to avoid retain cycles

    [abHelper createAddressBook: ^(ABAddressBookRef addrBook, CDVAddressBookAccessError* errCode) {
        if (addrBook == NULL) {
            // permission was denied or other error just return (no error callback)
            return;
        }
        CDVNewContactsController* npController = [[CDVNewContactsController alloc] init];
        npController.addressBook = addrBook;     // a CF retaining assign
        CFRelease(addrBook);

        npController.newPersonViewDelegate = self;
        npController.callbackId = callbackId;

        UINavigationController* navController = [[UINavigationController alloc] initWithRootViewController:npController];

        [weakSelf.viewController presentViewController:navController animated:YES completion:nil];
    }];
}

- (void)newPersonViewController:(ABNewPersonViewController*)newPersonViewController didCompleteWithNewPerson:(ABRecordRef)person
{
    ABRecordID recordId = kABRecordInvalidID;
    CDVNewContactsController* newCP = (CDVNewContactsController*)newPersonViewController;
    NSString* callbackId = newCP.callbackId;

    if (person != NULL) {
        // return the contact id
        recordId = ABRecordGetRecordID(person);
    }

    [[newPersonViewController presentingViewController] dismissViewControllerAnimated:YES completion:nil];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:recordId];
    [self.commandDelegate sendPluginResult:result callbackId:callbackId];
}

- (bool)existsValue:(NSDictionary*)dict val:(NSString*)expectedValue forKey:(NSString*)key
{
    id val = [dict valueForKey:key];
    bool exists = false;
    
    if (val != nil) {
        exists = [(NSString*)val compare : expectedValue options : NSCaseInsensitiveSearch] == 0;
    }
    
    return exists;
}

- (void)displayContact:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    ABRecordID recordID = [[command argumentAtIndex:0] intValue];
    NSDictionary* options = [command argumentAtIndex:1 withDefault:[NSNull null]];
    bool bEdit = [options isKindOfClass:[NSNull class]] ? false : [self existsValue:options val:@"true" forKey:@"allowsEditing"];

    CDVAddressBookHelper* abHelper = [[CDVAddressBookHelper alloc] init];
    CDVContacts* __weak weakSelf = self;  // play it safe to avoid retain cycles

    [abHelper createAddressBook: ^(ABAddressBookRef addrBook, CDVAddressBookAccessError* errCode) {
        if (addrBook == NULL) {
            // permission was denied or other error - return error
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:errCode ? (int)errCode.errorCode:UNKNOWN_ERROR];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
            return;
        }
        ABRecordRef rec = ABAddressBookGetPersonWithRecordID(addrBook, recordID);

        if (rec) {
            CDVDisplayContactViewController* personController = [[CDVDisplayContactViewController alloc] init];
            personController.displayedPerson = rec;
            personController.personViewDelegate = self;
            personController.allowsEditing = NO;

            // create this so DisplayContactViewController will have a "back" button.
            UIViewController* parentController = [[UIViewController alloc] init];
            UINavigationController* navController = [[UINavigationController alloc] initWithRootViewController:parentController];

            [navController pushViewController:personController animated:YES];

            [self.viewController presentViewController:navController animated:YES completion:nil];

            if (bEdit) {
                // create the editing controller and push it onto the stack
                ABPersonViewController* editPersonController = [[ABPersonViewController alloc] init];
                editPersonController.displayedPerson = rec;
                editPersonController.personViewDelegate = self;
                editPersonController.allowsEditing = YES;
                [navController pushViewController:editPersonController animated:YES];
            }
        } else {
            // no record, return error
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:UNKNOWN_ERROR];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
        }
        CFRelease(addrBook);
    }];
}

- (BOOL)personViewController:(ABPersonViewController*)personViewController shouldPerformDefaultActionForPerson:(ABRecordRef)person
                    property:(ABPropertyID)property identifier:(ABMultiValueIdentifier)identifierForValue
{
    return YES;
}

- (void)chooseContact:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    NSDictionary* options = [command argumentAtIndex:0 withDefault:[NSNull null]];

    CDVContactsPicker* pickerController = [[CDVContactsPicker alloc] init];

    pickerController.peoplePickerDelegate = self;
    pickerController.callbackId = callbackId;
    pickerController.options = options;
    pickerController.pickedContactDictionary = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithInt:kABRecordInvalidID], kW3ContactId, nil];
    id allowsEditingValue = [options valueForKey:@"allowsEditing"];
    BOOL allowsEditing = NO;
    if ([allowsEditingValue isKindOfClass:[NSNumber class]]) {
        allowsEditing = [(NSNumber*)allowsEditingValue boolValue];
    }
    pickerController.allowsEditing = allowsEditing;

    [self.viewController presentViewController:pickerController animated:YES completion:nil];
}

- (void)pickContact:(CDVInvokedUrlCommand *)command
{
    // mimic chooseContact method call with required for us parameters
    NSArray* desiredFields = [command argumentAtIndex:0 withDefault:[NSArray array]];
    if (desiredFields == nil || desiredFields.count == 0) {
        desiredFields = [NSArray arrayWithObjects:@"*", nil];
    }
    NSMutableDictionary* options = [NSMutableDictionary dictionaryWithCapacity:2];
    
    [options setObject: desiredFields forKey:@"fields"];
    [options setObject: [NSNumber numberWithBool: FALSE] forKey:@"allowsEditing"];
    
    NSArray* args = [NSArray arrayWithObjects:options, nil];
    
    CDVInvokedUrlCommand* newCommand = [[CDVInvokedUrlCommand alloc] initWithArguments:args
                 callbackId:command.callbackId
                  className:command.className
                 methodName:command.methodName];

    // First check for Address book permissions
    ABAuthorizationStatus status = ABAddressBookGetAuthorizationStatus();
    if (status == kABAuthorizationStatusAuthorized) {
        [self chooseContact:newCommand];
        return;
    }

    CDVPluginResult *errorResult = [CDVPluginResult resultWithStatus: CDVCommandStatus_ERROR messageAsInt:PERMISSION_DENIED_ERROR];

    // if the access is already restricted/denied the only way is to fail
    if (status == kABAuthorizationStatusRestricted || status == kABAuthorizationStatusDenied) {
        [self.commandDelegate sendPluginResult: errorResult callbackId:command.callbackId];
        return;
    }

    // if no permissions granted try to request them first
    if (status == kABAuthorizationStatusNotDetermined) {
        ABAddressBookRequestAccessWithCompletion(addressBook, ^(bool granted, CFErrorRef error) {
            if (granted) {
                [self chooseContact:newCommand];
                return;
            }

            [self.commandDelegate sendPluginResult: errorResult callbackId:command.callbackId];
        });
    }
}

- (BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController*)peoplePicker
      shouldContinueAfterSelectingPerson:(ABRecordRef)person
{
    [self peoplePickerNavigationController:peoplePicker didSelectPerson:person];
    return NO;
}

- (BOOL)peoplePickerNavigationController:(ABPeoplePickerNavigationController*)peoplePicker
      shouldContinueAfterSelectingPerson:(ABRecordRef)person property:(ABPropertyID)property identifier:(ABMultiValueIdentifier)identifier
{
    return YES;
}

- (void)peoplePickerNavigationControllerDidCancel:(ABPeoplePickerNavigationController*)peoplePicker
{
    // return contactId or invalid if none picked
    CDVContactsPicker* picker = (CDVContactsPicker*)peoplePicker;

    if (picker.allowsEditing) {
        // get the info after possible edit
        // if we got this far, user has already approved/ disapproved addressBook access
        ABAddressBookRef addrBook = ABAddressBookCreateWithOptions(NULL, NULL);
        ABRecordRef person = ABAddressBookGetPersonWithRecordID(addrBook, (int)[[picker.pickedContactDictionary objectForKey:kW3ContactId] integerValue]);
        if (person) {
            CDVContact* pickedContact = [[CDVContact alloc] initFromABRecord:(ABRecordRef)person];
            NSArray* fields = [picker.options objectForKey:@"fields"];
            NSDictionary* returnFields = [[CDVContact class] calcReturnFields:fields];
            picker.pickedContactDictionary = [pickedContact toDictionary:returnFields];
        }
        CFRelease(addrBook);
    }
    
    CDVPluginResult* result = nil;
    NSNumber* recordId = picker.pickedContactDictionary[kW3ContactId];
    
    if ([recordId isEqualToNumber:[NSNumber numberWithInt:kABRecordInvalidID]]) {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:OPERATION_CANCELLED_ERROR] ;
    } else {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:picker.pickedContactDictionary];
    }
    
    [self.commandDelegate sendPluginResult:result callbackId:picker.callbackId];

    [[peoplePicker presentingViewController] dismissViewControllerAnimated:YES completion:nil];
}

// Called after a person has been selected by the user.
- (void)peoplePickerNavigationController:(ABPeoplePickerNavigationController*)peoplePicker didSelectPerson:(ABRecordRef)person
{
    CDVContactsPicker* picker = (CDVContactsPicker*)peoplePicker;
    NSNumber* pickedId = [NSNumber numberWithInt:ABRecordGetRecordID(person)];
    
    if (picker.allowsEditing) {
        ABPersonViewController* personController = [[ABPersonViewController alloc] init];
        personController.displayedPerson = person;
        personController.personViewDelegate = self;
        personController.allowsEditing = picker.allowsEditing;
        // store id so can get info in peoplePickerNavigationControllerDidCancel
        picker.pickedContactDictionary = [NSDictionary dictionaryWithObjectsAndKeys:pickedId, kW3ContactId, nil];
        
        [peoplePicker pushViewController:personController animated:YES];
    } else {
        // Retrieve and return pickedContact information
        CDVContact* pickedContact = [[CDVContact alloc] initFromABRecord:(ABRecordRef)person];
        NSArray* fields = [picker.options objectForKey:@"fields"];
        NSDictionary* returnFields = [[CDVContact class] calcReturnFields:fields];
        picker.pickedContactDictionary = [pickedContact toDictionary:returnFields];
        
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:picker.pickedContactDictionary];
        [self.commandDelegate sendPluginResult:result callbackId:picker.callbackId];
        
        [[picker presentingViewController] dismissViewControllerAnimated:YES completion:nil];
    }
}

// Called after a property has been selected by the user.
- (void)peoplePickerNavigationController:(ABPeoplePickerNavigationController*)peoplePicker didSelectPerson:(ABRecordRef)person property:(ABPropertyID)property identifier:(ABMultiValueIdentifier)identifier
{
    // not implemented
}

- (void)search:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    NSArray* fields = [command argumentAtIndex:0];
    NSDictionary* findOptions = [command argumentAtIndex:1 withDefault:[NSNull null]];

    [self.commandDelegate runInBackground:^{
        // from Apple:  Important You must ensure that an instance of ABAddressBookRef is used by only one thread.
        // which is why address book is created within the dispatch queue.
        // more details here: http: //blog.byadrian.net/2012/05/05/ios-addressbook-framework-and-gcd/
        CDVAddressBookHelper* abHelper = [[CDVAddressBookHelper alloc] init];
        CDVContacts* __weak weakSelf = self;     // play it safe to avoid retain cycles
        // it gets uglier, block within block.....
        [abHelper createAddressBook: ^(ABAddressBookRef addrBook, CDVAddressBookAccessError* errCode) {
            if (addrBook == NULL) {
                // permission was denied or other error - return error
                CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageToErrorObject:errCode ? (int)errCode.errorCode:UNKNOWN_ERROR];
                [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
                return;
            }

            NSArray* foundRecords = nil;
            // get the findOptions values
            BOOL multiple = NO;         // default is false
            NSString* filter = nil;
            NSArray* desiredFields = nil;
            if (![findOptions isKindOfClass:[NSNull class]]) {
                id value = nil;
                filter = (NSString*)[findOptions objectForKey:@"filter"];
                value = [findOptions objectForKey:@"multiple"];
                if ([value isKindOfClass:[NSNumber class]]) {
                    // multiple is a boolean that will come through as an NSNumber
                    multiple = [(NSNumber*)value boolValue];
                    // NSLog(@"multiple is: %d", multiple);
                }
                desiredFields = [findOptions objectForKey:@"desiredFields"];
                // return all fields if desired fields are not explicitly defined
                if (desiredFields == nil || desiredFields.count == 0) {
                    desiredFields = [NSArray arrayWithObjects:@"*", nil];
                }
            }

            NSDictionary* searchFields = [[CDVContact class] calcReturnFields:fields];
            NSDictionary* returnFields = [[CDVContact class] calcReturnFields:desiredFields];

            NSMutableArray* matches = nil;
            if (!filter || [filter isEqualToString:@""]) {
                // get all records
                foundRecords = (__bridge_transfer NSArray*)ABAddressBookCopyArrayOfAllPeople(addrBook);
                if (foundRecords && ([foundRecords count] > 0)) {
                    // create Contacts and put into matches array
                    // doesn't make sense to ask for all records when multiple == NO but better check
                    int xferCount = multiple == YES ? (int)[foundRecords count] : 1;
                    matches = [NSMutableArray arrayWithCapacity:xferCount];

                    for (int k = 0; k < xferCount; k++) {
                        CDVContact* xferContact = [[CDVContact alloc] initFromABRecord:(__bridge ABRecordRef)[foundRecords objectAtIndex:k]];
                        [matches addObject:xferContact];
                        xferContact = nil;
                    }
                }
            } else {
                foundRecords = (__bridge_transfer NSArray*)ABAddressBookCopyArrayOfAllPeople(addrBook);
                matches = [NSMutableArray arrayWithCapacity:1];
                BOOL bFound = NO;
                int testCount = (int)[foundRecords count];

                for (int j = 0; j < testCount; j++) {
                    CDVContact* testContact = [[CDVContact alloc] initFromABRecord:(__bridge ABRecordRef)[foundRecords objectAtIndex:j]];
                    if (testContact) {
                        bFound = [testContact foundValue:filter inFields:searchFields];
                        if (bFound) {
                            [matches addObject:testContact];
                        }
                        testContact = nil;
                    }
                }
            }
            NSMutableArray* returnContacts = [NSMutableArray arrayWithCapacity:1];

            if ((matches != nil) && ([matches count] > 0)) {
                // convert to JS Contacts format and return in callback
                // - returnFields  determines what properties to return
                @autoreleasepool {
                    int count = multiple == YES ? (int)[matches count] : 1;

                    for (int i = 0; i < count; i++) {
                        CDVContact* newContact = [matches objectAtIndex:i];
                        NSDictionary* aContact = [newContact toDictionary:returnFields];
                        [returnContacts addObject:aContact];
                    }
                }
            }
            // return found contacts (array is empty if no contacts found)
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:returnContacts];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
            // NSLog(@"findCallback string: %@", jsString);

            if (addrBook) {
                CFRelease(addrBook);
            }
        }];
    }];     // end of workQueue block

    return;
}

- (void)save:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    NSDictionary* contactDict = [command argumentAtIndex:0];

    [self.commandDelegate runInBackground:^{
        CDVAddressBookHelper* abHelper = [[CDVAddressBookHelper alloc] init];
        CDVContacts* __weak weakSelf = self;     // play it safe to avoid retain cycles

        [abHelper createAddressBook: ^(ABAddressBookRef addrBook, CDVAddressBookAccessError* errorCode) {
            CDVPluginResult* result = nil;
            if (addrBook == NULL) {
                // permission was denied or other error - return error
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:errorCode ? (int)errorCode.errorCode:UNKNOWN_ERROR];
                [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
                return;
            }

            bool bIsError = FALSE, bSuccess = FALSE;
            BOOL bUpdate = NO;
            CDVContactError errCode = UNKNOWN_ERROR;
            CFErrorRef error;
            NSNumber* cId = [contactDict valueForKey:kW3ContactId];
            CDVContact* aContact = nil;
            ABRecordRef rec = nil;
            if (cId && ![cId isKindOfClass:[NSNull class]]) {
                rec = ABAddressBookGetPersonWithRecordID(addrBook, [cId intValue]);
                if (rec) {
                    aContact = [[CDVContact alloc] initFromABRecord:rec];
                    bUpdate = YES;
                }
            }
            if (!aContact) {
                aContact = [[CDVContact alloc] init];
            }

            bSuccess = [aContact setFromContactDict:contactDict asUpdate:bUpdate];
            if (bSuccess) {
                if (!bUpdate) {
                    bSuccess = ABAddressBookAddRecord(addrBook, [aContact record], &error);
                }
                if (bSuccess) {
                    bSuccess = ABAddressBookSave(addrBook, &error);
                }
                if (!bSuccess) {         // need to provide error codes
                    bIsError = TRUE;
                    errCode = IO_ERROR;
                } else {
                    // give original dictionary back?  If generate dictionary from saved contact, have no returnFields specified
                    // so would give back all fields (which W3C spec. indicates is not desired)
                    // for now (while testing) give back saved, full contact
                    NSDictionary* newContact = [aContact toDictionary:[CDVContact defaultFields]];
                    // NSString* contactStr = [newContact JSONRepresentation];
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:newContact];
                }
            } else {
                bIsError = TRUE;
                errCode = IO_ERROR;
            }
            CFRelease(addrBook);

            if (bIsError) {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:(int)errCode];
            }

            if (result) {
                [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
            }
        }];
    }];     // end of  queue
}

- (void)remove:(CDVInvokedUrlCommand*)command
{
    NSString* callbackId = command.callbackId;
    NSNumber* cId = [command argumentAtIndex:0];

    CDVAddressBookHelper* abHelper = [[CDVAddressBookHelper alloc] init];
    CDVContacts* __weak weakSelf = self;  // play it safe to avoid retain cycles

    [abHelper createAddressBook: ^(ABAddressBookRef addrBook, CDVAddressBookAccessError* errorCode) {
        CDVPluginResult* result = nil;
        if (addrBook == NULL) {
            // permission was denied or other error - return error
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:errorCode ? (int)errorCode.errorCode:UNKNOWN_ERROR];
            [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
            return;
        }

        bool bIsError = FALSE, bSuccess = FALSE;
        CDVContactError errCode = UNKNOWN_ERROR;
        CFErrorRef error;
        ABRecordRef rec = nil;
        if (cId && ![cId isKindOfClass:[NSNull class]] && ([cId intValue] != kABRecordInvalidID)) {
            rec = ABAddressBookGetPersonWithRecordID(addrBook, [cId intValue]);
            if (rec) {
                bSuccess = ABAddressBookRemoveRecord(addrBook, rec, &error);
                if (!bSuccess) {
                    bIsError = TRUE;
                    errCode = IO_ERROR;
                } else {
                    bSuccess = ABAddressBookSave(addrBook, &error);
                    if (!bSuccess) {
                        bIsError = TRUE;
                        errCode = IO_ERROR;
                    } else {
                        // set id to null
                        // [contactDict setObject:[NSNull null] forKey:kW3ContactId];
                        // result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: contactDict];
                        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
                        // NSString* contactStr = [contactDict JSONRepresentation];
                    }
                }
            } else {
                // no record found return error
                bIsError = TRUE;
                errCode = UNKNOWN_ERROR;
            }
        } else {
            // invalid contact id provided
            bIsError = TRUE;
            errCode = INVALID_ARGUMENT_ERROR;
        }

        if (addrBook) {
            CFRelease(addrBook);
        }
        if (bIsError) {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:(int)errCode];
        }
        if (result) {
            [weakSelf.commandDelegate sendPluginResult:result callbackId:callbackId];
        }
    }];
    return;
}

@end

/* ABPersonViewController does not have any UI to dismiss.  Adding navigationItems to it does not work properly
 * The navigationItems are lost when the app goes into the background.  The solution was to create an empty
 * NavController in front of the ABPersonViewController. This will cause the ABPersonViewController to have a back button. By subclassing the ABPersonViewController, we can override viewDidDisappear and take down the entire NavigationController.
 */
@implementation CDVDisplayContactViewController
@synthesize contactsPlugin;

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];

    [[self presentingViewController] dismissViewControllerAnimated:YES completion:nil];
}

@end
@implementation CDVAddressBookAccessError

@synthesize errorCode;

- (CDVAddressBookAccessError*)initWithCode:(CDVContactError)code
{
    self = [super init];
    if (self) {
        self.errorCode = code;
    }
    return self;
}

@end

@implementation CDVAddressBookHelper

/**
 * NOTE: workerBlock is responsible for releasing the addressBook that is passed to it
 */
- (void)createAddressBook:(CDVAddressBookWorkerBlock)workerBlock
{
    // TODO: this probably should be reworked - seems like the workerBlock can just create and release its own AddressBook,
    // and also this important warning from (http://developer.apple.com/library/ios/#documentation/ContactData/Conceptual/AddressBookProgrammingGuideforiPhone/Chapters/BasicObjects.html):
    // "Important: Instances of ABAddressBookRef cannot be used by multiple threads. Each thread must make its own instance."
    ABAddressBookRef addressBook;

    CFErrorRef error = nil;
    // CFIndex status = ABAddressBookGetAuthorizationStatus();
    addressBook = ABAddressBookCreateWithOptions(NULL, &error);
    // NSLog(@"addressBook access: %lu", status);
    ABAddressBookRequestAccessWithCompletion(addressBook, ^(bool granted, CFErrorRef error) {
            // callback can occur in background, address book must be accessed on thread it was created on
            dispatch_sync(dispatch_get_main_queue(), ^{
                if (error) {
                    workerBlock(NULL, [[CDVAddressBookAccessError alloc] initWithCode:UNKNOWN_ERROR]);
                } else if (!granted) {
                    workerBlock(NULL, [[CDVAddressBookAccessError alloc] initWithCode:PERMISSION_DENIED_ERROR]);
                } else {
                    // access granted
                    workerBlock(addressBook, [[CDVAddressBookAccessError alloc] initWithCode:UNKNOWN_ERROR]);
                }
            });
        });
}

@end
