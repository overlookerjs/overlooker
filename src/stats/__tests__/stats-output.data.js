module.exports.stats = {
  'coverage': {
    'external': {
      'css': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      },
      'js': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      }
    },
    'internal': {
      'css': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      },
      'js': {
        'absolute': {
          'total': 226738,
          'unused': 145779,
          'used': 80959
        },
        'percent': {
          'unused': 0.6429403099612769,
          'used': 0.3570596900387231
        }
      }
    },
    'total': {
      'css': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      },
      'js': {
        'absolute': {
          'total': 226738,
          'unused': 145779,
          'used': 80959
        },
        'percent': {
          'unused': 0.6429403099612769,
          'used': 0.3570596900387231
        }
      }
    }
  },
  'custom': {
    'durations': {
      'render': 10876
    },
    'timings': {
      'react': {
        'mounted': 227938
      }
    }
  },
  'elementsTimings': {},
  'evaluation': {
    'external': {
      'EvaluateScript': 38.995,
      'total': 38.995
    },
    'internal': {
      'EvaluateScript': 50.434,
      'ParseHTML': 1.8629999999999967,
      'total': 52.297
    },
    'total': {
      'EvaluateScript': 89.429,
      'ParseHTML': 1.8629999999999967,
      'total': 91.292
    }
  },
  'layersPaints': {
    'main': {
      'firstPaint': -1381477557757,
      'lastPaint': -1381477557757
    }
  },
  'resources': {
    'external': {
      'css': {
        'size': 0,
        'transfer': 0
      },
      'fonts': {
        'size': 0,
        'transfer': 0
      },
      'html': {
        'size': 0,
        'transfer': 0
      },
      'images': {
        'size': 0,
        'transfer': 0
      },
      'js': {
        'size': 0,
        'transfer': 0
      },
      'total': {
        'size': 0,
        'transfer': 0
      }
    },
    'internal': {
      'css': {
        'size': 216,
        'transfer': 364
      },
      'fonts': {
        'size': 0,
        'transfer': 0
      },
      'html': {
        'size': 335,
        'transfer': 459
      },
      'images': {
        'size': 192890,
        'transfer': 193042
      },
      'js': {
        'size': 226123,
        'transfer': 226288
      },
      'total': {
        'size': 419564,
        'transfer': 420153
      }
    },
    'total': {
      'css': {
        'size': 216,
        'transfer': 364
      },
      'fonts': {
        'size': 0,
        'transfer': 0
      },
      'html': {
        'size': 335,
        'transfer': 459
      },
      'images': {
        'size': 192890,
        'transfer': 193042
      },
      'js': {
        'size': 226123,
        'transfer': 226288
      },
      'total': {
        'size': 419564,
        'transfer': 420153
      }
    }
  },
  'timings': {
    'domComplete': 228783,
    'domContentLoadedEventEnd': 228487,
    'domContentLoadedEventStart': 217445,
    'domInteractive': 217410,
    'firstContentfulPaint': 86268,
    'firstImagePaint': 86268,
    'firstMeaningfulPaint': 246702,
    'firstPaint': 86268,
    'largestContentfulPaint': 166262,
    'loadEventEnd': 228817,
    'loadEventStart': 228805
  },
  'userCentric': {
    'cumulativeLayoutShift': 0,
    'lighthouseScore': 100,
    'speedIndex': 206549.50013160706,
    'timeToInteractive': 207845.00000087428,
    'totalBlockingTime': 20611.000000000004
  }
};

module.exports.coverage = [
  {
    'url': 'http://localhost:3000/main.0dd46d15.js',
    'absolute': {
      'total': 226738,
      'unused': 145779,
      'used': 80959
    },
    'percent': {
      'used': 0.3570596900387231,
      'unused': 0.6429403099612769
    }
  }
];

