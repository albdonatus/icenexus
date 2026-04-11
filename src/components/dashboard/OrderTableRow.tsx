"use client";

import { useRouter } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
}

export default function OrderTableRow({ href, children }: Props) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
    >
      {children}
    </tr>
  );
}
