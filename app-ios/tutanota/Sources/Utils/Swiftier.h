//
//  Swiftier.h
//  Parts of 'Swiftier Objective-C' articles.
//  See https://pspdfkit.com/blog/2017/even-swiftier-objective-c
//  tutanota
//
//  Created by Tutao GmbH on 24.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#if defined(__cplusplus)
#define let auto const
#else
#define let const __auto_type
#endif

#if defined(__cplusplus)
#define var auto
#else
#define var __auto_type
#endif
