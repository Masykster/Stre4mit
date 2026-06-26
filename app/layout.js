import { Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import NavigationBar from "./components/NavigationBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stre4mit - Kloningan Platform Streaming Film & TV Series",
  description: "Menyajikan antarmuka streaming film dan TV series modern terintegrasi TMDb API tanpa iklan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-zinc-50 font-sans">
        <AppProvider>
          <NavigationBar />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
            <div className="max-w-6xl mx-auto px-4">
              <p>&copy; {new Date().getFullYear()} Stre4mit By Masykster </p>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
