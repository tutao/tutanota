<!---
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
-->

# org.apache.cordova.contacts

장치 연락처 데이터베이스에 대 한 액세스를 제공합니다.

**경고**: 중요 한 개인 정보 보호 문제를 제기 하는 연락처 데이터의 수집 및 사용 합니다. 응용 프로그램의 개인 정보 보호 정책 응용 프로그램 연락처 데이터를 사용 하는 방법 및 다른 당사자와 함께 공유 하는 여부를 토론 해야 한다. 연락처 정보 누구와 통신 하는 사람이 사람들 보여 때문에 민감한으로 간주 됩니다. 따라서 애플 리 케이 션의 개인 정보 보호 정책 뿐만 아니라 강하게 해야 장치 운영 체제는 이렇게 이미 하지 않는 경우 응용 프로그램 액세스 또는 연락처 데이터를 사용 하기 전에 그냥--시간 통지를 제공 합니다. 그 통지는 (예를 들어, **확인** 및 **아니오**선택 제시) 하 여 사용자의 허가 취득 뿐만 아니라, 위에서 언급 된 동일한 정보를 제공 해야 합니다. Note 일부 애플 리 케이 션 장 터 그냥--시간 공지 및 연락처 데이터에 액세스 하기 전에 사용자의 허가 받아야 응용 프로그램에 필요할 수 있습니다. 연락처 데이터는 사용자의 혼동을 방지할 수의 사용 및 연락처 데이터의 인식된 오용 명확 하 고 이해 하기 쉬운 사용자 경험. 자세한 내용은 개인 정보 보호 가이드를 참조 하십시오.

## 설치

    cordova plugin add org.apache.cordova.contacts
    

### 파이어 폭스 OS 단점

[참고 문서][1]에 설명 된 대로 **www/manifest.webapp** 를 만듭니다. 관련 부여할 추가 합니다. [참고 문서][2]에 "권한"-webapp 유형을 변경 하려면 필요가 하다. **경고**: 모든 훌륭한 애플 리 케이 션 인라인 스크립트를 금지 하는 [콘텐츠 보안 정책][3] 을 적용 합니다. 다른 방법으로 응용 프로그램을 초기화 합니다.

 [1]: https://developer.mozilla.org/en-US/Apps/Developing/Manifest
 [2]: https://developer.mozilla.org/en-US/Apps/Developing/Manifest#type
 [3]: https://developer.mozilla.org/en-US/Apps/CSP

    "type": "privileged",
    "permissions": {
        "contacts": {
            "access": "readwrite",
            "description": "Describe why there is a need for such permission"
        }
    }
    

### 윈도우 특수

모든 연락처에서 반환 된 `find` 및 `pickContact` 메서드는 읽기 전용 응용 프로그램을 수정할 수 없습니다. `find`Windows Phone 8.1 장치에만 사용할 수 있는 방법.

### 윈도우 8 단점

윈도우 8 연락처는 읽기 전용입니다. 코르 도우 바 API 연락처를 통해 하지 쿼리/검색할 수 있습니다, 사용자 알려 '사람' 애플 리 케이 션을 열 것 이다 contacts.pickContact에 대 한 호출으로 연락처를 선택 하 여 사용자 연락처를 선택 해야 합니다. 반환 된 연락처는 읽기 전용 응용 프로그램을 수정할 수 없습니다.

## navigator.contacts

### 메서드

*   navigator.contacts.create
*   navigator.contacts.find
*   navigator.contacts.pickContact

### 개체

*   연락처
*   담당자 이름
*   ContactField
*   ContactAddress
*   ContactOrganization
*   ContactFindOptions
*   ContactError
*   ContactFieldType

## navigator.contacts.create

`navigator.contacts.create`메서드는 동기적, 및 새로운 반환 합니다 `Contact` 개체.

이 메서드를 호출 해야 장치 연락처 데이터베이스에 연락처 개체를 유지 하지 않습니다는 `Contact.save` 방법.

