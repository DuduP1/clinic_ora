import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRM מאחורי התחברות: כל המסכים דינמיים לפי המשתמשת, ולכן Cache Components כבוי.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
