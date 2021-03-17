// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class ProfileNode {
  /**
   * @param {!Protocol.Runtime.CallFrame} callFrame
   */
  constructor(callFrame) {
    /** @type {!Protocol.Runtime.CallFrame} */
    this.callFrame = callFrame;
    /** @type {string} */
    this.callUID = `${callFrame.functionName}@${callFrame.scriptId}:${callFrame.lineNumber}:${callFrame.columnNumber}`;
    /** @type {number} */
    this.self = 0;
    /** @type {number} */
    this.total = 0;
    /** @type {number} */
    this.id = 0;
    /** @type {?ProfileNode} */
    this.parent = null;
    /** @type {!Array<!ProfileNode>} */
    this.children = [];
    /** @type {number} */
    this.depth;
    /** @type {?string} */
    this.deoptReason;
  }

  /**
   * @return {string}
   */
  get functionName() {
    return this.callFrame.functionName;
  }

  /**
   * @return {string}
   */
  get scriptId() {
    return this.callFrame.scriptId;
  }

  /**
   * @return {string}
   */
  get url() {
    return this.callFrame.url;
  }

  /**
   * @return {number}
   */
  get lineNumber() {
    return this.callFrame.lineNumber;
  }

  /**
   * @return {number}
   */
  get columnNumber() {
    return this.callFrame.columnNumber;
  }
}

class ProfileTreeModel {
  /**
   * @param {?Target=} target
   */
  constructor(target) {
    this._target = target || null;
    /** @type {!ProfileNode} */
    this.root;
    /** @type {number} */
    this.total;
    /** @type {number} */
    this.maxDepth;
  }

  /**
   * @param {!ProfileNode} root
   * @protected
   */
  initialize(root) {
    this.root = root;
    this._assignDepthsAndParents();
    this.total = this._calculateTotals(this.root);
  }

  _assignDepthsAndParents() {
    const root = this.root;
    root.depth = -1;
    root.parent = null;
    this.maxDepth = 0;
    const nodesToTraverse = [root];
    while (nodesToTraverse.length) {
      const parent = /** @type {!ProfileNode} */ (nodesToTraverse.pop());
      const depth = parent.depth + 1;
      if (depth > this.maxDepth) {
        this.maxDepth = depth;
      }
      const children = parent.children;
      for (const child of children) {
        child.depth = depth;
        child.parent = parent;
        if (child.children.length) {
          nodesToTraverse.push(child);
        }
      }
    }
  }

  /**
   * @param {!ProfileNode} root
   * @return {number}
   */
  _calculateTotals(root) {
    const nodesToTraverse = [root];
    const dfsList = [];
    while (nodesToTraverse.length) {
      const node = /** @type {!ProfileNode} */ (nodesToTraverse.pop());
      node.total = node.self;
      dfsList.push(node);
      nodesToTraverse.push(...node.children);
    }
    while (dfsList.length > 1) {
      const node = /** @type {!ProfileNode} */ (dfsList.pop());
      if (node.parent) {
        node.parent.total += node.total;
      }
    }
    return root.total;
  }

  /**
   * @return {?Target}
   */
  target() {
    return this._target;
  }
}

class CPUProfileNode extends ProfileNode {
  /**
   * @param {!Protocol.Profiler.ProfileNode} node
   * @param {number} sampleTime
   */
  constructor(node, sampleTime) {
    const callFrame = node.callFrame || /** @type {!Protocol.Runtime.CallFrame} */ ({
      // Backward compatibility for old SamplingHeapProfileNode format.
      // @ts-ignore Legacy types
      functionName: node['functionName'],
      // @ts-ignore Legacy types
      scriptId: node['scriptId'],
      // @ts-ignore Legacy types
      url: node['url'],
      // @ts-ignore Legacy types
      lineNumber: node['lineNumber'] - 1,
      // @ts-ignore Legacy types
      columnNumber: node['columnNumber'] - 1
    });
    super(callFrame);
    this.id = node.id;
    this.self = (node.hitCount || 0) * sampleTime;
    this.positionTicks = node.positionTicks;
    // Compatibility: legacy backends could provide "no reason" for optimized functions.
    this.deoptReason = node.deoptReason && node.deoptReason !== 'no reason' ? node.deoptReason : null;
  }
}

class CPUProfileDataModel extends ProfileTreeModel {
  /**
   * @param {!Protocol.Profiler.Profile} profile
   * @param {?Target} target
   */
  constructor(profile, target) {
    super(target);
    // @ts-ignore Legacy types
    const isLegacyFormat = Boolean(profile['head']);
    if (isLegacyFormat) {
      // Legacy format contains raw timestamps and start/stop times are in seconds.
      this.profileStartTime = profile.startTime * 1000;
      this.profileEndTime = profile.endTime * 1000;
      // @ts-ignore Legacy types
      this.timestamps = profile.timestamps;
      this._compatibilityConversionHeadToNodes(profile);
    } else {
      // Current format encodes timestamps as deltas. Start/stop times are in microseconds.
      this.profileStartTime = profile.startTime / 1000;
      this.profileEndTime = profile.endTime / 1000;
      this.timestamps = this._convertTimeDeltas(profile);
    }
    this.samples = profile.samples;
    // @ts-ignore Legacy types
    this.lines = profile.lines;
    this.totalHitCount = 0;
    this.profileHead = this._translateProfileTree(profile.nodes);
    this.initialize(this.profileHead);
    this._extractMetaNodes();
    if (this.samples) {
      this._buildIdToNodeMap();
      this._sortSamples();
      this._normalizeTimestamps();
      this._fixMissingSamples();
    }
    /** @type {!Array<number>} */
    this.timestamps;
    /** @type {!Map<number, !CPUProfileNode>} */
    this._idToNode;
    /** @type {!CPUProfileNode} */
    this.gcNode;
  }

