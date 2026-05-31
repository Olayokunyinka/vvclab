import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex cursor-pointer items-center gap-2">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="24" height="24" rx="6" fill="#e53e3e" />
        <path d="M9.5 7.5L17 12L9.5 16.5V7.5Z" fill="#ffffff" />
      </svg>
      <span className="text-[16px] font-semibold text-white">VVCLab</span>
    </Link>
  );
}

export default Logo;