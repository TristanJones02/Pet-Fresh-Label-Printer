; Custom installer configurations

; Custom welcome page
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to Pet Fresh Label Printer"
  !define MUI_WELCOMEPAGE_TEXT "This software is intended solely for internal use within Neicha Australia PTY LTD, trading as Pet Fresh. It integrates with the Pet Fresh Warehouse Management System to access the product database and print labels using a Zebra Label Printer.$\r$\n$\r$\nThis application is not to be distributed, copied, or used outside the company under any circumstances.$\r$\n$\r$\nBy continuing this setup, you acknowledge and agree to these terms.$\r$\n$\r$\nFor support or questions, please contact tristan@petfresh.com.au."
!macroend

; Custom finish page with run at startup option only
!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "Installation Complete"
  
  ; Disable run after finish
  !define MUI_FINISHPAGE_RUN ""
  !define MUI_FINISHPAGE_RUN_NOTCHECKED
  
  ; Add checkbox for startup
  !define MUI_FINISHPAGE_SHOWREADME ""
  !define MUI_FINISHPAGE_SHOWREADME_CHECKED
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Run at startup"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION registerAutoStart
!macroend

; Function to register app to run at startup
Function registerAutoStart
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" '"$INSTDIR\${APP_FILENAME}.exe"'
FunctionEnd 