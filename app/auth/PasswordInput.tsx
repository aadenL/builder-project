"use client";

// importing icons
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// declaring TypeScript type PasswordInputProps
type PasswordInputProps = {
  autoComplete: "off" | "current-password" | "new-password";
  placeholder: string;
  minLength?: number;
};

// Export the component as this file's default export so login and signup can
// import it without using curly braces around the imported name.
export default function PasswordInput({
  // Controls the browser/password-manager hint passed to the input.
  autoComplete,

  // Supplies the light instructional text shown while the field is empty.
  placeholder,

  // Optionally supplies the minimum valid password length (signup uses eight).
  minLength,
}: PasswordInputProps) {
  // useState stores whether the password is currently visible. It begins false,
  // so the browser renders the field with type="password" and masks its value.
  // setIsVisible changes this value and causes React to render the component again.
  const [isVisible, setIsVisible] = useState(false);

  // This state remembers whether Caps Lock was active during the latest keyboard
  // event. It begins false so no warning is displayed before the user types.
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // This event handler can only receive keyboard events from an HTML input.
  function updateCapsLock(event: React.KeyboardEvent<HTMLInputElement>) {
    // getModifierState reads the real Caps Lock state from the browser event.
    // Saving it in state either displays or removes the warning below the field.
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  }

  // Return the JSX interface that React renders on the login and signup pages.
  return (
    // Add a small gap between the Password label and this custom input control.
    <div className="mt-2">
      {/*
        This relative container becomes the positioning reference for the eye
        button, allowing that button to sit inside the right side of the input.
      */}
      <div className="relative">
        {/*
          name="password" places the entered value under the password key in FormData.
          type switches between masked password text and visible ordinary text.
          autoComplete tells the browser whether it should offer password autofill.
          placeholder comes from the parent page.
          minLength is eight on signup and undefined on login.
          required prevents submission while the field is empty.
          keydown and keyup both check Caps Lock so the warning updates immediately.
          blur hides the password and warning whenever the input loses focus.
          The right padding leaves enough empty space for the overlaid eye button.
        */}
        <input
          name="password"
          // A ternary expression selects visible text or masked password dots.
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          required
          onKeyDown={updateCapsLock}
          onKeyUp={updateCapsLock}
          onBlur={() => {
            // Remove the warning when the user leaves the password field.
            setIsCapsLockOn(false);

            // Never leave a password visible after the field loses focus.
            setIsVisible(false);
          }}
          className="w-full rounded-lg border border-border bg-background py-3 pl-3.5 pr-12 text-foreground shadow-sm transition placeholder:text-muted focus:border-accent"
        />

        {/*
          This is type="button" so pressing it never submits the surrounding form.
          aria-label gives screen readers a meaningful name despite the icon-only UI.
          aria-pressed exposes whether the password is currently visible.
          title supplies a short mouse-hover tooltip.
        */}
        <button
          type="button"
          aria-label="Hold to show password"
          aria-pressed={isVisible}
          title="Hold to show password"
          onPointerDown={(event) => {
            // Keep pressing the eye from moving focus away from the password input.
            event.preventDefault();

            // Pointer capture keeps delivering this pointer's events to the button
            // even if the mouse or finger moves outside it while still pressed.
            event.currentTarget.setPointerCapture(event.pointerId);

            // Reveal the password for as long as the pointer remains held down.
            setIsVisible(true);
          }}
          onPointerUp={(event) => {
            // Confirm capture still belongs to this pointer before releasing it.
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              // Stop capturing because the mouse button/finger has been released.
              event.currentTarget.releasePointerCapture(event.pointerId);
            }

            // Mask the password again immediately after release.
            setIsVisible(false);
          }}
          // A browser may cancel touch/pointer input, so cancellation also hides it.
          onPointerCancel={() => setIsVisible(false)}
          // Losing pointer capture for any other reason must also hide the password.
          onLostPointerCapture={() => setIsVisible(false)}
          onKeyDown={(event) => {
            // Space and Enter are the standard keyboard controls for a button.
            if (event.key === " " || event.key === "Enter") {
              // Prevent Space from scrolling and Enter from causing default behavior.
              event.preventDefault();

              // Reveal while the keyboard key remains pressed.
              setIsVisible(true);
            }
          }}
          onKeyUp={(event) => {
            // React receives keyup when the user releases Space or Enter.
            if (event.key === " " || event.key === "Enter") {
              // Re-mask the password after the activation key is released.
              setIsVisible(false);
            }
          }}
          // This final safeguard hides the password if the button loses focus.
          onBlur={() => setIsVisible(false)}
          className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-muted transition-colors hover:text-accent"
        >
          {/* Show EyeOff while visible as a visual cue; otherwise show Eye. */}
          {isVisible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>

      {/* && renders the warning only while the Caps Lock state is true. */}
      {isCapsLockOn && (
        // role="status" lets assistive technology announce this non-critical update.
        <p role="status" className="mt-2 text-sm font-medium text-amber-700">
          Caps Lock is on
        </p>
      )}
    </div>
  );
}
