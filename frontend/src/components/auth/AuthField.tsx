import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthField({ label, id, className = "", ...props }: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = props.type === "password";
  const inputType = isPassword && isPasswordVisible ? "text" : props.type;

  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </span>
      <span className="relative mt-2 block">
        <input
          id={id}
          className={`w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-neutral-400 hover:border-neutral-500 focus:border-black focus:ring-4 focus:ring-neutral-200 ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
          type={inputType}
        />
        {isPassword && <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-500 transition hover:text-black" aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible}>{isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
      </span>
    </label>
  );
}
