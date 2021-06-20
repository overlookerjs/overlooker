declare module "overlooker" {
  export type ProfileData = {
    [pageName: string]: PageData
  };

  export type AggregatedValue = {
    q1: number,
    q3: number,
    percentile98: number,
    percentile02: number,
    mde: number,
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
    network: ProfileNetwork,
    screenshots: ProfileScreenshots,
    tracing: {
      type: 'zip',
      data: ProfileTracingsZip
    } | {
      type: 'json',
      data: ProfileTracingsJson
    }
  };

  export type AggregationSlices<T> = {
    max: T,
    min: T,
    q1: T,
    q3: T,
    percentile98: T,
    percentile02: T,
    median: T,
    mean: T,
  };

  export type ProfileScreenshots = WeightedAggregation<ProfileScreenshotsSection>

  export type ProfileScreenshotsSection = {
    weight: number,
    weightType: string,
    snapshots: Array<{
      timestamp: number,
      snapshot: string
    }>,
    events: Array<{
      name: string,
      value: number
    }>
  }

  export type FlameChartNode = {
    name: string,
    start: number,
    duration: number,
    type?: string,
    color?: string,
    children?: FlameChartList
  };

  export type FlameChartList = Array<FlameChartNode>;

  export type ProfileTracingsJson = WeightedAggregation<{
    weight: number,
    weightType: string,
    data: {
      data: FlameChartList,
      waterfall: Array<{
        name: string,
        timing: {
          requestStart: number,
          responseStart: number,
          responseEnd: number,
        }
      }>,
      marks: Array<{
        name: string,
        timestamps: number
      }>
    }
  }>;

  export type ProfileTracingsZip = WeightedAggregation<{
    weight: number,
    weightType: string,
    data: Buffer,
  }>;

  export type WeightedAggregation<T extends { weight: number, weightType: string}> = AggregationSlices<T>;

  export type ProfileActions = {
    [actionName: string]: ProfileAction
  };

  export type ProfileAction = {
    network: ProfileNetwork,
    stats: ActionStats
  };

  export type ActionStats = {
    evaluation: ProfileStatsEvaluation,
    resources: ProfileStatsResources,
    timings: ActionsTimings
  };

  export type ActionsTimings = {
    start: AggregatedValue,
    end: AggregatedValue
  };

  export type ProfileStats = {
    evaluation: ProfileStatsEvaluation,
    resources: ProfileStatsResources,
    timings: ProfileStatsTimings,
    userCentric: ProfileStatsUserCentric,
    coverage: ProfileStatsCoverage,
    custom: ProfileStatsCustom
  };

  export type ProfileStatsEvaluation = {
    external: AggregatedValue,
    internal: AggregatedValue,
    total: AggregatedValue
  };

  export type ProfileStatsCoverage = {
    internal: ProfileStatsCoverageSection
    external: ProfileStatsCoverageSection
  };

  export type ProfileStatsCustom = {
    timings: {
      [dottedName: string]: number
    },
    durations: {
      [dottedName: string]: number | {
        total: number,
        count: number
      },
    }
  };

  export type ProfileStatsCoverageSection = {
    js: CoverageStats,
    css: CoverageStats
  };

  export type CoverageStats = {
    absolute: {
      total: number,
      unused: number,
      used: number,
    },
    percent: {
      used: number,
      unused: number
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
    elementsTimings: {
      [elementTimingName: string]: {
        visiblePercent: AggregatedValue,
        timings: {
          fetchStart: AggregatedValue,
          loadComplete: AggregatedValue,
          loadAndAssociated: AggregatedValue,
          render: AggregatedValue,
          duration: AggregatedValue
        } | {
          render: AggregatedValue
        }
      }
    },
    layersPaints: {
      [layerName: string]: {
        firstPaint: AggregatedValue,
        lastPaint: AggregatedValue
      }
    },
    timeToInteractive: AggregatedValue
  };

  export type ProfileNetwork = Array<ProfileRequest>;

  export type ProfileRequest = {
    stats: {
      size: number,
      transfer: number,
      evaluationTotal: number,
      timings: {
        start: number,
        response: number,
        firstByte: number,
        finish: number,
        total: number
      },
      coverage?: CoverageStats,
    },
    evaluation: Array<{
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
    extension: string,
    status: number,
    method: string
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
    [pageName: string]: ComparedPageData
  };

  export type ComparedPageData = {
    absolute: ComparedDataAbsolute,
    percent: ComparedDataPercent
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
      [pageName: string]: CheckedPageData
    }
  };

  export type CheckedPageData = {
    success: boolean,
    results: Array<{
      splitPath: Array<string>,
      path: string,
      threshold: number,
      value: number,
      difference: number,
      status: 'warning' | 'worsening' | 'partial_worsening' | 'improvement' | 'partial_improvement' | 'without_changes'
    }>
  };

  export type BuildData = Object;

  export type Rule = string | RegExp | ((url: string) => boolean | string) | Array<string | RegExp | Function>;

  export type Cookies = Array<{
    name: string,
    value: string,
    domain: string
  }>;

  export type ProfileConfigPages = Array<{
    name: string,
    url: string,
    cookies?: Cookies,
    layers: {
      [layerName: string]: string // layer selector
    },
    actions?: Array<{
      name: string,
      layers: {
        [layerName: string]: string // layer selector
      },
      action: (page: Object) => Promise<void>
    }>
  }>;

  export type ProfileConfig = {
    pages: ProfileConfigPages,
    host?: string,
    throttling?: {
      cpu?: number,
      network?: 'GPRS' | 'Regular2G' | 'Good2G' | 'Regular3G' | 'Good3G' | 'Regular4G' | 'DSL' | 'WiFi'
    },
    cookies?: Cookies,
    cache?: {
      type: 'wpr' | 'mitmdump',
      logger?: (message: string) => Promise<any>
    } | {
      type: 'proxy',
      host: string,
      start?: () => Promise<any>,
      stop?: () => Promise<any>,
      postDataHandler?: (url: string, postData: string) => string,
      responseDataHandler?: (url: string, postData: string, response: string) => string
    } | {
      type: 'synthetic',
      resources?: {
        [page: string]: {
          [url: string]: {
            method: string,
            priority: string,
            url: string,
            headers: Array<{
              name: string,
              value: string
            }>,
            status: string,
            contentType: string,
            mimeType: string,
            size: number,
            postData: string,
            body: string,
          }
        }
      },
      postDataHandler?: (url: string, postData: string) => string,
      responseDataHandler?: (url: string, postData: string, response: string) => string
    },
    firstEvent?: string,
    count?: number,
    threads?: number,
    logger?: (message: string) => Promise<any>,
    progress?: (progress: number) => Promise<any>,
    checkStatus?: () => Promise<boolean>,
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
    },
    customMetrics?: {
      timing?: RegExp,
      durationStart?: RegExp,
      durationEnd?: RegExp
    },
    debug: boolean
  };

  export type Thresholds = { [path: string]: number };

  export type ThresholdsByPage = {
    [pageName: string]: Thresholds
  }

  export type ImpactDescriptionElement = {
    type: 'link' | 'script',
    content: string,
    location: PageElementLocation,
    request: null,
    modules: string,
    hash: string,
    attributes: {
      [attributeName: string]: string
    }
  };

  export type PageElementLocation = 'head' | 'body';

  export type ImpactDifferenceSection = {
    isSame: boolean,
    difference: {
      same: Array<ImpactDescriptionElement>,
      new: Array<ImpactDescriptionElement>,
      deleted: Array<ImpactDescriptionElement>,
      disordered: Array<ImpactDescriptionElement>,
    }
  };

  export type ImpactDifference = {
    [pageName: string]: {
      load: ImpactDifferenceSection,
      actions: {
        [actionName: string]: ImpactDifferenceSection
      }
    }
  };

  export type ImpactDescriptionSection = {
    hash: string,
    elements: Array<ImpactDescriptionElement>
  };

  export type ImpactDescriptions = {
    [pageName: string]: {
      load: ImpactDescriptionSection,
      actions: {
        [actionName: string]: ImpactDescriptionSection
      }
    }
  };

  export type ImpactData = {
    difference: ImpactDifference,
    descriptions: ImpactDescriptions,
    pages: ProfileConfigPages
  };

  export function profile(config: ProfileConfig): Promise<ProfileData>;

  export function comparePages(firstData: ProfileData, secondData: ProfileData, onlyStats: boolean): ComparedData;

  export function checkPages(compared: ComparedData, thresholdsByPage: ThresholdsByPage): CheckedData;

  export function compare(firstPage: PageData, secondPage: PageData, onlyStats: boolean): ComparedPageData;

  export function check(comparedPageData: ComparedPageData, thresholds: Thresholds): CheckedPageData;

  export function merge(profileData: ProfileData): PageData;

  export function impactAnalysis(
    previousDescription: ImpactDescriptions | null,
    config: ProfileConfig,
    elementsFilter: (element: ImpactDescriptionElement, pageName: string, actionName: string | null) => boolean
  ): ImpactData;

  export function affectConfigByImpact(
    config: ProfileConfig,
    impact: ImpactData
  ): ProfileConfig
}
