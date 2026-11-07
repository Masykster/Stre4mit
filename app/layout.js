import { Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import NavigationBar from "./components/NavigationBar";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stre4mit - Streaming Film & Acara TV",
  description: "Menyajikan antarmuka streaming film dan serial TV modern terintegrasi TMDb API tanpa iklan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#141414] text-zinc-50 font-sans selection:bg-[#E50914] selection:text-white">
        <AppProvider>
          <NavigationBar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