  /**
   * @param {!Protocol.Profiler.Profile} profile
   */
  _compatibilityConversionHeadToNodes(profile) {
    // @ts-ignore Legacy types
    if (!profile.head || profile.nodes) {
      return;
    }
    /** @type {!Array<!Protocol.Profiler.ProfileNode>} */
    const nodes = [];
    // @ts-ignore Legacy types
    convertNodesTree(profile.head);
    profile.nodes = nodes;
    // @ts-ignore Legacy types
    delete profile.head;

    /**
     * @param {!Protocol.Profiler.ProfileNode} node
     * @return {number}
     */
    function convertNodesTree(node) {
      nodes.push(node);
      // @ts-ignore Legacy types
      node.children = (/** @type {!Array<!Protocol.Profiler.ProfileNode>} */ (node.children)).map(convertNodesTree);
      return node.id;
    }
  }

  /**
   * @param {!Protocol.Profiler.Profile} profile
   * @return {!Array<number>}
   */
  _convertTimeDeltas(profile) {
    if (!profile.timeDeltas) {
      return [];
    }
    let lastTimeUsec = profile.startTime;
    const timestamps = new Array(profile.timeDeltas.length);
    for (let i = 0; i < profile.timeDeltas.length; ++i) {
      lastTimeUsec += profile.timeDeltas[i];
      timestamps[i] = lastTimeUsec;
    }
    return timestamps;
  }

  /**
   * @param {!Array<!Protocol.Profiler.ProfileNode>} nodes
   * @return {!CPUProfileNode}
   */
  _translateProfileTree(nodes) {
    /**
     * @param {!Protocol.Profiler.ProfileNode} node
     * @return {boolean}
     */
    function isNativeNode(node) {
      if (node.callFrame) {
        return Boolean(node.callFrame.url) && node.callFrame.url.startsWith('native ');
      }
      // @ts-ignore Legacy types
      return Boolean(node['url']) && node['url'].startsWith('native ');
    }

    /**
     * @param {!Array<!Protocol.Profiler.ProfileNode>} nodes
     */
    function buildChildrenFromParents(nodes) {
      if (nodes[0].children) {
        return;
      }
      nodes[0].children = [];
      for (let i = 1; i < nodes.length; ++i) {
        const node = nodes[i];
        // @ts-ignore Legacy types
        const parentNode = nodeByIdMap.get(node.parent);
        // @ts-ignore Legacy types
        if (parentNode.children) {
          // @ts-ignore Legacy types
          parentNode.children.push(node.id);
        } else {
          // @ts-ignore Legacy types
          parentNode.children = [node.id];
        }
      }
    }

    /**
     * @param {!Array<!Protocol.Profiler.ProfileNode>} nodes
     * @param {!Array<number>|undefined} samples
     */
    function buildHitCountFromSamples(nodes, samples) {
      if (typeof (nodes[0].hitCount) === 'number') {
        return;
      }
      if (!samples) {
        throw new Error('Error: Neither hitCount nor samples are present in profile.');
      }
      for (let i = 0; i < nodes.length; ++i) {
        nodes[i].hitCount = 0;
      }
      for (let i = 0; i < samples.length; ++i) {
        ++/** @type {number} */ (/** @type {!Protocol.Profiler.ProfileNode} */ (nodeByIdMap.get(samples[i])).hitCount);
      }
    }

    /** @type {!Map<number, !Protocol.Profiler.ProfileNode>} */
    const nodeByIdMap = new Map();
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      nodeByIdMap.set(node.id, node);
    }

