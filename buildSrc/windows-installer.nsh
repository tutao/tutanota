!macro disableAutoUpdates
  ${GetParameters} $R0
  ClearErrors
  ${GetOptions} $R0 "/disableAutoUpdates" $R1
  ${IfNot} ${Errors}
    !insertMacro deleteUpdateFile
  ${EndIf}
!macroend

!macro deleteUpdateFile
  Delete $INSTDIR\resources\app-update.yml
!macroend

!macro customInstall
	!insertMacro disableAutoUpdates
!macroend