module.exports.network = [
  {
    'evaluation': [
      {
        'duration': 1.136,
        'timings': {
          'end': 51436,
          'start': 50300
        },
        'type': 'ParseHTML'
      },
      {
        'duration': 0.7269999999999968,
        'timings': {
          'end': 218092,
          'start': 217365
        },
        'type': 'ParseHTML'
      }
    ],
    'extension': 'html',
    'internal': true,
    'method': 'GET',
    'priority': 'VeryHigh',
    'stats': {
      'coverage': undefined,
      'evaluation': 1.8629999999999967,
      'size': 335,
      'timings': {
        'finish': 49978,
        'firstByte': 49651,
        'response': 3229,
        'start': 3196,
        'total': 46782
      },
      'transfer': 459
    },
    'status': 200,
    'type': 'text/html',
    'url': 'http://localhost:3000/'
  },
  {
    'evaluation': undefined,
    'extension': 'css',
    'internal': true,
    'method': 'GET',
    'priority': 'VeryHigh',
    'stats': {
      'coverage': undefined,
      'evaluation': undefined,
      'size': 216,
      'timings': {
        'finish': 55898,
        'firstByte': 55642,
        'response': 55533,
        'start': 50545,
        'total': 5353
      },
      'transfer': 364
    },
    'status': 200,
    'type': 'text/css',
    'url': 'http://localhost:3000/main.css'
  },
  {
    'evaluation': undefined,
    'extension': 'png',
    'internal': true,
    'method': 'GET',
    'priority': 'Low',
    'stats': {
      'coverage': undefined,
      'evaluation': undefined,
      'size': 192890,
      'timings': {
        'finish': 155251,
        'firstByte': 65591,
        'response': 65488,
        'start': 50759,
        'total': 104492
      },
      'transfer': 193042
    },
    'status': 200,
    'type': 'image/png',
    'url': 'http://localhost:3000/ccae0a22976b2ce9ab1d31b8d7eb3e57.png'
  },
  {
    'evaluation': [
      {
        'duration': 50.434,
        'timings': {
          'end': 217317.99999999997,
          'start': 166884
        },
        'type': 'EvaluateScript'
      }
    ],
    'priority': 'Medium',
    'extension': 'js',
    'internal': true,
    'method': 'GET',
    'stats': {
      'coverage': {
        'absolute': {
          'total': 226738,
          'unused': 145779,
          'used': 80959
        },
        'percent': {
          'unused': 0.6429403099612769,
          'used': 0.3570596900387231
        }
      },
      'evaluation': 50.434,
      'size': 226123,
      'timings': {
        'finish': 164812,
        'firstByte': 65936,
        'response': 65846,
        'start': 50927,
        'total': 113885
      },
      'transfer': 226288
    },
    'status': 200,
    'type': 'application/javascript',
    'url': 'http://localhost:3000/main.0dd46d15.js'
  }
];

module.exports.testActionStats = {
  'coverage': {
    'external': {
      'css': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      },
      'js': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      }
    },
    'internal': {
      'css': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      },
      'js': {
        'absolute': {
          'total': 1606,
          'unused': 606,
          'used': 1000
        },
        'percent': {
          'unused': 0.37733499377334995,
          'used': 0.6226650062266501
        }
      }
    },
    'total': {
      'css': {
        'absolute': {
          'total': 0,
          'unused': 0,
          'used': 0
        },
        'percent': {
          'unused': 0,
          'used': 0
        }
      },
      'js': {
        'absolute': {
          'total': 1606,
          'unused': 606,
          'used': 1000
        },
        'percent': {
          'unused': 0.37733499377334995,
          'used': 0.6226650062266501
        }
      }
    }
  },
  'custom': {
    'durations': {
      'handle': {
        'click': 521310
      },
      'image-loading': 520143
    },
    'timings': {
      'main-button': {
        'click': 37283
      }
    }
  },
  'elementsTimings': {},
  'evaluation': {
    'external': {
      'total': 0
    },
    'internal': {
      'total': 0
    },
    'total': {
      'total': 0
    }
  },
  'layersPaints': {
    'main-action': {
      'firstPaint': -1381477895630,
      'lastPaint': -1381477895630
    }
  },
  'resources': {
    'external': {
      'css': {
        'size': 0,
        'transfer': 0
      },
      'fonts': {
        'size': 0,
        'transfer': 0
      },
      'html': {
        'size': 0,
        'transfer': 0
      },
      'images': {
        'size': 0,
        'transfer': 0
      },
      'js': {
        'size': 0,
        'transfer': 0
      },
      'total': {
        'size': 0,
        'transfer': 0
      }
    },
    'internal': {
      'css': {
        'size': 216,
        'transfer': 364
      },
      'fonts': {
        'size': 0,
        'transfer': 0
      },
      'html': {
        'size': 335,
        'transfer': 0
      },
      'images': {
        'size': 7422,
        'transfer': 7572
      },
      'js': {
        'size': 1606,
        'transfer': 1769
      },
      'total': {
        'size': 9579,
        'transfer': 9705
      }
    },
    'total': {
      'css': {
        'size': 216,
        'transfer': 364
      },
      'fonts': {
        'size': 0,
        'transfer': 0
      },
      'html': {
        'size': 335,
        'transfer': 0
      },
      'images': {
        'size': 7422,
        'transfer': 7572
      },
      'js': {
        'size': 1606,
        'transfer': 1769
      },
      'total': {
        'size': 9579,
        'transfer': 9705
      }
    }
  },
  'timings': {
    'end': 562426,
    'start': 0
  }
};

