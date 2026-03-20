//! Ask macOS to show TCC prompts for global input (Accessibility + Input Monitoring).
//! See: <https://developer.apple.com/documentation/applicationservices/1459115-axisprocesstrustedwithoptions>

use core_foundation::base::TCFType;
use core_foundation::boolean::CFBoolean;
use core_foundation::dictionary::CFDictionary;
use core_foundation::string::CFString;
use core_foundation_sys::dictionary::CFDictionaryRef;

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> u8;
}

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightListenEventAccess() -> u8;
    fn CGRequestListenEventAccess() -> u8;
}

/// Shows the system dialogs when access is missing. Safe to call multiple times.
pub fn request_global_input_permissions() {
    let key = CFString::new("AXTrustedCheckOptionPrompt");
    let prompt_on = CFBoolean::true_value();
    let options = CFDictionary::from_CFType_pairs(&[(key, prompt_on)]);

    unsafe {
        let _already_trusted = AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef());
    }

    unsafe {
        if CGPreflightListenEventAccess() == 0 {
            let _ = CGRequestListenEventAccess();
        }
    }
}
