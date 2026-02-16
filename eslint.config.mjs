import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    ignores: ["dist/*"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    settings: {
      "import-x/resolver": {
        node: {
          moduleDirectory: ["node_modules", "src/"]
        },
        typescript: {
          alwaysTryTypes: true
        }
      }
    },
    rules: {
      "import-x/no-named-as-default-member": "off",
      "import-x/prefer-default-export": "off",
      "import-x/extensions": "off",
      "no-shadow": "off",
      "no-use-before-define": "off",
      "consistent-return": "off",
      "class-methods-use-this": "off",
      "prettier/prettier": [
        "error",
        {
          printWidth: 85,
          singleQuote: false,
          tabWidth: 2,
          semi: true,
          endOfLine: "auto",
          trailingComma: "none"
        }
      ]
    }
  }
);
