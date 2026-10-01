import Image from "next/image";

export default function Logo({
  name,
  logo,
  className = "",
}: {
  name: string;
  logo: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <Image src={logo} alt="" width={28} height={28} unoptimized />
      {name}
    </span>
  );
}
