#include "plugin.h"
#include "tokenizer.h"

#ifdef _WINDOWS
#include <windows.h>
BOOL APIENTRY DllMain( HANDLE hModule,
                       DWORD ul_reason_for_call,
                       LPVOID lpReserved )
{
    return TRUE;
}
#else
#include <errno.h>
#include <string.h>

extern int errno;
#endif

SendPluginEv SendPluginEvent;

string g_GetSysErrMsg( void )
{
    string strError = "Unknown";
    // Problem loading
#ifdef _WINDOWS
    int nErrorCode = GetLastError();
    LPTSTR s;
    if ( ::FormatMessage( FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM,
    NULL, nErrorCode, 0, ( LPTSTR ) &s, 0, NULL ) )
    {
        strError = s;
    }
    else
    {
        char szBuf[ 20 ];
        _snprintf_s( szBuf, _countof(szBuf), 19, "%d", nErrorCode );
        strError = szBuf;
    }
#else
    char szError[80];
    if ( strerror_r( errno, szError, sizeof(szError)  ) )
    {
        strError = "no description found";
    }
    else
    {
        strError = szError;
    }
#endif
    return strError;
}

void g_sleep( unsigned int mseconds )
{
#ifdef _WINDOWS
    Sleep( mseconds );
#else
    usleep( mseconds * 1000 );
#endif
}

string& g_trim( string& str )
{
    // Whitespace characters
    char whspc[] = " \t\r\n\v\f";

    // Whack off first part
    size_t pos = str.find_first_not_of( whspc );

    if ( pos != string::npos )
        str.replace( 0, pos, "" );

    // Whack off trailing stuff
    pos = str.find_last_not_of( whspc );

    if ( pos != string::npos )
        str.replace( pos + 1, str.length() - pos, "" );

    return str;
}

void g_tokenize( const string& str, const string& delimiters, vector<string>& tokens )
{
    tokenize( str, tokens, delimiters );
}

char* SetEventFunc( SendPluginEv funcPtr )
{
    static char * szObjList = onGetObjList();
    SendPluginEvent = funcPtr;
    return szObjList;
}


const int nMAXSIZE = 512;
char* g_pszRetVal = NULL;

//-----------------------------------------------------------
// Map from an object Id to an object instance
//-----------------------------------------------------------
typedef std::map<string, JSExt*> StringToJExt_T;

//-----------------------------------------------------------
// Map from a browser context to an id mapping
//-----------------------------------------------------------
typedef std::map<void*, StringToJExt_T*> VoidToMap_T;

VoidToMap_T g_context2Map;

class GlobalSharedModule
{

public:
    GlobalSharedModule( void )
    {
        g_pszRetVal = new char[ nMAXSIZE ];
    }

    ~GlobalSharedModule()
    {
        delete [] g_pszRetVal;

        VoidToMap_T::iterator posMaps;

        for ( posMaps = g_context2Map.begin(); posMaps != g_context2Map.end(); ++posMaps )
        {
            StringToJExt_T& id2Obj = *posMaps->second;
            StringToJExt_T::iterator posMap;

            for ( posMap = id2Obj.begin(); posMap != id2Obj.end(); ++posMap )
            {
                JSExt* pJSExt = posMap->second;

                if ( pJSExt->CanDelete() )
                {
                    delete pJSExt;
                }
            }

            id2Obj.erase( id2Obj.begin(), id2Obj.end() );
        }

        g_context2Map.erase( g_context2Map.begin(), g_context2Map.end() );
    }
};

GlobalSharedModule g_sharedModule;

char* g_str2global( const string& strRetVal )
{
    int nLen = strRetVal.size();

    if ( nLen >= nMAXSIZE )
    {
        delete [] g_pszRetVal;
        g_pszRetVal = new char[ nLen + 1 ];
    }

    else
    {
        // To minimaize the number of memory reallocations, the assumption
        // is that in most times this will be the case
        delete [] g_pszRetVal;
        g_pszRetVal = new char[ nMAXSIZE ];
    }

    strcpy( g_pszRetVal, strRetVal.c_str() );
    return g_pszRetVal;
}

