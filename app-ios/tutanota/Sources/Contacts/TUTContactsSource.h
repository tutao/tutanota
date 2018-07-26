//
//  TUTContactsSource.h
//  tutanota
//
//  Created by Tutao GmbH on 25.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface TUTContactsSource : NSObject

-(void)searchForContactsUsingQuery:(NSString *)query
						completion:(void(^ _Nonnull) (NSArray<NSDictionary *> * _Nullable contacts, NSError * _Nullable error))completion;
@end