    buildHitCountFromSamples(nodes, this.samples);
    buildChildrenFromParents(nodes);
    this.totalHitCount = nodes.reduce((acc, node) => acc + (node.hitCount || 0), 0);
    const sampleTime = (this.profileEndTime - this.profileStartTime) / this.totalHitCount;
    const keepNatives = true; // change
    const root = nodes[0];
    /** @type {!Map<number, number>} */
    const idMap = new Map([[root.id, root.id]]);
    const resultRoot = new CPUProfileNode(root, sampleTime);
    if (!root.children) {
      throw new Error('Missing children for root');
    }
    const parentNodeStack = root.children.map(() => resultRoot);
    const sourceNodeStack = root.children.map(id => nodeByIdMap.get(id));
    while (sourceNodeStack.length) {
      let parentNode = parentNodeStack.pop();
      const sourceNode = sourceNodeStack.pop();
      if (!sourceNode || !parentNode) {
        continue;
      }
      if (!sourceNode.children) {
        sourceNode.children = [];
      }
      const targetNode = new CPUProfileNode(sourceNode, sampleTime);
      if (keepNatives || !isNativeNode(sourceNode)) {
        parentNode.children.push(targetNode);
        parentNode = targetNode;
      } else {
        parentNode.self += targetNode.self;
      }
      idMap.set(sourceNode.id, parentNode.id);
      parentNodeStack.push.apply(
        parentNodeStack, sourceNode.children.map(() => /** @type {!CPUProfileNode} */ (parentNode)));
      sourceNodeStack.push.apply(sourceNodeStack, sourceNode.children.map(id => nodeByIdMap.get(id)));
    }
    if (this.samples) {
      this.samples = this.samples.map(id => /** @type {number} */ (idMap.get(id)));
    }
    return resultRoot;
  }

  _sortSamples() {
    const timestamps = this.timestamps;
    if (!timestamps) {
      return;
    }
    const samples = this.samples;
    if (!samples) {
      return;
    }
    const indices = timestamps.map((x, index) => index);
    indices.sort((a, b) => timestamps[a] - timestamps[b]);
    for (let i = 0; i < timestamps.length; ++i) {
      let index = indices[i];
      if (index === i) {
        continue;
      }
      // Move items in a cycle.
      const savedTimestamp = timestamps[i];
      const savedSample = samples[i];
      let currentIndex = i;
      while (index !== i) {
        samples[currentIndex] = samples[index];
        timestamps[currentIndex] = timestamps[index];
        currentIndex = index;
        index = indices[index];
        indices[currentIndex] = currentIndex;
      }
      samples[currentIndex] = savedSample;
      timestamps[currentIndex] = savedTimestamp;
    }
  }

  _normalizeTimestamps() {
    if (!this.samples) {
      return;
    }
    let timestamps = this.timestamps;

    // Convert samples from usec to msec
    for (let i = 0; i < timestamps.length; ++i) {
      timestamps[i] /= 1000;
    }

    if (this.samples.length === timestamps.length) {
      // Support for a legacy format where were no timeDeltas.
      // Add an extra timestamp used to calculate the last sample duration.
      const averageSample = ((timestamps[timestamps.length - 1] || 0) - timestamps[0]) / (timestamps.length - 1);
      this.timestamps.push((timestamps[timestamps.length - 1] || 0) + averageSample);
    }

    this.profileStartTime = timestamps[0];
    this.profileEndTime = /** @type {number} */ (timestamps[timestamps.length - 1]);
  }

  _buildIdToNodeMap() {
    this._idToNode = new Map();
    const idToNode = this._idToNode;
    const stack = [this.profileHead];
    while (stack.length) {
      const node = /** @type {!CPUProfileNode} */ (stack.pop());
      idToNode.set(node.id, node);
      // @ts-ignore Legacy types
      stack.push.apply(stack, node.children);
    }
  }

  _extractMetaNodes() {
    const topLevelNodes = this.profileHead.children;
    for (let i = 0; i < topLevelNodes.length && !(this.gcNode && this.programNode && this.idleNode); i++) {
      const node = topLevelNodes[i];
      if (node.functionName === '(garbage collector)') {
        this.gcNode = /** @type {!CPUProfileNode} */ (node);
      } else if (node.functionName === '(program)') {
        this.programNode = node;
      } else if (node.functionName === '(idle)') {
        this.idleNode = node;
      }
    }
  }

  _fixMissingSamples() {
    // Sometimes sampler is not able to parse the JS stack and returns
    // a (program) sample instead. The issue leads to call frames belong
    // to the same function invocation being split apart.
    // Here's a workaround for that. When there's a single (program) sample
    // between two call stacks sharing the same bottom node, it is replaced
    // with the preceeding sample.
    const samples = this.samples;
    if (!samples) {
      return;
    }
    const samplesCount = samples.length;
    if (!this.programNode || samplesCount < 3) {
      return;
    }
    const idToNode = this._idToNode;
    const programNodeId = this.programNode.id;
    const gcNodeId = this.gcNode ? this.gcNode.id : -1;
    const idleNodeId = this.idleNode ? this.idleNode.id : -1;
    let prevNodeId = samples[0];
    let nodeId = samples[1];
    let count = 0;
    for (let sampleIndex = 1; sampleIndex < samplesCount - 1; sampleIndex++) {
      const nextNodeId = samples[sampleIndex + 1];
      if (nodeId === programNodeId && !isSystemNode(prevNodeId) && !isSystemNode(nextNodeId) &&
        bottomNode(/** @type {!ProfileNode} */ (idToNode.get(prevNodeId))) ===
        bottomNode(/** @type {!ProfileNode} */ (idToNode.get(nextNodeId)))) {
        ++count;
        samples[sampleIndex] = prevNodeId;
      }
      prevNodeId = nodeId;
      nodeId = nextNodeId;
    }

    /**
     * @param {!ProfileNode} node
     * @return {!ProfileNode}
     */
    function bottomNode(node) {
      while (node.parent && node.parent.parent) {
        node = node.parent;
      }
      return node;
    }

    /**
     * @param {number} nodeId
     * @return {boolean}
     */
    function isSystemNode(nodeId) {
      return nodeId === programNodeId || nodeId === gcNodeId || nodeId === idleNodeId;
    }
  }

  /**
   * @param {function(number, !CPUProfileNode, number):void} openFrameCallback
   * @param {function(number, !CPUProfileNode, number, number, number):void} closeFrameCallback
   * @param {number=} startTime
   * @param {number=} stopTime
   */
  forEachFrame(openFrameCallback, closeFrameCallback, startTime, stopTime) {
    if (!this.profileHead || !this.samples) {
      return;
    }

    startTime = startTime || 0;
    stopTime = stopTime || Infinity;
    const samples = this.samples;
    const timestamps = this.timestamps;
    const idToNode = this._idToNode;
    const gcNode = this.gcNode;
    const samplesCount = samples.length;
    const startIndex = 0; // change
    let stackTop = 0;
    const stackNodes = [];
    let prevId = this.profileHead.id;
    let sampleTime;
    /** @type {?CPUProfileNode} */
    let gcParentNode = null;

    // Extra slots for gc being put on top,
    // and one at the bottom to allow safe stackTop-1 access.
    const stackDepth = this.maxDepth + 3;
    if (!this._stackStartTimes) {
      this._stackStartTimes = new Float64Array(stackDepth);
    }
    const stackStartTimes = this._stackStartTimes;
    if (!this._stackChildrenDuration) {
      this._stackChildrenDuration = new Float64Array(stackDepth);
    }
    const stackChildrenDuration = this._stackChildrenDuration;

    let node;
    let sampleIndex;
    for (sampleIndex = startIndex; sampleIndex < samplesCount; sampleIndex++) {
      sampleTime = timestamps[sampleIndex];
      if (sampleTime >= stopTime) {
        break;
      }
      const id = samples[sampleIndex];
      if (id === prevId) {
        continue;
      }
      node = idToNode.get(id);
      let prevNode = /** @type {!CPUProfileNode} */ (idToNode.get(prevId));

      if (node === gcNode) {
        // GC samples have no stack, so we just put GC node on top of the last recorded sample.
        gcParentNode = prevNode;
        openFrameCallback(gcParentNode.depth + 1, gcNode, sampleTime);
        stackStartTimes[++stackTop] = sampleTime;
        stackChildrenDuration[stackTop] = 0;
        prevId = id;
        continue;
      }
      if (prevNode === gcNode && gcParentNode) {
        // end of GC frame
        const start = stackStartTimes[stackTop];
        const duration = sampleTime - start;
        stackChildrenDuration[stackTop - 1] += duration;
        closeFrameCallback(gcParentNode.depth + 1, gcNode, start, duration, duration - stackChildrenDuration[stackTop]);
        --stackTop;
        prevNode = gcParentNode;
        prevId = prevNode.id;
        gcParentNode = null;
      }

      while (node && node.depth > prevNode.depth) {
        stackNodes.push(node);
        node = node.parent;
      }

      // Go down to the LCA and close current intervals.
      while (prevNode !== node) {
        const start = stackStartTimes[stackTop];
        const duration = sampleTime - start;
        stackChildrenDuration[stackTop - 1] += duration;
        closeFrameCallback(
          prevNode.depth, /** @type {!CPUProfileNode} */ (prevNode), start, duration,
          duration - stackChildrenDuration[stackTop]);
        --stackTop;
        if (node && node.depth === prevNode.depth) {
          stackNodes.push(node);
          node = node.parent;
        }
        prevNode = /** @type {!CPUProfileNode} */ (prevNode.parent);
      }

      // Go up the nodes stack and open new intervals.
      while (stackNodes.length) {
        const currentNode = /** @type {!CPUProfileNode} */ (stackNodes.pop());
        node = currentNode;
        openFrameCallback(currentNode.depth, currentNode, sampleTime);
        stackStartTimes[++stackTop] = sampleTime;
        stackChildrenDuration[stackTop] = 0;
      }

      prevId = id;
    }

    sampleTime = timestamps[sampleIndex] || this.profileEndTime;
    if (gcParentNode && idToNode.get(prevId) === gcNode) {
      const start = stackStartTimes[stackTop];
      const duration = sampleTime - start;
      stackChildrenDuration[stackTop - 1] += duration;
      closeFrameCallback(
        gcParentNode.depth + 1, /** @type {!CPUProfileNode} */ (node), start, duration,
        duration - stackChildrenDuration[stackTop]);
      --stackTop;
      prevId = gcParentNode.id;
    }

    for (let node = idToNode.get(prevId); node && node.parent; node = /** @type {!CPUProfileNode} */ (node.parent)) {
      const start = stackStartTimes[stackTop];
      const duration = sampleTime - start;
      stackChildrenDuration[stackTop - 1] += duration;
      closeFrameCallback(
        node.depth, /** @type {!CPUProfileNode} */ (node), start, duration,
        duration - stackChildrenDuration[stackTop]);
      --stackTop;
    }
  }

  /**
   * @param {number} index
   * @return {?CPUProfileNode}
   */
  nodeByIndex(index) {
    return this.samples && this._idToNode.get(this.samples[index]) || null;
  }
}

