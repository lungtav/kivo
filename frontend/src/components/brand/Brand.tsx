import { Link } from "react-router-dom";
import kivoLogo from "../../assets/kivo-logo.jfif";

type BrandProps = {
  light?: boolean;
  className?: string;
};

export function Brand({ light = false, className = "" }: BrandProps) {
  return (
    <Link
      to="/"
      aria-label="Kivo home"
      className={`group inline-flex items-center ${className}`}
    >
      <img
        src={kivoLogo}
        alt=""
        className="size-9 rounded-xl object-contain grayscale transition-transform duration-300 group-hover:scale-105"
      />
      <span
        className={`ml-2.5 text-xl font-bold tracking-[-0.04em] ${
          light ? "text-white" : "text-[#0B1020]"
        }`}
      >
        kivo
      </span>
    </Link>
  );
}