bool g_unregisterObject( const string& strObjId, void* pContext )
{
    // Called by the plugin extension implementation
    // if the extension handles the deletion of its object

    StringToJExt_T * pID2Obj = NULL;

    VoidToMap_T::iterator iter = g_context2Map.find( pContext );

    if ( iter != g_context2Map.end() )
    {
        pID2Obj = iter->second;
    }
    else
    {
        return false;
    }

    StringToJExt_T& mapID2Obj = *pID2Obj;

    StringToJExt_T::iterator r = mapID2Obj.find( strObjId );

    if ( r == mapID2Obj.end() )
    {
        return false;
    }

    mapID2Obj.erase( strObjId );
    return true;
}

char* InvokeFunction( const char* szCommand, void* pContext )
{
    StringToJExt_T * pID2Obj = NULL;

    VoidToMap_T::iterator iter = g_context2Map.find( pContext );

    if ( iter != g_context2Map.end() )
    {
        pID2Obj = iter->second;
    }
    else
    {
        pID2Obj = new StringToJExt_T;
        g_context2Map[ pContext ] = pID2Obj;
    }

    StringToJExt_T& mapID2Obj = *pID2Obj;

    string strFullCommand = szCommand;
    vector<string> arParams;
    g_tokenize( strFullCommand, " ", arParams );
    string strCommand = arParams[ 0 ];
    string strRetVal = szERROR;

    if ( strCommand == szCREATE )
    {
        string strClassName = arParams[ 1 ];
        string strObjId = arParams[ 2 ];

        StringToJExt_T::iterator r = mapID2Obj.find( strObjId );

        if ( r != mapID2Obj.end() )
        {
            strRetVal += strObjId;
            strRetVal += " :Object already exists.";
            return g_str2global( strRetVal );
        }

        JSExt* pJSExt = onCreateObject( strClassName, strObjId );

        if ( pJSExt == NULL )
        {
            strRetVal += strObjId;
            strRetVal += " :Unknown object type ";
            strRetVal += strClassName;
            return g_str2global( strRetVal );
        }

        pJSExt->m_pContext = pContext;
        mapID2Obj[ strObjId ] = pJSExt;

        strRetVal = szOK;
        strRetVal += strObjId;
        return g_str2global( strRetVal );
    }
    else
    if ( strCommand == szINVOKE )
    {
        string strObjId = arParams[ 1 ];
        string strMethod = arParams[ 2 ];

        StringToJExt_T::iterator r = mapID2Obj.find( strObjId );

        if ( r == mapID2Obj.end() )
        {
            strRetVal += strObjId;
            strRetVal += " :No object found for id.";
            return g_str2global( strRetVal );
        }

        JSExt* pJSExt = r->second;

        size_t nLoc = strFullCommand.find( strObjId );

        if ( nLoc == string::npos )
        {
            strRetVal += strObjId;
            strRetVal += " :Internal InvokeMethod error.";
            return g_str2global( strRetVal );
        }

        if ( strMethod == szDISPOSE )
        {
            StringToJExt_T::iterator r = mapID2Obj.find( strObjId );

            if ( r == mapID2Obj.end() )
            {
                strRetVal = szERROR;
                strRetVal += strObjId;
                return g_str2global( strRetVal );
            }

            JSExt * pJSExt = mapID2Obj[ strObjId ];

            if ( pJSExt->CanDelete() )
            {
                delete pJSExt;
            }

            mapID2Obj.erase( strObjId );
            strRetVal = szOK;
            strRetVal += strObjId;
            return g_str2global( strRetVal );
        }

        size_t nSuffixLoc = nLoc + strObjId.size();
        string strInvoke = strFullCommand.substr( nSuffixLoc );
        strInvoke = g_trim( strInvoke );
        strRetVal = pJSExt->InvokeMethod( strInvoke );
        return g_str2global( strRetVal );
    }

    strRetVal += " :Unknown command ";
    strRetVal += strCommand;
    return g_str2global( strRetVal );
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

