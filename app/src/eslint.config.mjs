import jsdoc from "eslint-plugin-jsdoc";
import { defineConfig, globalIgnores } from "eslint/config";
// import globals from "globals";
import eslint from 'typescript-eslint';


const config = defineConfig([
  // #region Common settings
  globalIgnores([
    "**/*.js",
    "**/*.d.ts",
    "eslint.config.mjs"
  ]),
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // ...globals.browser,
        // ...globals.node,
      },
      parser: eslint.parser,
      parserOptions: {
        projectService: {
          defaultProject: "tsconfig.json"
        }
      },
    },
  },
  // #endregion

  // #region JS doc settings
  {
    ...jsdoc.configs["flat/recommended"],
    rules: {
      ...jsdoc.configs["flat/recommended"].rules,
      "jsdoc/require-jsdoc": [
        "warn",
        {
          "require": {
            "ArrowFunctionExpression": true,
            "ClassDeclaration": true,
            "ClassExpression": true,
            "FunctionDeclaration": true,
            "FunctionExpression": true,
            "MethodDefinition": true
          },
          "contexts": [
            "Property",
            "ClassProperty:not([accessibility=\"private\"])",
            "TSPropertySignature",
            "TSMethodSignature",
            "TSEnumDeclaration",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "-TSPropertySignature",
            "ExportNamedDeclaration",
            // @see https://github.com/gajus/eslint-plugin-jsdoc/issues/640
            // @see https://github.com/gajus/eslint-plugin-jsdoc/issues/496#issuecomment-591204300
            // @see https://astexplorer.net
            "ArrowFunctionExpression",
            "ClassDeclaration",
            "ClassExpression",
            "FunctionDeclaration", // function
            "FunctionExpression",
            "MethodDefinition",
            "TSDeclareFunction", // function without body
            "TSModuleDeclaration" // namespace
            // "VariableDeclaration"
          ],
          "checkGetters": true,
          "checkSetters": true,
          "exemptEmptyConstructors": false
        }
      ],
      "jsdoc/newline-after-description": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": ["warn", {
        "checkGetters": false
      }],
      "jsdoc/require-returns-type": "off",
      "jsdoc/no-undefined-types": "warn",
    }
  },
  // #endregion

  // #region Typescript settings
  // Contains `typescript-eslint/recommended-type-checked` and `typescript-eslint/eslint-recommended`.
  ...eslint.configs.recommendedTypeChecked,
  {
    // Custom rules
    name: "Custom rules",
    rules: {
      // "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        // args: "all",
        // argsIgnorePattern: "^_",
        // caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        // destructuredArrayIgnorePattern: "^_",
        // varsIgnorePattern: "^_",
        // ignoreRestSiblings: true
      }],
      "@typescript-eslint/restrict-template-expressions": ["off", {
        allowBoolean: true,
        allowAny: true,
      }],
      "@typescript-eslint/no-unused-expressions": ["error", {
        allowShortCircuit: true,
        allowTernary: true
      }],
      "no-case-declarations": "off",
      "quotes": ["error", "double"],
      // "semi": ["error", "always"],
      // "multiline-ternary": ["off",
      //   "always",
      //   "always-multiline",
      //   "never"
      // ],
    },
  }
  // #endregion
]);

// console.log(config);
export default config;
