!macro customInstall
  CreateDirectory "$APPDATA\Chat Interrogator\avatars"
  CopyFiles $INSTDIR\resources\app.asar.unpacked\resources\avatars "$APPDATA\Chat Interrogator"
!macroend