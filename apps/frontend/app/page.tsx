import Nav from "../components/landing/Nav";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import ProductPreview from "../components/landing/ProductPreview";
import Benefits from "../components/landing/Benefits";
import FinalCta from "../components/landing/FinalCta";
import Footer from "../components/landing/Footer";
import PdfDevHarness from "../components/chat/PdfDevHarness";
import Dashboard from "./dashboard/page";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.pdfdev === "1") {
    return <PdfDevHarness />;
  }
  if (params.dashdev === "1") {
    return <Dashboard />;
  }

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProductPreview />
        <HowItWorks />
        <Benefits />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
