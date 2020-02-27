const {map} = require('../objects-utils.js');

const describePage = ({ content, profile }) => {

};

const describePages = (profilesWithContent) => map(
  profilesWithContent,
  (profileWithContent) => describePage(profileWithContent)
);

module.exports = {
  describePage,
  describePages
};
