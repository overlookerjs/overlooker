declare module "overlooker" {
  export type ProfileData = {
    [pageName: string]: PageData
  };

  export type AggregatedData = {
    q1: number,
    q3: number,
    percentile98: number,
    percentile02: number,
    max: number,
    min: number,
    median: number,
    count: number,
    standardDeviation: number,
    mean: number,
  };

  export type PageData = {
    actions: ProfileActions,
    stats: ProfileStats,
    network: ProfileNetwork
  };

  export type ProfileActions = {
    [actionName: string]: ProfileAction
  };

  export type ProfileAction = {
    network: ProfileNetwork,
    stats: ActionStats
  };

  export type ActionStats = {
    evaluating: ProfileStatsEvaluating,
    resources: ProfileStatsResources,
    timings: ActionsTimings
  };

  export type ActionsTimings = {
    start: AggregatedData,
    end: AggregatedData
  };

  export type ProfileStats = {
    evaluating: ProfileStatsEvaluating,
    resources: ProfileStatsResources,
    timings: ProfileStatsTimings,
    userCentric: ProfileStatsUserCentric
  };

  export type ProfileStatsEvaluating = {
    externalScriptEvaluating: AggregatedData,
    internalScriptEvaluating: AggregatedData,
    totalScriptEvaluating: AggregatedData
  };

  export type ProfileStatsResources = {
    internal: ProfileStatsResourcesSection,
    external: ProfileStatsResourcesSection,
    total: ProfileStatsResourcesSection,
  };

  export type ProfileStatsResourcesSection = {
    css: ResourceSize,
    js: ResourceSize,
    fonts: ResourceSize,
    html: ResourceSize,
    images: ResourceSize,
    total: ResourceSize
  };

  export type ResourceSize = {
    size: AggregatedData,
    transfer: AggregatedData
  };

  export type ProfileStatsTimings = {
    firstMeaningfulPaint: AggregatedData,
    firstMeaningfulPaintCandidate: AggregatedData,
    firstPaint: AggregatedData,
    firstTextPaint: AggregatedData,
    firstImagePaint: AggregatedData,
    firstContentfulPaint: AggregatedData,
    domContentLoadedEventStart: AggregatedData,
    domContentLoadedEventEnd: AggregatedData,
    loadEventStart: AggregatedData,
    loadEventEnd: AggregatedData,
    domInteractive: AggregatedData,
    domComplete: AggregatedData
  };

  export type ProfileStatsUserCentric = {
    speedIndex: AggregatedData
  };

  export type ProfileNetwork = Array<ProfileRequest>;

  export type ProfileRequest = {
    size: number,
    transfer: number,
    timings: {
      start: number,
      response: number,
      firstByte: number,
      finish: number,
      total: number
    },
    evaluating: Array<{
      url: string,
      duration: number,
      timings: {
        start: number,
        end: number
      }
    }>,
    meta?: RequestMeta,
    type: string,
    url: string,
    count: number,
    internal: boolean,
    extension: string
  };

  export type RequestMeta = {
    canBeInitial: boolean,
    files: Array<string>,
    groups: Array<string>,
    id: number,
    modules: Array<Module>,
  };

  export type Module = {
    deopt: Array<string>,
    deps: Array<{
      module: string
    }>,
    file: string,
    id: string,
    isEntry: boolean,
    reasons: Array<{
      module: string
    }>,
    size: number,
    source: Source,
    type: string
  };

  export type Source = {
    ext: string,
    hash: string,
    nodeModule: {
      name: string,
      version: string
    },
    path: string,
    size: number
  };

  export type ComparedData = {
    [pageName: string]: {
      absolute: ComparedDataAbsolute,
      percent: ComparedDataPercent
    }
  };

  export type ComparedDataPercent = {
    actions: ComparedActionsPercent,
    stats: ProfileStats,
  };

  export type ComparedDataAbsolute = {
    actions: ComparedActionsAbsolute,
    stats: ProfileStats,
    network: ComparedNetwork
  };

  export type ComparedActionsAbsolute = {
    [actionName: string]: ComparedActionAbsolute
  };

  export type ComparedActionAbsolute = {
    stats: ProfileStats,
    network: ComparedNetwork
  };

  export type ComparedActionsPercent = {
    [actionName: string]: ComparedActionPercent
  };

  export type ComparedActionPercent = {
    stats: ProfileStats
  };

  export type ComparedNetwork = Array<ComparedRequest>;

  export type ComparedRequest = {
    contentStatus: 'changed' | 'not_changed',
    difference: ProfileRequest,
    fileStatus: 'new' | 'lose' | 'not_changed' | 'changed',
    modules: {
      similar: Array<RequestMeta>,
      added: Array<RequestMeta>,
      removed: Array<RequestMeta>,
      changed: Array<RequestMeta>,
    },
    requests: [ProfileRequest, ProfileRequest]
  };

  export type CheckedData = {
    success: boolean,
    results: {
      [pageName: string]: {
        success: boolean,
        results: Array<{
          path: Array<string>,
          threshold: number,
          value: number
        }>
      }
    }
  }

  export type Rule = string | RegExp | ((url: string) => boolean) | Array<string | RegExp | Function>;

  export type ProfileConfig = {
    pages: Array<{
      name: string,
      url: string,
      actions: Array<{
        name: string,
        action: (page: Object) => Promise<any>
      }>
    }>,
    throttling?: {
      cpu: number,
      network: 'GPRS'|'Regular2G'|'Good2G'|'Regular3G'|'Good3G'|'Regular4G'|'DSL'|'WiFi'
    },
    count?: number,
    threads?: number,
    platform: 'mobile' | 'desktop',
    browserArgs?: Array<string>,
    buildDataUrl?: string,
    requests?: {
      ignore?: Rule,
      merge?: Rule,
      internalTest?: Rule,
    }
  };

  export function profile(config: ProfileConfig): Promise<ProfileData>;
  export function compare(firstData: ProfileData, secondData: ProfileData): ComparedData;
  export function check(compared: ComparedData): CheckedData;
}
