import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NoContextMenu } from "@/components/shared/NoContextMenu";

/**
 * Шрифты подтягиваются на этапе сборки и дальше раздаются самим приложением.
 * На площадке интернета может не быть — рантайм не должен ходить в сеть.
 * Кириллический сабсет обязателен: весь интерфейс на русском.
 */
const ui = Inter({
  variable: "--font-ui",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VORTEX·TS",
  description: "Экранный реквизит",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${ui.variable} ${code.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-zinc-950 text-zinc-200">
        <NoContextMenu />
        {children}
      </body>
    </html>
  );
}