module.exports.testActionNetwork = [
  {
    'extension': 'html',
    'evaluation': undefined,
    'internal': true,
    'priority': 'High',
    'method': 'GET',
    'stats': {
      'coverage': undefined,
      'evaluation': undefined,
      'size': 335,
      'timings': {
        'finish': -28396,
        'firstByte': -28531,
        'response': -28830,
        'start': -31556,
        'total': 3160
      },
      'transfer': 0
    },
    'status': 200,
    'type': 'text/html',
    'url': 'http://localhost:3000/'
  },
  {
    'evaluation': undefined,
    'extension': 'css',
    'internal': true,
    'method': 'GET',
    'priority': 'VeryHigh',
    'stats': {
      'coverage': undefined,
      'evaluation': undefined,
      'size': 216,
      'timings': {
        'finish': -25769,
        'firstByte': -26101,
        'response': -26348,
        'start': -31250,
        'total': 5481
      },
      'transfer': 364
    },
    'status': 200,
    'type': 'text/css',
    'url': 'http://localhost:3000/main.css'
  },
  {
    'evaluation': undefined,
    'extension': 'js',
    'priority': 'Low',
    'internal': true,
    'method': 'GET',
    'stats': {
      'coverage': {
        'absolute': {
          'total': 1606,
          'unused': 606,
          'used': 1000
        },
        'percent': {
          'unused': 0.37733499377334995,
          'used': 0.6226650062266501
        }
      },
      'size': 1606,
      'evaluation': undefined,
      'timings': {
        'finish': 37619,
        'firstByte': 36853,
        'response': 36654,
        'start': 24536,
        'total': 13083
      },
      'transfer': 1769
    },
    'status': 200,
    'type': 'application/javascript',
    'url': 'http://localhost:3000/1.1d86ad80.js'
  },
  {
    'evaluation': undefined,
    'extension': 'png',
    'internal': true,
    'method': 'GET',
    'priority': 'Low',
    'stats': {
      'coverage': undefined,
      'evaluation': undefined,
      'size': 7422,
      'timings': {
        'finish': 554556,
        'firstByte': 553249,
        'response': 552060,
        'start': 545165,
        'total': 9391
      },
      'transfer': 7572
    },
    'status': 200,
    'type': 'image/png',
    'url': 'http://localhost:3000/eac2c5c08102bd20a0d2b6c8615d4b1f.png'
  }
];

module.exports.testActionCoverage = [
  {
    'url': 'http://localhost:3000/main.0dd46d15.js',
    'absolute': {
      'total': 226738,
      'unused': 171899,
      'used': 54839
    },
    'percent': {
      'used': 0.24186064973670052,
      'unused': 0.7581393502632995
    }
  },
  {
    'url': 'http://localhost:3000/1.1d86ad80.js',
    'absolute': {
      'total': 1606,
      'unused': 606,
      'used': 1000
    },
    'percent': {
      'used': 0.6226650062266501,
      'unused': 0.37733499377334995
    }
  }
];