### 지원 되는 플랫폼

*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8

### 예를 들어

    var myContact = navigator.contacts.create({"displayName": "Test User"});
    

## navigator.contacts.find

`navigator.contacts.find`장치 연락처 데이터베이스 쿼리 및의 배열을 반환 메서드가 비동기적으로 실행 될 `Contact` 개체. 결과 객체에 전달 되는 `contactSuccess` **contactSuccess** 매개 변수로 지정 된 콜백 함수.

**ContactFields** 매개 변수는 검색 한정자로 사용할 필드를 지정 합니다. 길이가 0 인 **contactFields** 매개 변수 유효 하지 않습니다 및 결과 `ContactError.INVALID_ARGUMENT_ERROR` . **ContactFields** 값이 `"*"` 모든 연락처 필드를 반환 합니다.

**ContactFindOptions.filter** 문자열 연락처 데이터베이스를 쿼리할 때 검색 필터로 사용할 수 있습니다. 제공 된, 대/소문자, 부분 값 일치 **contactFields** 매개 변수에 지정 된 각 필드에 적용 됩니다. *모든* 지정 된 필드의 일치 하는 경우 연락처 반환 됩니다. 사용 하 여 **contactFindOptions.desiredFields** 매개 변수 속성 문의 제어를 다시 반환 해야 합니다.

### 매개 변수

*   **contactSuccess**: 연락처 개체의 배열에 표시 되는 성공 콜백 함수는 데이터베이스에서 반환 된. [필수]

*   **contactError**: 오류 콜백 함수에 오류가 발생할 때 호출 됩니다. [선택 사항]

*   **contactFields**: 검색 한정자로 사용 하는 필드에 문의. *(DOMString[])* [필수]

*   **contactFindOptions**: navigator.contacts 필터링 옵션을 검색 합니다. [선택 사항] 키 다음과 같습니다.

*   **필터**: 검색 문자열 navigator.contacts를 찾는 데 사용 합니다. *(DOMString)* (기본:`""`)

*   **여러**: 여러 navigator.contacts 찾기 작업을 반환 합니다 경우 결정 합니다. *(부울)* (기본:`false`)
    
    *   **desiredFields**: 연락처 필드를 다시 반환 합니다. 그 결과 지정 된 경우 `Contact` 만이 필드의 값을 보유 하는 개체. *(DOMString[])* [선택 사항]

### 지원 되는 플랫폼

*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8
*   윈도우 (Windows Phone 8.1 소자만 해당)

