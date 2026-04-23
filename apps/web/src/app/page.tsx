import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "var(--canvas-bg)", minHeight: "calc(100vh - 72px)" }} />
    </>
  );
}
