module.exports = () => {
  return {
    postcssPlugin: 'postcss-theme-plugin',
    AtRule: {
      theme: (atRule) => {
        // You can choose to keep the @theme block as is or remove it
        // Here, we keep it but do not transform it, so no error occurs
        // If you want to remove it, use atRule.remove();
      },
    },
  };
};
module.exports.postcss = true;
