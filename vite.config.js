import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function homeStaticRoute() {
  function rewriteHomeRequest(server) {
    server.middlewares.use((request, _response, next) => {
      const path = request.url?.split("?")[0];

      if (path === "/home" || path === "/home/") {
        request.url = request.url.replace(path, "/home/index.html");
      }

      next();
    });
  }

  return {
    name: "home-static-route",
    configurePreviewServer: rewriteHomeRequest,
    configureServer: rewriteHomeRequest,
  };
}

export default defineConfig({
  plugins: [homeStaticRoute(), react()],
});