class TimelineJSProfileProcessor {
  static generateTracingEventsFromCpuProfile(jsProfileModel, thread) {
    const idleNode = jsProfileModel.idleNode;
    const programNode = jsProfileModel.programNode || null;
    const gcNode = jsProfileModel.gcNode;
    const samples = jsProfileModel.samples || [];
    const timestamps = jsProfileModel.timestamps;
    const jsEvents = [];
    const nodeToStackMap = new Map();
    nodeToStackMap.set(programNode, []);
    for (let i = 0; i < samples.length; ++i) {
      let node = jsProfileModel.nodeByIndex(i);
      if (!node) {
        console.error(`Node with unknown id ${samples[i]} at index ${i}`);
        continue;
      }
      if (node === gcNode || node === idleNode) {
        continue;
      }
      let callFrames = nodeToStackMap.get(node);
      if (!callFrames) {
        callFrames = (new Array(node.depth + 1));
        nodeToStackMap.set(node, callFrames);
        for (let j = 0; node.parent; node = node.parent) {
          callFrames[j++] = (node);
        }
      }
      const jsSampleEvent = {
        args: {},
        categoriesString: 'disabled-by-default-devtools.timeline',
        name: 'JSSample',
        ordinal: 0,
        phase: 'I',
        selfTime: 0,
        startTime: timestamps[i]
      }
      jsSampleEvent.args['data'] = { stackTrace: callFrames };
      jsEvents.push(jsSampleEvent);
    }
    return jsEvents;
  }

