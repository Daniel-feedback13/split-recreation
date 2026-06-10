import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import _import from "eslint-plugin-import";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      "**/node_modules",
      "**/public",
      "**/.next",
      "**/*.config.js",
      "**/sentry.*.config.ts",
      "**/*.config.mjs",
      "**/.eslintcache",
      "**/.eslintrc.js",
      "**/dist",
      "**/build",
      "**/coverage",
      "**/.git",
      "**/*.stories.tsx",
      "**/*.stories.ts",
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "airbnb",
      "airbnb/hooks",
      "airbnb-typescript",
      "plugin:prettier/recommended",
      "prettier",
    ),
  ),
  {
    plugins: {
      import: fixupPluginRules(_import),
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      prettier: fixupPluginRules(prettier),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        project: [path.resolve(__dirname, "./tsconfig.json")],
        tsconfigRootDir: path.resolve(__dirname),
        // 성능 최적화를 위한 옵션
        cacheLifetime: {
          glob: "Infinity",
        },
      },
    },

    settings: {
      "import/resolver": {
        node: {
          extensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx", ".d.ts"],
          moduleDirectory: ["node_modules"],
        },

        typescript: {
          alwaysTryTypes: true,
          project: ["tsconfig.json", "**/*/tsconfig.json"],
        },
      },

      "import/internal-regex": "^(@design-system|@shared)/",

      "import/extensions": [".js", ".mjs", ".jsx", ".ts", ".tsx", ".d.ts"],
    },

    rules: {
      "getter-return": ["off"],
      "no-inner-declarations": ["error", "both"],
      "no-unmodified-loop-condition": ["error"],
      "no-use-before-define": ["error"],
      "require-atomic-updates": ["error"],
      "consistent-return": ["warn"],
      curly: ["warn"],
      "default-case-last": ["warn"],
      "default-param-last": ["warn"],

      "new-cap": [
        "warn",
        {
          capIsNewExceptions: ["Config"],
        },
      ],

      "no-console": [
        "warn",
        {
          allow: ["warn", "error", "info"],
        },
      ],

      "no-delete-var": ["warn"],
      "no-empty-function": ["error"],
      "no-eval": ["warn"],
      "no-extra-boolean-cast": ["warn"],
      "no-implicit-coercion": ["warn"],
      "no-implied-eval": ["warn"],
      "no-loop-func": ["warn"],
      "no-multi-assign": ["warn"],
      "no-nested-ternary": ["warn"],
      "no-nonoctal-decimal-escape": ["off"],
      "no-octal": ["off"],
      "no-return-assign": ["warn"],
      "no-script-url": ["warn"],

      "no-shadow": [
        "error",
        {
          allow: ["state", "getters"],
        },
      ],

      "no-useless-catch": ["warn"],
      "no-with": ["off"],
      "prefer-const": ["warn"],
      "prefer-exponentiation-operator": ["warn"],
      "prefer-template": ["warn"],
      "require-await": ["error"],
      "require-yield": ["off"],

      "no-multiple-empty-lines": [
        "error",
        {
          max: 1,
        },
      ],

      "comma-spacing": [
        "error",
        {
          before: false,
          after: true,
        },
      ],

      "computed-property-spacing": ["error"],

      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
      ],

      "linebreak-style": ["error", "unix"],

      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "never",
          mjs: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
        },
      ],

      "import/no-extraneous-dependencies": [
        "warn",
        {
          packageDir: [
            path.resolve(__dirname),
            path.resolve(__dirname, "/apps/storybook"),
            ".",
          ],
        },
      ],

      "import/newline-after-import": ["warn"],

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
            "unknown",
          ],

          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "{next,next/**}",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "object",
              position: "before",
            },
            {
              pattern: "{@design-system/**/*.{css,scss},./*.{css,scss}}",
              group: "unknown",
              position: "after",
            },
          ],

          pathGroupsExcludedImportTypes: ["react", "next", "type"],

          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      "react/react-in-jsx-scope": ["off"],
      "react/require-default-props": ["off"],
      "react/jsx-props-no-spreading": ["off"],
      "jsx-a11y/label-has-associated-control": [
        2,
        {
          assert: "either",
          depth: 5,
        },
      ],
      "no-underscore-dangle": ["off"],
      "no-alert": ["off"],
    },
  },
];
