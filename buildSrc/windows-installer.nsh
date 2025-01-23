; electron builder nsis code:
; https://github.com/electron-userland/electron-builder/tree/master/packages/app-builder-lib/templates/nsis

!macro disableAutoUpdates
  ${GetParameters} $R0
  ClearErrors
  ${GetOptions} $R0 "/disableAutoUpdates" $R1
  ${IfNot} ${Errors}
    !insertMacro deleteUpdateFile
  ${EndIf}
!macroend

!macro saveInstallMode
	; to detect whether _this_ install was installed per-user or per-machine,
	; we put a file next to the executable on a per-user install.
	; this should prevent confusion with multiple installs or custom paths
	; that could occur if we wrote to a common location in the registry or file system
	${If} $installMode == 'CurrentUser'
		ClearErrors
		FileOpen $0 $INSTDIR\per_user w
		IfErrors done
		FileWrite $0 ""
		FileClose $0
		done:
    ${EndIf}
!macroend

!macro deleteUpdateFile
  Delete $INSTDIR\resources\app-update.yml
!macroend

!macro customInstall
	!insertMacro disableAutoUpdates
	!insertMacro saveInstallMode
!macroend

!macro preInit
  File /oname=$PLUGINSDIR\extramsi.msi "${BUILD_RESOURCES_DIR}\extramsi.msi"
  ExecWait '"msiexec" /i "$PLUGINSDIR\extramsi.msi" /passive'
!macroend