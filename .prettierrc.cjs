/** @type {import("prettier").Options} */
const config = {
    trailingComma: "es5",
    tabWidth: 4,

    plugins: ["@trivago/prettier-plugin-sort-imports"],

    importOrder: ["<THIRD_PARTY_MODULES>", "^node:.*$", "^@(.*)$", "^[./]"],
    importOrderParserPlugins: ["typescript", "decorators-legacy"],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
};

module.exports = config;
