const getImpactedPages = (difference) => (
  Object.entries(difference)
    .filter(([, value]) => (
      !value.load.isSame
      || Object.values(value.actions).some(({ isSame }) => !isSame)
    ))
    .map(([name]) => name)
);

const affectConfigByImpact = (config, impact) => ({
  ...config,
  pages: config.pages.filter(({ name }) => impact.pages.includes(name))
});

module.exports = {
  getImpactedPages,
  affectConfigByImpact
};
