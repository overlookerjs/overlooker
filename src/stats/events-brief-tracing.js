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

const gzip = async (data) => {
  return new Promise((resolve, reject) => zlib.gzip(Buffer.from(JSON.stringify(data)), {}, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  }));
}

const getBriefTracing = async (mainEvents, otherEvents, firstEvent) => {
  const expandedMainThreadEventsTree = getExpandedMainThreadEventsTree(mainEvents, otherEvents, firstEvent);

  return processTracingTree(expandedMainThreadEventsTree);
}


const getIntervals = (firstColor, secondColor) => [
  {
    name: 'waiting',
    color: firstColor,
    type: 'block',
    start: 'requestStart',
    end: 'responseStart'
  },
  {
    name: 'downloading',
    color: secondColor,
    type: 'block',
    start: 'responseStart',
    end: 'responseEnd'
  }
];

const castTypeToIntervalsType = (type) => {
  switch (type) {
    case 'text/html':
      return 'html';
    case 'text/css':
      return 'css';
    case 'application/javascript':
      return 'js';
    case 'image/jpeg':
    case 'image/webp':
    case 'image/svg+xml':
    case 'image/png':
      return 'img';
    default:
      return 'other';
  }
}

const getWaterfall = (network, cacheRequests, timeDelta) => ({
  items: cacheRequests ? (
    cacheRequests.map(({
                         name,
                         type,
                         size,
                         priority,
                         requestStart,
                         responseStart,
                         responseEnd
                       }) => ({
      name,
      intervals: castTypeToIntervalsType(type),
      timing: {
        requestStart: (requestStart - timeDelta),
        responseStart: (responseStart - timeDelta),
        responseEnd: (responseEnd - timeDelta)
      },
      meta: [{
        name: 'priority',
        value: priority
      }, {
        name: 'size',
        value: `${size / 1024}KB`
      }]
    }))
  ) : (
    network.map(({ url, type, priority, stats: { timings, transfer } }) => ({
      name: url,
      intervals: castTypeToIntervalsType(type),
      timing: {
        requestStart: timings.start / 1000,
        responseStart: timings.response / 1000,
        responseEnd: timings.finish / 1000
      },
      meta: [{
        name: 'priority',
        value: priority
      }, {
        name: 'size',
        value: `${transfer / 1024}KB`
      }]
    }))
  ),
  intervals: {
    html: getIntervals('rgb(226, 236, 249)', 'rgb(110, 161, 226)'),
    img: getIntervals('rgb(227, 240, 224)', 'rgb(116, 178, 102)'),
    js: getIntervals('rgb(252, 243, 221)', 'rgb(239, 196, 87)'),
    css: getIntervals('rgb(235, 229, 250)', 'rgb(155, 127, 230)'),
    other: getIntervals('rgb(240, 240, 240)', 'rgb(179, 179, 179)')
  }
});

module.exports = {
  getBriefTracing,
  getWaterfall,
  processTracingTree,
  walk,
  filter,
  map,
  gzip,
  change
};
