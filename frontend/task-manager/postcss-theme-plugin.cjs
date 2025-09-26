module.exports = () => {
  return {
    postcssPlugin: 'postcss-theme-plugin',
    AtRule: {
      theme: (atRule) => {
        // Keep the @theme block as is without transformation
      },
    },
  };
};
module.exports.postcss = true;