  static generateJSFrameEvents(events, config) {
    function equalFrames(frame1, frame2) {
      return frame1.scriptId === frame2.scriptId && frame1.functionName === frame2.functionName &&
        frame1.lineNumber === frame2.lineNumber;
    }

    function isJSInvocationEvent(e) {
      switch (e.name) {
        case RecordType.RunMicrotasks:
        case RecordType.FunctionCall:
        case RecordType.EvaluateScript:
        case RecordType.EvaluateModule:
        case RecordType.EventDispatch:
        case RecordType.V8Execute:
          return true;
      }
      return false;
    }

    const jsFrameEvents = [];
    const jsFramesStack = [];
    const lockedJsStackDepth = [];
    let ordinal = 0;
    let fakeJSInvocation = false;
    const { showAllEvents = true, showRuntimeCallStats = true, showNativeFunctions = true } = config = {};

    function onStartEvent(e) {
      if (fakeJSInvocation) {
        truncateJSStack((lockedJsStackDepth.pop()), e.startTime);
        fakeJSInvocation = false;
      }
      e.ordinal = ++ordinal;
      extractStackTrace(e);
      // For the duration of the event we cannot go beyond the stack associated with it.
      lockedJsStackDepth.push(jsFramesStack.length);
    }

    function onInstantEvent(e, parent) {
      e.ordinal = ++ordinal;
      if ((parent && isJSInvocationEvent(parent)) || fakeJSInvocation) {
        extractStackTrace(e);
      } else if (e.name === RecordType.JSSample && jsFramesStack.length === 0) {
        // Force JS Samples to show up even if we are not inside a JS invocation event, because we
        // can be missing the start of JS invocation events if we start tracing half-way through.
        // Pretend we have a top-level JS invocation event.
        fakeJSInvocation = true;
        const stackDepthBefore = jsFramesStack.length;
        extractStackTrace(e);
        lockedJsStackDepth.push(stackDepthBefore);
      }
    }

    function onEndEvent(e) {
      truncateJSStack((lockedJsStackDepth.pop()), (e.endTime));
    }

    function truncateJSStack(depth, time) {
      if (lockedJsStackDepth.length) {
        const lockedDepth = (lockedJsStackDepth[lockedJsStackDepth.length - 1]);
        if (depth < lockedDepth) {
          console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);
          depth = lockedDepth;
        }
      }
      if (jsFramesStack.length < depth) {
        console.error(`Trying to truncate higher than the current stack size at ${time}`);
        depth = jsFramesStack.length;
      }
      for (let k = 0; k < jsFramesStack.length; ++k) {
        jsFramesStack[k].endTime = time;
      }
      jsFramesStack.length = depth;
    }

    function showNativeName(name) {
      return showRuntimeCallStats && Boolean(TimelineJSProfileProcessor.nativeGroup(name));
    }

    function filterStackFrames(stack) {
      if (showAllEvents) {
        return;
      }
      let previousNativeFrameName = null;
      let j = 0;
      for (let i = 0; i < stack.length; ++i) {
        const frame = stack[i];
        const url = frame.url;
        const isNativeFrame = url && url.startsWith('native ');
        if (!showNativeFunctions && isNativeFrame) {
          continue;
        }
        const isNativeRuntimeFrame = TimelineJSProfileProcessor.isNativeRuntimeFrame(frame);
        if (isNativeRuntimeFrame && !showNativeName(frame.functionName)) {
          continue;
        }
        const nativeFrameName =
          isNativeRuntimeFrame ? TimelineJSProfileProcessor.nativeGroup(frame.functionName) : null;
        if (previousNativeFrameName && previousNativeFrameName === nativeFrameName) {
          continue;
        }
        previousNativeFrameName = nativeFrameName;
        stack[j++] = frame;
      }
      stack.length = j;
    }

    function extractStackTrace(e) {
      const callFrames = e.name === RecordType.JSSample ?
        e.args['data']['stackTrace'].slice().reverse() :
        jsFramesStack.map(frameEvent => frameEvent.args['data']);

      filterStackFrames(callFrames);

      const endTime = e.endTime || e.startTime;
      const minFrames = Math.min(callFrames.length, jsFramesStack.length);
      let i;
      for (i = lockedJsStackDepth[lockedJsStackDepth.length - 1] || 0; i < minFrames; ++i) {
        const newFrame = callFrames[i];
        const oldFrame = jsFramesStack[i].args['data'];
        if (!equalFrames(newFrame, oldFrame)) {
          break;
        }
        jsFramesStack[i].endTime = Math.max((jsFramesStack[i].endTime), endTime);
      }

      truncateJSStack(i, e.startTime);

      for (; i < callFrames.length; ++i) {
        const frame = callFrames[i];
        const jsFrameEvent = {
          args: {},
          categoriesString: 'disabled-by-default-devtools.timeline',
          name: 'JSFrame',
          ordinal: 0,
          phase: 'C',
          startTime: e.startTime
        };

        jsFrameEvent.ordinal = e.ordinal;
        jsFrameEvent.args = ({ data: frame });
        jsFrameEvent.endTime = endTime;
        jsFramesStack.push(jsFrameEvent);
        jsFrameEvents.push(jsFrameEvent);
      }
    }

    const startTime = events.find(({ name }) => name === 'RunTask').startTime; // first runTask

    this.forEachEvent(events, onStartEvent, onEndEvent, onInstantEvent, startTime);

