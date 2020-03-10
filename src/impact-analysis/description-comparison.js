const { map, filter } = require('./../objects-utils.js');

const getDifference = (previousDescription, currentDescription) => {
  if (previousDescription.hash !== currentDescription.hash) {
    const previousElements = previousDescription.elements;
    const currentElements = currentDescription.elements;

    const sameElements = currentElements
      .filter((element) => previousElements
        .some(({ hash }) => element.hash === hash)
      );
    const newElements = currentElements
      .filter(({ hash }) => !sameElements
        .some((element) => element.hash === hash)
      );
    const deletedElements = previousElements
      .filter(({ hash }) => !sameElements
        .some((element) => element.hash === hash)
      );
    const disorderedElements = previousElements
      .filter(({ hash }) => sameElements
        .some((element) => element.hash === hash)
      )
      .filter(({ hash }, index) => sameElements[index].hash !== hash);

    const difference = {
      same: sameElements,
      new: newElements,
      deleted: deletedElements,
      disordered: disorderedElements
    };

    return {
      difference,
      isSame: false
    }
  }

  return {
    difference: {
      same: currentDescription.elements,
      new: [],
      deleted: [],
      disordered: []
    },
    isSame: true
  }
};

const compareDescriptions = (previousDescriptions, currentDescriptions) => (
  map(
    filter(
      currentDescriptions,
      (description, pageName) => previousDescriptions[pageName]
    ),
    (currentDescription, pageName) => {
      const previousPageDescription = previousDescriptions[pageName];

      return {
        load: getDifference(previousPageDescription.load, currentDescription.load),
        actions: map(
          filter(
            currentDescription.actions,
            (action, actionName) => previousPageDescription.actions[actionName]
          ),
          (currentActionDescription, actionName) => {
            const previousActionDescription = previousPageDescription.actions[actionName];

            return getDifference(previousActionDescription, currentActionDescription);
          }
        )
      }
    }
  )
);

module.exports = {
  compareDescriptions
};
