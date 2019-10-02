declare module "overlooker" {
  export type ProfileData = {
    [pageName: string]: PageData
  };

  export type AggregatedValue = {
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
    start: AggregatedValue,
    end: AggregatedValue
  };

  export type ProfileStats = {
    evaluating: ProfileStatsEvaluating,
    resources: ProfileStatsResources,
    timings: ProfileStatsTimings,
    userCentric: ProfileStatsUserCentric,
    coverage: ProfileStatsCoverage
  };

  export type ProfileStatsEvaluating = {
    externalScriptEvaluating: AggregatedValue,
    internalScriptEvaluating: AggregatedValue,
    totalScriptEvaluating: AggregatedValue
  };

  export type ProfileStatsCoverage = {
    internal: ProfileStatsCoverageSection
    external: ProfileStatsCoverageSection
  };

  export type ProfileStatsCoverageSection = {
    js: {
      used: number,
      total: number
    },
    css: {
      used: number,
      total: number
    }
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
    size: AggregatedValue,
    transfer: AggregatedValue
  };

  export type ProfileStatsTimings = {
    firstMeaningfulPaint: AggregatedValue,
    firstMeaningfulPaintCandidate: AggregatedValue,
    firstPaint: AggregatedValue,
    firstTextPaint: AggregatedValue,
    firstImagePaint: AggregatedValue,
    firstContentfulPaint: AggregatedValue,
    domContentLoadedEventStart: AggregatedValue,
    domContentLoadedEventEnd: AggregatedValue,
    loadEventStart: AggregatedValue,
    loadEventEnd: AggregatedValue,
    domInteractive: AggregatedValue,
    domComplete: AggregatedValue
  };

  export type ProfileStatsUserCentric = {
    speedIndex: AggregatedValue,
    heroElementFirstPaint: AggregatedValue,
    heroElementLastPaint: AggregatedValue
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
    coverage?: {
      total: number,
      used: number,
      ranges: Array<{
        start: number,
        end: number
      }>
    },
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

  export type BuildData = Object;

  export type Rule = string | RegExp | ((url: string) => boolean) | Array<string | RegExp | Function>;

  export type ProfileConfig = {
    pages: Array<{
      name: string,
      url: string,
      heroElement: string,
      actions: Array<{
        name: string,
        action: (page: Object) => Promise<void>
      }>
    }>,
    throttling?: {
      cpu?: number,
      network?: 'GPRS' | 'Regular2G' | 'Good2G' | 'Regular3G' | 'Good3G' | 'Regular4G' | 'DSL' | 'WiFi'
    },
    cookies?: Array<{
      name: string,
      value: string,
      domain: string
    }>,
    proxy?: {
      address: string,
      restart: () => Promise<void>
    },
    firstEvent?: string,
    count?: number,
    threads?: number,
    logger?: (...args: Array<string>) => Promise<any>,
    platform?: 'mobile' | 'desktop',
    browserArgs?: Array<string>,
    buildData?: {
      url?: string,
      getter?: (url: string) => Promise<BuildData>
    },
    requests?: {
      ignore?: Rule,
      merge?: Rule,
      internalTest?: Rule,
    }
  };

  export function profile(config: ProfileConfig): Promise<ProfileData>;

  export function compare(firstData: ProfileData, secondData: ProfileData): ComparedData;

  export function check(compared: ComparedData, thresholds: { [path: string]: number }): CheckedData;
}
