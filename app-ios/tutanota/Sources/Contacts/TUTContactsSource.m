//
//  TUTContactsSource.m
//  tutanota
//
//  Created by Tutao GmbH on 25.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import "TUTContactsSource.h"

// Frameworks
#import <Contacts/CNContactFormatter.h>
#import <Contacts/CNContactStore.h>
#import <Contacts/CNContactFetchRequest.h>

// sugar
#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"


static const NSString *CONTACTS_ERROR_DOMAIN = @"ContactsErrorDomain";

@implementation TUTContactsSource

-(void)searchForContactsUsingQuery:(NSString *)query
						completion:(void(^ _Nonnull) (NSArray<NSDictionary *> * _Nullable contacts, NSError * _Nullable error))completion {
	let status = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
	switch (status) {
		case CNAuthorizationStatusAuthorized:
			[self doSearchForQuery:query completion:completion];
			break;
		case CNAuthorizationStatusDenied:
		case CNAuthorizationStatusRestricted:
			completion(@[], nil);
			break;
		case CNAuthorizationStatusNotDetermined:
			[[[CNContactStore alloc] init] requestAccessForEntityType:CNEntityTypeContacts
													completionHandler:^(BOOL granted, NSError *error) {
														if (granted) {
															[self doSearchForQuery:query completion:completion];
														} else {
															completion(@[], error);
														}
													}];
			break;
	}
}

-(void) doSearchForQuery:(NSString *)query
			  completion:(void (^)(NSArray<NSDictionary *> * _Nullable result, NSError * _Nullable error))completion {
	let contactsStore = [CNContactStore new];
	let keys = @[
				 CNContactEmailAddressesKey,
				 [CNContactFormatter descriptorForRequiredKeysForStyle:CNContactFormatterStyleFullName]
				 ];
	let request = [[CNContactFetchRequest alloc] initWithKeysToFetch:keys];

	NSMutableArray<NSDictionary<NSString *, NSString *> *> *result = [NSMutableArray new];
	NSError *error = nil;
	let compareOptions = NSCaseInsensitiveSearch | NSDiacriticInsensitiveSearch;
	__block var count = 0;

	// This method is synchronous. Enumeration prevents having all accounts in memory at once.
	// We are doing the search manually because we can only use predicates from CNContact+Predicates.h
	// and there's no predicate for the e-mail. Thanks, Apple, making our lifes easier.
	[contactsStore enumerateContactsWithFetchRequest:request
											   error:&error
										  usingBlock:^(CNContact * _Nonnull contact, BOOL * _Nonnull stop) {
											  foreach(address, contact.emailAddresses) {
												  let name = [CNContactFormatter stringFromContact:contact
																							 style:CNContactFormatterStyleFullName];
												  if ([address.value rangeOfString:query options:compareOptions].location != NSNotFound
													  || [name rangeOfString:query options:compareOptions].location != NSNotFound) {
													  [result addObject:@{
																		  @"name": name,
																		  @"mailAddress": contact.emailAddresses[0].value
																		  }];
													  if (count++ > 10) {
														  *stop = YES;
													  }
												}
											  }
										  }];
		completion(result, error);
}
@end