    return jsFrameEvents;
  }

  static forEachEvent(
    events,
    onStartEvent,
    onEndEvent,
    onInstantEvent,
    startTime,
    endTime,
    filter
  ) {
    startTime = startTime || 0;
    endTime = endTime || Infinity;
    const stack = [];
    const startEvent = this._topLevelEventEndingAfter(events, startTime);

    for (let i = startEvent; i < events.length; ++i) {
      const e = events[i];

      if ((e.endTime || e.startTime) < startTime) {
        continue;
      }

      if (e.startTime >= endTime) {
        break;
      }

      if (this.isAsyncPhase(e.ph) || this.isFlowPhase(e.ph)) {
        continue;
      }

      let last = stack[stack.length - 1];

      while (last && last.endTime !== undefined && last.endTime <= e.startTime) {
        stack.pop();
        onEndEvent(last);
        last = stack[stack.length - 1];
      }

      if (filter && !filter(e)) {
        continue;
      }

      if (e.duration) {
        onStartEvent(e);
        stack.push(e);
      } else {
        onInstantEvent && onInstantEvent(e, stack[stack.length - 1] || null);
      }
    }
    while (stack.length) {
      const last = stack.pop();

      if (last) {
        onEndEvent(last);
      }
    }
  }

  static isAsyncPhase(phase) {
    return this.isNestableAsyncPhase(phase) || phase === 'S' || phase === 'T' || phase === 'F' || phase === 'p';
  }

  static isFlowPhase(phase) {
    return phase === 's' || phase === 't' || phase === 'f';
  }

  static isNestableAsyncPhase(phase) {
    return phase === 'b' || phase === 'e' || phase === 'n';
  }

  static _topLevelEventEndingAfter(events, time) {
    let index = this.upperBound(events, time, (time, event) => time - event.startTime) - 1;
    while (index > 0 && events[index].name !== 'RunTask') {
      index--;
    }
    return Math.max(index, 0);
  }

  static upperBound(
    array,
    needle,
    comparator,
    left,
    right
  ) {
    let l = left || 0;
    let r = right !== undefined ? right : array.length;
    while (l < r) {
      const m = (l + r) >> 1;
      if (comparator(needle, array[m]) >= 0) {
        l = m + 1;
      } else {
        r = m;
      }
    }
    return r;
  }


  static isNativeRuntimeFrame(frame) {
    return frame.url === 'native V8Runtime';
  }

  static nativeGroup(nativeName) {
    if (nativeName.startsWith('Parse')) {
      return TimelineJSProfileProcessor.NativeGroups.Parse;
    }
    if (nativeName.startsWith('Compile') || nativeName.startsWith('Recompile')) {
      return TimelineJSProfileProcessor.NativeGroups.Compile;
    }
    return null;
  }

  static buildTraceProfileFromCpuProfile(profile, tid, injectPageEvent, name) {
    const events = [];
    if (injectPageEvent) {
      appendEvent('TracingStartedInPage', { data: { 'sessionId': '1' } }, 0, 0, 'M');
    }
    if (!name) {
      name = '';
    }
    appendEvent(TracingModel.MetadataEvent.ThreadName, { name }, 0, 0, 'M', '__metadata');
    if (!profile) {
      return events;
    }
    const idToNode = new Map();
    const nodes = profile['nodes'];
    for (let i = 0; i < nodes.length; ++i) {
      idToNode.set(nodes[i].id, nodes[i]);
    }
    let programEvent = null;
    let functionEvent = null;
    let nextTime = profile.startTime;
    let currentTime = 0;
    const samples = profile['samples'];
    const timeDeltas = profile['timeDeltas'];
    for (let i = 0; i < samples.length; ++i) {
      currentTime = nextTime;
      nextTime += timeDeltas[i];
      const node = idToNode.get(samples[i]);
      const name = node.callFrame.functionName;
      if (name === '(idle)') {
        closeEvents();
        continue;
      }
      if (!programEvent) {
        programEvent = appendEvent('MessageLoop::RunTask', {}, currentTime, 0, 'X', 'toplevel');
      }
      if (name === '(program)') {
        if (functionEvent) {
          functionEvent.dur = currentTime - functionEvent.ts;
          functionEvent = null;
        }
      } else {
        // A JS function.
        if (!functionEvent) {
          functionEvent = appendEvent('FunctionCall', { data: { 'sessionId': '1' } }, currentTime);
        }
      }
    }
    closeEvents();
    appendEvent('CpuProfile', { data: { 'cpuProfile': profile } }, profile.endTime, 0, 'I');
    return events;

    function closeEvents() {
      if (programEvent) {
        programEvent.dur = currentTime - programEvent.ts;
      }
      if (functionEvent) {
        functionEvent.dur = currentTime - functionEvent.ts;
      }
      programEvent = null;
      functionEvent = null;
    }

    function appendEvent(name, args, ts, dur, ph, cat) {
      const event =
        ({ cat: cat || 'disabled-by-default-devtools.timeline', name, ph: ph || 'X', pid: 1, tid, ts, args });
      if (dur) {
        event.dur = dur;
      }
      events.push(event);
      return event;
    }
  }
}

