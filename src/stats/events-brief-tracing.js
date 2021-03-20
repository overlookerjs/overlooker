const { getExpandedMainThreadEventsTree } = require('./events-profile-chunks.js');
const zlib = require('zlib');

const walk = (treeList, cb) => {
  treeList.forEach((child) => {
    cb(child);

    if (child.children) {
      walk(child.children, cb);
    }
  });
};

const filter = (treeList, cb) => {
  return treeList.filter(cb).map((child) => ({
    ...child,
    children: child.children && child.children.length ? filter(child.children, cb) : undefined
  }));
};

const map = (treeList, cb) => {
  return treeList.map((child) => cb({
    ...child,
    children: child.children && child.children.length ? map(child.children, cb) : undefined
  }));
};

const change = (tree, condition, cb) => {
  let index = 0;

  while (index < tree.length) {
    const node = tree[index];

    if (condition(node)) {
      if (node.children) {
        const isChanged = change(node.children, condition, cb);

        if (!isChanged) {
          cb(node);
        }
      } else {
        cb(node);
      }

      return true;
    }

    index++;
  }

  return false;
}

const includedCategories = [
  'RunTask',
  'JSFrame',
  'EventDispatch',
  'CommitLoad',
  'EvaluateScript',
  'v8.compile',
  'MinorGC',
  'ParseHTML',
  'XHRReadyStateChange',
  'ParseAuthorStyleSheet',
  'FunctionCall',
  'RunMicrotasks',
  'XHRLoad',
  'UpdateLayoutTree',
  'Layout',
  'UpdateLayerTree',
  'Paint',
  'UpdateLayer',
  'CompositeLayers',
  'FireAnimationFrame',
  'MajorGC',
  'PaintImage',
  'HitTest',
  'TimerFire',
  'FireIdleCallback'
];

const processTracingTree = (events) => map(
  filter(
    events,
    ({ event }) => includedCategories.includes(event.name) && event.dur && event.dur > 0 && event.ts > -100000
  ),
  (node) => ({
    data: node.event.args,
    start: node.event.ts / 1000,
    duration: node.event.dur / 1000,
    type: node.event.name,
    name: getEventName(node.event),
    children: node.children,
  })
);

const getEventName = (event) => {
  switch (event.name) {
    case 'JSFrame':
      return event.args.functionName || '(anonymous)';
    default:
      return event.name;
  }
}

const mergeTrees = (target, tree) => {
  tree.forEach((leaf) => {
    change(
      target,
      ({ start, duration }) => (
        leaf.start >= start && leaf.start + leaf.duration <= start + duration
      ),
      (node) => {
        if (node.children) {
          node.children.push(leaf);
        } else {
          node.children = [leaf];
        }
      }
    )
  });

  return target;
};

const gzipBriefTracing = async (tracing) => {
  return new Promise((resolve, reject) => zlib.gzip(Buffer.from(JSON.stringify(tracing)), {}, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  }));
}

const getBriefTracing = async (mainEvents, otherEvents, firstEvent, config) => {
  const { tracing } = config;

  if (tracing) {
    const expandedMainThreadEventsTree = getExpandedMainThreadEventsTree(mainEvents, otherEvents, firstEvent);
    const briefTracing = processTracingTree(expandedMainThreadEventsTree);

    switch (tracing) {
      case 'zip':
        return await gzipBriefTracing(briefTracing);
      default:
        return briefTracing;
    }
  }

  return null;
}

module.exports = {
  getBriefTracing,
  processTracingTree,
  walk,
  filter,
  map,
  change
};
