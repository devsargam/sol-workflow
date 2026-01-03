import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="max-w-md flex items-center py-12 mx-auto">
        <h1 className="text-center text-6xl font-semibold">Sol Workflow</h1>
      </main>
    </>
  );
}