### 예를 들어

    function onSuccess(contacts) {
        alert('Found ' + contacts.length + ' contacts.');
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    // find all contacts with 'Bob' in any name field
    var options      = new ContactFindOptions();
    options.filter   = "Bob";
    options.multiple = true;
    options.desiredFields = [navigator.contacts.fieldType.id];
    var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
    navigator.contacts.find(fields, onSuccess, onError, options);
    

### 윈도우 특수

*   `__contactFields__`지원 되지 않으며 무시 됩니다. `find`메서드가 항상 이름, 이메일 주소 또는 연락처의 전화 번호를 일치 하도록 시도 합니다.

## navigator.contacts.pickContact

`navigator.contacts.pickContact`메서드가 단일 연락처 선택 문의 선택 시작. 결과 개체에 전달 되는 `contactSuccess` **contactSuccess** 매개 변수로 지정 된 콜백 함수.

### 매개 변수

*   **contactSuccess**: 단일 연락처 개체와 호출 되는 성공 콜백 함수. [필수]

*   **contactError**: 오류 콜백 함수에 오류가 발생할 때 호출 됩니다. [선택 사항]

### 지원 되는 플랫폼

*   안 드 로이드
*   iOS
*   Windows Phone 8
*   윈도우 8
*   윈도우

### 예를 들어

    navigator.contacts.pickContact(function(contact){
            console.log('The following contact has been selected:' + JSON.stringify(contact));
        },function(err){
            console.log('Error: ' + err);
        });
    

## 연락처

`Contact`개체는 사용자의 연락처를 나타냅니다. 연락처 생성 수, 저장 또는 장치 연락처 데이터베이스에서 제거 합니다. 연락처도 검색할 수 있습니다 (개별적으로 또는 일괄적으로) 데이터베이스에서 호출 하 여는 `navigator.contacts.find` 방법.

**참고**: 모든 연락처 필드 위에 나열 된 모든 장치 플랫폼에서 지원 됩니다. 자세한 내용은 각 플랫폼의 *단점이* 섹션을 확인 하시기 바랍니다.

### 속성

*   **id**: 글로벌 고유 식별자. *(DOMString)*

*   **displayName**: 최종 사용자에 게 표시에 적합이 연락처의 이름. *(DOMString)*

*   **이름**: 사람 이름의 모든 구성 요소를 포함 하는 개체. *(담당자 이름)*

*   **별명**: 캐주얼 이름 연락처 주소입니다. *(DOMString)*

*   **phoneNumbers**: 모든 연락처의 전화 번호의 배열. *(ContactField[])*

*   **이메일**: 모든 연락처의 전자 메일 주소의 배열. *(ContactField[])*

*   **주소**: 모든 연락처의 주소 배열. *(ContactAddress[])*

*   **ims**: 모든 연락처의 IM 주소 배열. *(ContactField[])*

*   **조직**: 다양 한 모든 연락처의 조직. *(ContactOrganization[])*

*   **생일**: 연락처의 생일. *(날짜)*

*   **참고**: 연락처에 대 한 참고. *(DOMString)*

*   **사진**: 연락처의 사진을 배열. *(ContactField[])*

*   **카테고리**: 모든 사용자 정의 범주 연락처에 연결 된 배열. *(ContactField[])*

*   **url**: 연락처에 연결 된 웹 페이지의 배열. *(ContactField[])*

### 메서드

*   **복제**: 새로운 반환 합니다 `Contact` 으로 호출 하는 개체의 전체 복사본은 개체는 `id` 속성으로 설정`null`.

*   **제거**: 장치 연락처 데이터베이스에서 연락처를 제거 합니다, 그렇지 않으면와 오류 콜백을 실행 한 `ContactError` 개체.

*   **저장**: 장치 연락처 데이터베이스를 새 연락처를 저장 또는 동일한 **id** 를 가진 연락처가 이미 있는 경우 기존 연락처를 업데이트 합니다.

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8
*   윈도우 8
*   윈도우

### 예를 들어 저장

    function onSuccess(contact) {
        alert("Save Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // create a new contact object
    var contact = navigator.contacts.create();
    contact.displayName = "Plumber";
    contact.nickname = "Plumber";            // specify both to support all devices
    
    // populate some fields
    var name = new ContactName();
    name.givenName = "Jane";
    name.familyName = "Doe";
    contact.name = name;
    
    // save to device
    contact.save(onSuccess,onError);
    

### 복제 예제

        // clone the contact object
        var clone = contact.clone();
        clone.name.givenName = "John";
        console.log("Original contact name = " + contact.name.givenName);
        console.log("Cloned contact name = " + clone.name.givenName);
    

### 예제 제거

    function onSuccess() {
        alert("Removal Success");
    };
    
    function onError(contactError) {
        alert("Error = " + contactError.code);
    };
    
    // remove the contact from the device
    contact.remove(onSuccess,onError);
    

### 안 드 로이드 2.X 단점

*   **카테고리**: 안 드 로이드 2.X 장치, 반환에서 지원 되지 않습니다`null`.

### 블랙베리 10 단점

*   **id**: 연락처를 저장 하면 장치에 할당 합니다.

### FirefoxOS 특수

*   **카테고리**: 부분적으로 지원 합니다. 필드 **pref** 및 **형식** 반환`null`

*   **ims**: 지원 되지 않음

*   **사진**: 지원 되지 않음

### iOS 단점

*   **displayName**: 반환 iOS에서 지원 되지 않는 `null` 가 아무 `ContactName` 지정 된,이 경우 복합 이름, **닉네임** 을 반환 합니다 또는 `""` , 각각.

*   **생일**: 자바 스크립트로 입력 해야 합니다 `Date` 개체를 같은 방식으로 반환 됩니다.

*   **사진**: 응용 프로그램의 임시 디렉터리에 저장 된 이미지 파일 URL을 반환 합니다. 응용 프로그램이 종료 될 때 임시 디렉터리의 내용은 제거 됩니다.

*   **카테고리**:이 속성은 현재 지원 되지 않습니다, 반환`null`.

### Windows Phone 7, 8 특수

*   **displayName**: 연락처를 만들 때 표시 이름에서 표시 이름 매개 변수 다릅니다 제공 값 검색 연락처를 찾을 때.

*   **url**: 연락처를 만들 때 사용자가 입력을 하나 이상의 웹 주소를 저장 하지만 하나만 사용할 수 있는 연락처를 검색할 때.

*   **phoneNumbers**: *pref* 옵션이 지원 되지 않습니다. *형식* *찾기* 작업에서 지원 되지 않습니다. 단 하나 `phoneNumber` 각 *형식* 에 대 한 허용.

*   **이메일**: *pref* 옵션이 지원 되지 않습니다. 가정 및 개인 동일한 이메일 항목 참조. 각 *형식* 에 대 한 항목이 하나만 허용.

*   **주소**: 직장, 및 가정/개인 *유형*을 지원 합니다. 가정 및 개인 *유형* 동일한 주소 항목 참조. 각 *형식* 에 대 한 항목이 하나만 허용.

*   **조직**: 하나만 허용 되 고 *pref*, *유형*및 *부서* 특성을 지원 하지 않습니다.

*   **참고**: 지원 되지 않는 반환`null`.

*   **ims**: 지원 되지 않는 반환`null`.

*   **생일**: 지원 되지 않는 반환`null`.

*   **카테고리**: 지원 되지 않는 반환`null`.

### 윈도우 특수

*   **사진**: 응용 프로그램의 임시 디렉터리에 저장 된 이미지 파일 URL을 반환 합니다.

*   **생일**: 지원 되지 않는 반환`null`.

*   **카테고리**: 지원 되지 않는 반환`null`.

## ContactAddress

`ContactAddress`개체는 연락처의 단일 주소 속성을 저장 합니다. A `Contact` 개체에 하나 이상의 주소가 포함 될 수 있습니다는 `ContactAddress[]` 배열.

### 속성

*   **pref**: 설정 `true` 이 경우 `ContactAddress` 사용자의 기본 설정된 값이 포함 됩니다. *(부울)*

*   **유형**: 예를 들어 필드, *홈* 의 어떤 종류를 나타내는 문자열. *(DOMString)*

*   **포맷**: 전체 주소 표시를 위해 서식이 지정 된. *(DOMString)*

*   **streetAddress**: 전체 주소. *(DOMString)*

*   **지역**: 구, 군 또는 도시. *(DOMString)*

*   **지역**: 상태 또는 지역. *(DOMString)*

*   **postalCode**: 우편 번호 또는 우편 번호. *(DOMString)*

*   **국가**: 국가 이름. *(DOMString)*

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8
*   윈도우 8
*   윈도우

### 예를 들어

    // display the address information for all contacts
    
    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            for (var j = 0; j < contacts[i].addresses.length; j++) {
                alert("Pref: "         + contacts[i].addresses[j].pref          + "\n" +
                    "Type: "           + contacts[i].addresses[j].type          + "\n" +
                    "Formatted: "      + contacts[i].addresses[j].formatted     + "\n" +
                    "Street Address: " + contacts[i].addresses[j].streetAddress + "\n" +
                    "Locality: "       + contacts[i].addresses[j].locality      + "\n" +
                    "Region: "         + contacts[i].addresses[j].region        + "\n" +
                    "Postal Code: "    + contacts[i].addresses[j].postalCode    + "\n" +
                    "Country: "        + contacts[i].addresses[j].country);
            }
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    // find all contacts
    var options = new ContactFindOptions();
    options.filter = "";
    var filter = ["displayName", "addresses"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### 안 드 로이드 2.X 단점

*   **pref**: 지원 되지 않는 반환 `false` 안 드 로이드 2.X 장치에.

### 블랙베리 10 단점

*   **pref**: 반환 BlackBerry 장치에서 지원 되지 않습니다`false`.

*   **유형**: 부분적으로 지원 합니다. *작업* 및 *홈* 형식 주소 각 단 하나 접촉 당 저장할 수 있습니다.

*   **포맷**: 부분적으로 지원 합니다. 모든 검은 딸기 주소 필드의 연결을 반환합니다.

*   **streetAddress**: 지원. 블랙베리 **address1** **주소 2** 의 연결 주소 필드를 반환합니다.

*   **지역**: 지원. 블랙베리 **시** 주소 필드에 저장 합니다.

*   **지역**: 지원. 블랙베리 **stateProvince** 주소 필드에 저장 합니다.

*   **postalCode**: 지원. 블랙베리 **zipPostal** 주소 필드에 저장 합니다.

*   **국가**: 지원.

### FirefoxOS 특수

*   **포맷**: 현재 지원 되지 않습니다

### iOS 단점

*   **pref**: 반환 하는 iOS 장치에서 지원 되지 않습니다`false`.

*   **포맷**: 현재 지원 되지 않습니다.

### 윈도우 8 단점

*   **pref**: 지원 되지 않음

### 윈도우 특수

*   **pref**: 지원 되지 않음

## ContactError

`ContactError`개체를 통해 사용자에 게 반환 되는 `contactError` 콜백 함수는 오류가 발생 한 경우.

### 속성

*   **코드**: 미리 정의 된 오류 코드 중 하나가 아래에 나열 된.

### 상수

*   `ContactError.UNKNOWN_ERROR` (code 0)
*   `ContactError.INVALID_ARGUMENT_ERROR` (code 1)
*   `ContactError.TIMEOUT_ERROR` (code 2)
*   `ContactError.PENDING_OPERATION_ERROR` (code 3)
*   `ContactError.IO_ERROR` (code 4)
*   `ContactError.NOT_SUPPORTED_ERROR` (code 5)
*   `ContactError.PERMISSION_DENIED_ERROR` (code 20)

## ContactField

`ContactField`개체는 재사용 가능한 구성 요소를 나타내는 필드를 일반적으로 문의. 각 `ContactField` 개체에 포함 되어 있는 `value` , `type` , 및 `pref` 속성. A `Contact` 개체에 여러 속성이 저장 `ContactField[]` 배열, 전화 번호 및 이메일 주소.

대부분의 경우에는 미리 결정 된 값에 대 한는 `ContactField` 개체의 **type** 속성. 예를 들어 전화 번호 *홈*, *작품*, *모바일*, *아이폰*또는 특정 장치 플랫폼의 연락처 데이터베이스에서 지원 되는 다른 값의 **유형** 값을 지정할 수 있습니다. 그러나는 `Contact` **사진** 필드 **유형** 필드 나타냅니다 반환 된 이미지 형식: **url** **값** 특성 **값** 이미지 base64 인코딩된 문자열을 포함 하는 경우 사진 이미지 또는 *base64* URL이 포함 된 경우.

### 속성

*   **유형**: 예를 들어 필드, *홈* 의 어떤 종류를 나타내는 문자열입니다. *(DOMString)*

*   **값**: 전화 번호 또는 이메일 주소와 같은 필드 값. *(DOMString)*

*   **pref**: 설정 `true` 이 경우 `ContactField` 사용자의 기본 설정된 값이 포함 됩니다. *(부울)*

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8
*   윈도우 8
*   윈도우

### 예를 들어

        // create a new contact
        var contact = navigator.contacts.create();
    
        // store contact phone numbers in ContactField[]
        var phoneNumbers = [];
        phoneNumbers[0] = new ContactField('work', '212-555-1234', false);
        phoneNumbers[1] = new ContactField('mobile', '917-555-5432', true); // preferred number
        phoneNumbers[2] = new ContactField('home', '203-555-7890', false);
        contact.phoneNumbers = phoneNumbers;
    
        // save the contact
        contact.save();
    

### 안 드 로이드 단점

*   **pref**: 지원 되지 않는 반환`false`.

### 블랙베리 10 단점

*   **유형**: 부분적으로 지원 합니다. 전화 번호에 대 한 사용.

*   **값**: 지원.

*   **pref**: 지원 되지 않는 반환`false`.

### iOS 단점

*   **pref**: 지원 되지 않는 반환`false`.

### Windows8 단점

*   **pref**: 지원 되지 않는 반환`false`.

### 윈도우 특수

*   **pref**: 지원 되지 않는 반환`false`.

## 담당자 이름

에 대 한 다양 한 정보를 포함 한 `Contact` 개체의 이름.

### 속성

*   **포맷**: 연락처의 전체 이름. *(DOMString)*

*   **familyName**: 연락처의 성. *(DOMString)*

*   **givenName**: 연락처의 이름. *(DOMString)*

*   **middleName**: 연락처의 중간 이름을. *(DOMString)*

*   **honorificPrefix**: 연락처의 접두사 (예: *미스터* 또는 *닥터*) *(DOMString)*

*   **honorificSuffix**: 연락처의 접미사 ( *esq.*예). *(DOMString)*

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드 2.X
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8
*   윈도우 8
*   윈도우

### 예를 들어

    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            alert("Formatted: "  + contacts[i].name.formatted       + "\n" +
                "Family Name: "  + contacts[i].name.familyName      + "\n" +
                "Given Name: "   + contacts[i].name.givenName       + "\n" +
                "Middle Name: "  + contacts[i].name.middleName      + "\n" +
                "Suffix: "       + contacts[i].name.honorificSuffix + "\n" +
                "Prefix: "       + contacts[i].name.honorificSuffix);
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    var options = new ContactFindOptions();
    options.filter = "";
    filter = ["displayName", "name"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### 안 드 로이드 단점

*   **포맷**: 부분적으로 지원 되 고 읽기 전용. 연결을 반환 합니다 `honorificPrefix` , `givenName` , `middleName` , `familyName` , 그리고`honorificSuffix`.

### 블랙베리 10 단점

*   **포맷**: 부분적으로 지원 합니다. 블랙베리 **firstName** 및 **lastName** 필드의 연결을 반환합니다.

*   **familyName**: 지원. 블랙베리 **lastName** 필드에 저장 합니다.

*   **givenName**: 지원. 블랙베리 **firstName** 필드에 저장 합니다.

*   **middleName**: 지원 되지 않는 반환`null`.

*   **honorificPrefix**: 지원 되지 않는 반환`null`.

*   **honorificSuffix**: 지원 되지 않는 반환`null`.

### FirefoxOS 특수

*   **포맷**: 부분적으로 지원 되 고 읽기 전용. 연결을 반환 합니다 `honorificPrefix` , `givenName` , `middleName` , `familyName` , 그리고`honorificSuffix`.

### iOS 단점

*   **포맷**: 부분적으로 지원 합니다. IOS 복합 이름 반환 하지만 읽기 전용입니다.

### 윈도우 8 단점

*   **형식**: 이것은 유일한 속성 이름과 동일 하다 `displayName` , 및`nickname`

*   **familyName**: 지원 되지 않음

*   **givenName**: 지원 되지 않음

*   **middleName**: 지원 되지 않음

*   **honorificPrefix**: 지원 되지 않음

*   **honorificSuffix**: 지원 되지 않음

### 윈도우 특수

*   **형식**: 그것은 동일`displayName`

## ContactOrganization

`ContactOrganization`개체를 연락처의 조직 속성을 저장 합니다. A `Contact` 개체 저장 하나 이상의 `ContactOrganization` 개체 배열에.

### 속성

*   **pref**: 설정 `true` 이 경우 `ContactOrganization` 사용자의 기본 설정된 값이 포함 됩니다. *(부울)*

*   **유형**: 예를 들어 필드, *홈* 의 어떤 종류를 나타내는 문자열입니다. _(DOMString)

*   **이름**: 조직 이름. *(DOMString)*

*   **부서**: 계약을 위해 일 하는 부서. *(DOMString)*

*   **제목**: 조직에서 연락처의 제목. *(DOMString)*

### 지원 되는 플랫폼

*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   Windows Phone 7과 8
*   윈도우 (Windows 8.1와 Windows Phone 8.1 소자만 해당)

### 예를 들어

    function onSuccess(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            for (var j = 0; j < contacts[i].organizations.length; j++) {
                alert("Pref: "      + contacts[i].organizations[j].pref       + "\n" +
                    "Type: "        + contacts[i].organizations[j].type       + "\n" +
                    "Name: "        + contacts[i].organizations[j].name       + "\n" +
                    "Department: "  + contacts[i].organizations[j].department + "\n" +
                    "Title: "       + contacts[i].organizations[j].title);
            }
        }
    };
    
    function onError(contactError) {
        alert('onError!');
    };
    
    var options = new ContactFindOptions();
    options.filter = "";
    filter = ["displayName", "organizations"];
    navigator.contacts.find(filter, onSuccess, onError, options);
    

### 안 드 로이드 2.X 단점

*   **pref**: 반환 안 드 로이드 2.X 장치에 의해 지원 되지 않습니다`false`.

### 블랙베리 10 단점

*   **pref**: 반환 블랙베리 장치에 의해 지원 되지 않습니다`false`.

*   **유형**: 반환 블랙베리 장치에 의해 지원 되지 않습니다`null`.

*   **이름**: 부분적으로 지원 합니다. 첫 번째 조직 이름 블랙베리 **회사** 필드에 저장 됩니다.

*   **부서**: 지원 되지 않는 반환`null`.

*   **제목**: 부분적으로 지원 합니다. 첫 번째 조직 제목 블랙베리 **jobTitle** 필드에 저장 됩니다.

### 파이어 폭스 OS 단점

*   **pref**: 지원 되지 않음

*   **형식**: 지원 되지 않음

*   **부서**: 지원 되지 않음

*   필드 **이름** 및 **제목** **org** 및 **jobTitle** 에 저장.

### iOS 단점

*   **pref**: 반환 하는 iOS 장치에서 지원 되지 않습니다`false`.

*   **유형**: 반환 하는 iOS 장치에서 지원 되지 않습니다`null`.

*   **이름**: 부분적으로 지원 합니다. 첫 번째 조직 이름은 iOS **kABPersonOrganizationProperty** 필드에 저장 됩니다.

*   **부서**: 부분적으로 지원 합니다. 첫 번째 부서 이름은 iOS **kABPersonDepartmentProperty** 필드에 저장 됩니다.

*   **제목**: 부분적으로 지원 합니다. 첫 번째 타이틀 iOS **kABPersonJobTitleProperty** 필드에 저장 됩니다.

### 윈도우 특수

*   **pref**: 지원 되지 않는 반환`false`.

*   **형식**: 지원 되지 않는 반환`null`.