function prepareEvent(profileEvents) {
  const mainProfileEvent = profileEvents.find(({ name }) => name === 'Profile');

  const cpuProfile = ({
    startTime: mainProfileEvent.startTime * 1000,
    endTime: 0,
    nodes: [],
    samples: [],
    timeDeltas: [],
    lines: [],
  });

  for (const profileEvent of profileEvents) {
    const eventData = profileEvent.args['data'];

    if ('startTime' in eventData) {
      // Do not use |eventData['startTime']| as it is in CLOCK_MONOTONIC domain,
      // but use |profileEvent.startTime| (|ts| in the trace event) which has
      // been translated to Perfetto's clock domain.
      //
      // Also convert from ms to us.
      cpuProfile.startTime = profileEvent.startTime * 1000;
    }

    if ('endTime' in eventData) {
      // Do not use |eventData['endTime']| as it is in CLOCK_MONOTONIC domain,
      // but use |profileEvent.startTime| (|ts| in the trace event) which has
      // been translated to Perfetto's clock domain.
      //
      // Despite its name, |profileEvent.startTime| was recorded right after
      // |eventData['endTime']| within v8 and is a reasonable substitute.
      //
      // Also convert from ms to us.
      cpuProfile.endTime = profileEvent.startTime * 1000;
    }

    const nodesAndSamples = eventData['cpuProfile'] || {};
    const samples = nodesAndSamples['samples'] || [];
    const lines = eventData['lines'] || Array(samples.length).fill(0);

    cpuProfile.nodes.push(...(nodesAndSamples['nodes'] || []));
    cpuProfile.lines.push(...lines);

    if (cpuProfile.samples) {
      cpuProfile.samples.push(...samples);
    }

    if (cpuProfile.timeDeltas) {
      cpuProfile.timeDeltas.push(...(eventData['timeDeltas'] || []));
    }

    if (cpuProfile.samples && cpuProfile.timeDeltas && cpuProfile.samples.length !== cpuProfile.timeDeltas.length) {
      return null;
    }
  }

  if (!cpuProfile.endTime && cpuProfile.timeDeltas) {
    const timeDeltas = cpuProfile.timeDeltas;
    cpuProfile.endTime = timeDeltas.reduce((x, y) => x + y, cpuProfile.startTime);
  }

  return cpuProfile;
}

const RecordType = {
  Task: 'RunTask',
  Program: 'Program',
  EventDispatch: 'EventDispatch',

  GPUTask: 'GPUTask',

  Animation: 'Animation',
  RequestMainThreadFrame: 'RequestMainThreadFrame',
  BeginFrame: 'BeginFrame',
  NeedsBeginFrameChanged: 'NeedsBeginFrameChanged',
  BeginMainThreadFrame: 'BeginMainThreadFrame',
  ActivateLayerTree: 'ActivateLayerTree',
  DrawFrame: 'DrawFrame',
  DroppedFrame: 'DroppedFrame',
  HitTest: 'HitTest',
  ScheduleStyleRecalculation: 'ScheduleStyleRecalculation',
  RecalculateStyles: 'RecalculateStyles',
  UpdateLayoutTree: 'UpdateLayoutTree',
  InvalidateLayout: 'InvalidateLayout',
  Layout: 'Layout',
  LayoutShift: 'LayoutShift',
  UpdateLayer: 'UpdateLayer',
  UpdateLayerTree: 'UpdateLayerTree',
  PaintSetup: 'PaintSetup',
  Paint: 'Paint',
  PaintImage: 'PaintImage',
  Rasterize: 'Rasterize',
  RasterTask: 'RasterTask',
  ScrollLayer: 'ScrollLayer',
  CompositeLayers: 'CompositeLayers',
  InteractiveTime: 'InteractiveTime',

  ScheduleStyleInvalidationTracking: 'ScheduleStyleInvalidationTracking',
  StyleRecalcInvalidationTracking: 'StyleRecalcInvalidationTracking',
  StyleInvalidatorInvalidationTracking: 'StyleInvalidatorInvalidationTracking',
  LayoutInvalidationTracking: 'LayoutInvalidationTracking',

  ParseHTML: 'ParseHTML',
  ParseAuthorStyleSheet: 'ParseAuthorStyleSheet',

  TimerInstall: 'TimerInstall',
  TimerRemove: 'TimerRemove',
  TimerFire: 'TimerFire',

  XHRReadyStateChange: 'XHRReadyStateChange',
  XHRLoad: 'XHRLoad',
  CompileScript: 'v8.compile',
  EvaluateScript: 'EvaluateScript',
  CompileModule: 'v8.compileModule',
  EvaluateModule: 'v8.evaluateModule',
  WasmStreamFromResponseCallback: 'v8.wasm.streamFromResponseCallback',
  WasmCompiledModule: 'v8.wasm.compiledModule',
  WasmCachedModule: 'v8.wasm.cachedModule',
  WasmModuleCacheHit: 'v8.wasm.moduleCacheHit',
  WasmModuleCacheInvalid: 'v8.wasm.moduleCacheInvalid',

  FrameStartedLoading: 'FrameStartedLoading',
  CommitLoad: 'CommitLoad',
  MarkLoad: 'MarkLoad',
  MarkDOMContent: 'MarkDOMContent',
  MarkFirstPaint: 'firstPaint',
  MarkFCP: 'firstContentfulPaint',
  MarkLCPCandidate: 'largestContentfulPaint::Candidate',
  MarkLCPInvalidate: 'largestContentfulPaint::Invalidate',
  NavigationStart: 'navigationStart',

  TimeStamp: 'TimeStamp',
  ConsoleTime: 'ConsoleTime',
  UserTiming: 'UserTiming',

  ResourceWillSendRequest: 'ResourceWillSendRequest',
  ResourceSendRequest: 'ResourceSendRequest',
  ResourceReceiveResponse: 'ResourceReceiveResponse',
  ResourceReceivedData: 'ResourceReceivedData',
  ResourceFinish: 'ResourceFinish',
  ResourceMarkAsCached: 'ResourceMarkAsCached',

  RunMicrotasks: 'RunMicrotasks',
  FunctionCall: 'FunctionCall',
  GCEvent: 'GCEvent',
  MajorGC: 'MajorGC',
  MinorGC: 'MinorGC',
  JSFrame: 'JSFrame',
  JSSample: 'JSSample',
  // V8Sample events are coming from tracing and contain raw stacks with function addresses.
  // After being processed with help of JitCodeAdded and JitCodeMoved events they
  // get translated into function infos and stored as stacks in JSSample events.
  V8Sample: 'V8Sample',
  JitCodeAdded: 'JitCodeAdded',
  JitCodeMoved: 'JitCodeMoved',
  StreamingCompileScript: 'v8.parseOnBackground',
  StreamingCompileScriptWaiting: 'v8.parseOnBackgroundWaiting',
  StreamingCompileScriptParsing: 'v8.parseOnBackgroundParsing',
  V8Execute: 'V8.Execute',

  UpdateCounters: 'UpdateCounters',

  RequestAnimationFrame: 'RequestAnimationFrame',
  CancelAnimationFrame: 'CancelAnimationFrame',
  FireAnimationFrame: 'FireAnimationFrame',

  RequestIdleCallback: 'RequestIdleCallback',
  CancelIdleCallback: 'CancelIdleCallback',
  FireIdleCallback: 'FireIdleCallback',

  WebSocketCreate: 'WebSocketCreate',
  WebSocketSendHandshakeRequest: 'WebSocketSendHandshakeRequest',
  WebSocketReceiveHandshakeResponse: 'WebSocketReceiveHandshakeResponse',
  WebSocketDestroy: 'WebSocketDestroy',

  EmbedderCallback: 'EmbedderCallback',

  SetLayerTreeId: 'SetLayerTreeId',
  TracingStartedInPage: 'TracingStartedInPage',
  TracingSessionIdForWorker: 'TracingSessionIdForWorker',

  DecodeImage: 'Decode Image',
  ResizeImage: 'Resize Image',
  DrawLazyPixelRef: 'Draw LazyPixelRef',
  DecodeLazyPixelRef: 'Decode LazyPixelRef',

  LazyPixelRef: 'LazyPixelRef',
  LayerTreeHostImplSnapshot: 'cc::LayerTreeHostImpl',
  PictureSnapshot: 'cc::Picture',
  DisplayItemListSnapshot: 'cc::DisplayItemList',
  LatencyInfo: 'LatencyInfo',
  LatencyInfoFlow: 'LatencyInfo.Flow',
  InputLatencyMouseMove: 'InputLatency::MouseMove',
  InputLatencyMouseWheel: 'InputLatency::MouseWheel',
  ImplSideFling: 'InputHandlerProxy::HandleGestureFling::started',
  GCCollectGarbage: 'BlinkGC.AtomicPhase',

  CryptoDoEncrypt: 'DoEncrypt',
  CryptoDoEncryptReply: 'DoEncryptReply',
  CryptoDoDecrypt: 'DoDecrypt',
  CryptoDoDecryptReply: 'DoDecryptReply',
  CryptoDoDigest: 'DoDigest',
  CryptoDoDigestReply: 'DoDigestReply',
  CryptoDoSign: 'DoSign',
  CryptoDoSignReply: 'DoSignReply',
  CryptoDoVerify: 'DoVerify',
  CryptoDoVerifyReply: 'DoVerifyReply',

  // CpuProfile is a virtual event created on frontend to support
  // serialization of CPU Profiles within tracing timeline data.
  CpuProfile: 'CpuProfile',
  Profile: 'Profile',

  AsyncTask: 'AsyncTask',
}

