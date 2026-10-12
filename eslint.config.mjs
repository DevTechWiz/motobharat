import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated — never lint the CF worker bundle, wrangler state,
    // dependency patches, or generated env types.
    ".open-next/**",
    ".wrangler/**",
    "patches/**",
    "cloudflare-env.d.ts",
  ]),
]);

export default eslintConfig;
