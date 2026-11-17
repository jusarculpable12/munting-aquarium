import type { Metadata, Viewport } from "next";
import "./style.css";
import "./book.css";
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export const metadata: Metadata = { title: "Munting Aquarium", description: "A cozy Filipino fishkeeping and fish shop game." };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

