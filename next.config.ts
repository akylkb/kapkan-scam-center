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

  /*
    В dev Next 16 отдаёт /_next/* только своему origin: экран, открытый
    с соседней машины по http://<ip>:3000, получает на чанках 403
    Unauthorized. Страница при этом рисуется, но JS не грузится — в кадре
    это выглядит как «клики не работают». Ключ dev-only, на `output: export`
    не влияет.
  */
  allowedDevOrigins: ["192.168.1.*", "10.*", "172.16.*", "*.local"],
};

export default nextConfig;
