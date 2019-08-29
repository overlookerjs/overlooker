const findNodePaintEvents = (events, node) => (
  events.filter(({ name, args }) => (
    (
      name === 'PaintImage' || name === 'Paint'
    ) && args.data && args.data.nodeId && (
      node.backendNodeId === args.data.nodeId
    )
  ))
);

const getPaintEventsBySelector = async (client, events, selector) => {
  try {
    const { root: { nodeId: rootNodeId } } = await client.send('DOM.getDocument');

    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: rootNodeId,
      selector
    });

    if (typeof nodeId === 'number') {
      const node = await client.send('DOM.describeNode', { nodeId }).then(({ node }) => node);

      return node ? findNodePaintEvents(events, node) : [];
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
};

module.exports = { getPaintEventsBySelector };
