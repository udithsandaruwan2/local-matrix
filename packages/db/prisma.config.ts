import { defineConfig, loadEnvFile } from "@prisma/config";

loadEnvFile();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    directUrlEnvVarName: "DIRECT_URL",
  },
});