const { getEventsTree } = require('./events-tree.js');
const { filterCategories } = require('./events-helpers.js');

const EXCLUDED_CATEGORIES = [
  'v8'
];

function getExpandedMainThreadEventsTree(mainEvents, otherEvents, firstEvent) {
  const profileStartEvent = mainEvents.find(({ name }) => name === 'Profile');

  if (profileStartEvent) {
    const profileEventsInMainProcess = otherEvents.filter(({ name }) => name === 'ProfileChunk');

    const preparedEvents = prepareEvent([profileStartEvent, ...profileEventsInMainProcess].map((event) => ({
      ...event,
      startTime: (event.ts + firstEvent.ts) / 1000
    })));
    const cpuProfileDataModel = new CPUProfileDataModel(preparedEvents);

    const jsSampleEvents = TimelineJSProfileProcessor.generateTracingEventsFromCpuProfile(cpuProfileDataModel);

    const jsFrameEvents = TimelineJSProfileProcessor.generateJSFrameEvents([
      ...jsSampleEvents,
      ...mainEvents.map((event) => ({
        ...event,
        startTime: (event.ts + firstEvent.ts) / 1000,
        endTime: event.dur ? (event.ts + firstEvent.ts) / 1000 + event.dur / 1000 : undefined,
        duration: event.dur ? event.dur / 1000 : undefined
      }))
    ].sort((a, b) => a.startTime - b.startTime));

    const clearedMainThreadEvents = filterCategories(mainEvents, EXCLUDED_CATEGORIES);

    const expandedMainThreadEvents = jsFrameEvents.map((event) => ({
      ...event,
      ts: +((event.startTime - firstEvent.ts / 1000) * 1000).toFixed(3),
      dur: +((event.endTime - event.startTime) * 1000).toFixed(3),
      name: 'JSFrame',
      args: event.args.data.callFrame
    })).concat(clearedMainThreadEvents).sort((a, b) => a.ts - b.ts);

    const expandedMainThreadEventsTree = getEventsTree(expandedMainThreadEvents);

    return expandedMainThreadEventsTree;
  }

  return [];
}

module.exports = {
  CPUProfileDataModel,
  prepareEvent,
  TimelineJSProfileProcessor,
  getExpandedMainThreadEventsTree
};
