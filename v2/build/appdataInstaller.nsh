!macro customInstall
  CreateDirectory "$APPDATA\Chat Interrogator\config"
  CopyFiles $INSTDIR\resources\app.asar.unpacked\config "$APPDATA\Chat Interrogator"
!macroend