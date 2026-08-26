import type { NextConfig } from "next";

/**
 * Статический экспорт: `npm run build` кладёт в out/ готовые HTML,
 * которые раздаёт любой локальный сервер — без Node на площадке.
 *
 * trailingSlash обязателен: иначе Next пишет out/crm/7.html, и простые
 * серверы (python3 -m http.server) не отдают его по адресу /crm/7/.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
