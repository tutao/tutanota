//
//  PSPDFFastEnumeration.h
//  PSPDFFoundation
//
//  PSPDFKit is the leading cross-platform solution for integrating PDFs into your apps: https://pspdfkit.com.
//  Try it today using our free PDF Viewer app: https://pdfviewer.io/
//
//  This file is MIT licensed.

#import <Foundation/Foundation.h>

@protocol PSPDFFastEnumeration <NSFastEnumeration>
- (id)pspdf_enumeratedType;
@end

// Usage: foreach (s, strings) { ... }
#define foreach(element, collection) for (typeof((collection).pspdf_enumeratedType) element in (collection))

@interface NSArray <ElementType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (ElementType)pspdf_enumeratedType;

@end

@interface NSSet <ElementType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (ElementType)pspdf_enumeratedType;

@end

@interface NSDictionary <KeyType, ValueType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (KeyType)pspdf_enumeratedType;

@end

@interface NSOrderedSet <ElementType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (ElementType)pspdf_enumeratedType;

@end

@interface NSPointerArray (PSPDFFastEnumeration) <PSPDFFastEnumeration>

- (void *)pspdf_enumeratedType;

@end

@interface NSHashTable <ElementType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (ElementType)pspdf_enumeratedType;

@end

@interface NSMapTable <KeyType, ValueType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (KeyType)pspdf_enumeratedType;

@end

@interface NSEnumerator <ElementType> (PSPDFFastEnumeration)
<PSPDFFastEnumeration>

    - (ElementType)pspdf_enumeratedType;

@end
