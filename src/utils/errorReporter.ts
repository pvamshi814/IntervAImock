export async function reportErrorToDeveloper(context: string, error: any) {
  if (!error) return;

  const errorMessage = error instanceof Error ? error.message : 
                       (typeof error === 'string' ? error : JSON.stringify(error));
  const errorStack = error instanceof Error ? error.stack : 'N/A';
  
  try {
    const payload = {
      _subject: `New Application Error: ${context} on IntervAI!`,
      _template: "box",
      Context: context,
      "Error Message": errorMessage,
      "Stack Trace": errorStack,
      URL: window.location.href,
      Time: new Date().toLocaleString(),
      Browser: navigator.userAgent
    };
    
    // We use FormSubmit's AJAX api to seamlessly post an email alert without user form submission.
    await fetch("https://formsubmit.co/ajax/uyyalasanjay05@gmail.com", {
      method: "POST",
      headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Failed to implicitly report error to developer.", e);
  }
}
