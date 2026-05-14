import Image from "next/image";
import { cn } from "@/lib/utils";
import logoPic from "@/public/logo.png";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 32, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image 
        src={logoPic} 
        alt="MyAssets Logo" 
        width={size} 
        height={size} 
        className="object-contain w-auto h-auto max-w-full max-h-full"
        priority
      />
      {showText && (
        <span className="font-bold text-xl tracking-tight text-[#166534]">
          MyAssets
        </span>
      )}
    </div>
  );
}
