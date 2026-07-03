"use client";

import dynamic from "next/dynamic";

const NetworkBanner = dynamic(
  () => import("./NetworkBanner").then((mod) => mod.NetworkBanner),
  { ssr: false }
);
const Navbar = dynamic(
  () => import("./Navbar").then((mod) => mod.Navbar),
  { ssr: false }
);

export function Header() {
  return (
    <>
      <NetworkBanner />
      <Navbar />
    </>
  );
}
