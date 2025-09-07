import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/images/logo.png"
      alt="One Stop Logo"
      width={70}
      height={70}
      priority
      data-ai-hint="logo"
    />
  );
}
