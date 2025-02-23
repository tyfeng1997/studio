// prompts.ts

export const PHASE_SEARCH_PROMPTS: Record<string, string> = {
  market_position: `As a buy-side analyst researching {company}'s market position, generate specific search queries to find information about:
  1. Current market share and positioning
  2. Brand strength and recognition
  3. Geographic presence and market penetration
  4. Product portfolio and market coverage
  5. Competitive positioning
  
  Output in the exact JSON format:
  {
    "queries": [
      {
        "purpose": "string (what information this query aims to find)",
        "query": "string (the actual search query)",
        "priority": "high" | "medium" | "low",
        "expectedDataType": "market_data" | "competitor_info" | "company_analysis" | "customer_feedback" | "financial_data" | "industry_analysis"
      }
    ],
    "competitorsToTrack": ["competitor1", "competitor2"],
    "keyMetricsToFind": ["market_share", "brand_value", "geographic_coverage"]
  }`,

  competitors: `As a buy-side analyst researching {company}'s competitors, generate specific search queries to find information about:
  1. Direct competitors and their market shares
  2. Emerging competitors and potential threats
  3. Competitive advantages and disadvantages
  4. Recent competitive moves and strategies
  5. Market concentration and competitive intensity
  
  Output in the exact JSON format:
  {
    "queries": [
      {
        "purpose": "string (what information this query aims to find)",
        "query": "string (the actual search query)",
        "priority": "high" | "medium" | "low",
        "expectedDataType": "market_data" | "competitor_info" | "company_analysis" | "customer_feedback" | "financial_data" | "industry_analysis"
      }
    ],
    "competitorsToTrack": ["competitor1", "competitor2"],
    "keyMetricsToFind": ["market_share", "brand_value", "geographic_coverage"]
  }.`,

  financial_performance: `As a buy-side analyst researching {company}'s financial performance, generate specific search queries to find information about:
  1. Revenue growth and profitability trends
  2. Margin analysis and cost structure
  3. Cash flow generation and capital allocation
  4. Balance sheet strength and leverage
  5. Segment performance and mix
  
  Output in the exact JSON format:
  {
    "queries": [
      {
        "purpose": "string (what information this query aims to find)",
        "query": "string (the actual search query)",
        "priority": "high" | "medium" | "low",
        "expectedDataType": "market_data" | "competitor_info" | "company_analysis" | "customer_feedback" | "financial_data" | "industry_analysis"
      }
    ],
    "competitorsToTrack": ["competitor1", "competitor2"],
    "keyMetricsToFind": ["market_share", "brand_value", "geographic_coverage"]
  }`,

  customer_analysis: `As a buy-side analyst researching {company}'s customer base, generate specific search queries to find information about:
  1. Customer segmentation and demographics
  2. Customer acquisition and retention metrics
  3. Customer satisfaction and loyalty
  4. Purchase patterns and behavior
  5. Channel preferences and trends
  
  Output in the exact JSON format:
  {
    "queries": [
      {
        "purpose": "string (what information this query aims to find)",
        "query": "string (the actual search query)",
        "priority": "high" | "medium" | "low",
        "expectedDataType": "market_data" | "competitor_info" | "company_analysis" | "customer_feedback" | "financial_data" | "industry_analysis"
      }
    ],
    "competitorsToTrack": ["competitor1", "competitor2"],
    "keyMetricsToFind": ["market_share", "brand_value", "geographic_coverage"]
  }`,

  industry_trends: `As a buy-side analyst researching {company}'s industry trends, generate specific search queries to find information about:
  1. Industry growth drivers and headwinds
  2. Technological disruption and innovation
  3. Regulatory changes and impacts
  4. Consumer behavior shifts
  5. Supply chain developments
  
  Output in the exact JSON format:
  {
    "queries": [
      {
        "purpose": "string (what information this query aims to find)",
        "query": "string (the actual search query)",
        "priority": "high" | "medium" | "low",
        "expectedDataType": "market_data" | "competitor_info" | "company_analysis" | "customer_feedback" | "financial_data" | "industry_analysis"
      }
    ],
    "competitorsToTrack": ["competitor1", "competitor2"],
    "keyMetricsToFind": ["market_share", "brand_value", "geographic_coverage"]
  }`,
};

export const PHASE_EXTRACTION_PROMPTS: Record<string, string> = {
  market_position: `As a buy-side analyst focusing on market positioning, analyze the provided content about {company} and extract key information in this format:
  
  {
    "extracted": {
      "marketPosition": {
        "overallPosition": "Detailed description of company's current market position",
        "marketShare": {
          "overall": "X%",
          "bySegment": {
            "segment1": "X%",
            "segment2": "Y%"
          },
          "trend": "Description of market share trends"
        },
        "brandStrength": {
          "brandValue": "Quantitative measure if available",
          "brandPerception": "Key findings about brand perception",
          "brandAwareness": "Metrics or qualitative assessment"
        },
        "geographicPresence": {
          "strongMarkets": ["Market1", "Market2"],
          "emergingMarkets": ["Market1", "Market2"],
          "marketExpansionPlans": ["Specific plan 1", "Specific plan 2"]
        },
        "productPortfolio": {
          "keyProducts": ["Product1", "Product2"],
          "marketShareByProduct": {
            "product1": "X%",
            "product2": "Y%"
          },
          "portfolioStrengths": ["Strength1", "Strength2"],
          "portfolioWeaknesses": ["Weakness1", "Weakness2"]
        }
      },
      "keyMetrics": {
        "market_penetration": "X%",
        "market_growth_rate": "X%",
        "relative_market_share": "X%"
      }
    },
    "sourceAssessment": {
      "relevance": "high" | "medium" | "low",
      "reliability": "high" | "medium" | "low",
      "dataFreshness": "date or period of data",
      "keyLimitations": ["limitation1", "limitation2"]
    }
  }`,

  competitors: `As a buy-side analyst focusing on competitive analysis, analyze the provided content about {company} and extract key information in this format:
  
  {
    "extracted": {
      "competitorAnalysis": {
        "directCompetitors": [
          {
            "name": "Competitor1",
            "marketShare": "X%",
            "keyStrengths": ["Strength1", "Strength2"],
            "keyWeaknesses": ["Weakness1", "Weakness2"],
            "recentMoves": ["Strategic move1", "Strategic move2"],
            "threatLevel": "high" | "medium" | "low"
          }
        ],
        "emergingCompetitors": [
          {
            "name": "NewCompetitor1",
            "uniqueValue": "Description of their unique offering",
            "potentialImpact": "Assessment of potential market impact",
            "timelineToImpact": "Estimated timeline for significant impact"
          }
        ],
        "competitiveDynamics": {
          "pricingPressure": "Description with specific examples",
          "innovationPace": "Assessment of innovation rate in industry",
          "entryBarriers": ["Barrier1", "Barrier2"],
          "substitutionRisk": "Analysis of substitution threats"
        }
      },
      "competitiveAdvantages": {
        "sustainable": ["Advantage1 with evidence", "Advantage2 with evidence"],
        "temporary": ["Temporary advantage1", "Temporary advantage2"],
        "quantitativeMetrics": {
          "metric1": "value1",
          "metric2": "value2"
        }
      }
    },
    "sourceAssessment": {
      "relevance": "high" | "medium" | "low",
      "reliability": "high" | "medium" | "low",
      "dataFreshness": "date or period of data",
      "keyLimitations": ["limitation1", "limitation2"]
    }
  }`,

  financial_performance: `As a buy-side analyst focusing on financial analysis, analyze the provided content about {company} and extract key information in this format:
  
  {
    "extracted": {
      "financialMetrics": {
        "growth": {
          "revenue_growth": "X% YoY",
          "ebitda_growth": "X% YoY",
          "earnings_growth": "X% YoY",
          "fcf_growth": "X% YoY"
        },
        "margins": {
          "gross_margin": "X%",
          "operating_margin": "X%",
          "net_margin": "X%",
          "fcf_margin": "X%"
        },
        "efficiency": {
          "asset_turnover": "X",
          "inventory_turnover": "X",
          "days_receivable": "X days",
          "days_payable": "X days"
        },
        "returns": {
          "roe": "X%",
          "roic": "X%",
          "roa": "X%"
        }
      },
      "financialHealth": {
        "liquidityMetrics": {
          "current_ratio": "X",
          "quick_ratio": "X",
          "cash_ratio": "X"
        },
        "debtMetrics": {
          "debt_to_equity": "X",
          "net_debt_to_ebitda": "X",
          "interest_coverage": "X"
        }
      },
      "cashFlowAnalysis": {
        "operatingCashFlow": {
          "amount": "X million",
          "quality": "Analysis of cash flow quality",
          "trends": "Description of trends"
        },
        "capitalAllocation": {
          "capex": "X million",
          "acquisitions": "X million",
          "dividends": "X million",
          "buybacks": "X million"
        }
      },
      "segmentPerformance": {
        "segment1": {
          "revenue": "X million",
          "growth": "X%",
          "margin": "X%"
        }
      }
    },
    "sourceAssessment": {
      "relevance": "high" | "medium" | "low",
      "reliability": "high" | "medium" | "low",
      "dataFreshness": "date or period of data",
      "keyLimitations": ["limitation1", "limitation2"]
    }
  }`,

  customer_analysis: `As a buy-side analyst focusing on customer analysis, analyze the provided content about {company} and extract key information in this format:
  
  {
    "extracted": {
      "customerSegments": {
        "primarySegments": [
          {
            "name": "Segment1",
            "size": "X% of revenue",
            "characteristics": ["Characteristic1", "Characteristic2"],
            "needs": ["Need1", "Need2"],
            "growthRate": "X% YoY"
          }
        ],
        "emergingSegments": [
          {
            "name": "NewSegment1",
            "potentialSize": "Estimated size",
            "growthPotential": "Growth projection",
            "entryStrategy": "Company's approach"
          }
        ]
      },
      "customerMetrics": {
        "acquisition": {
          "cac": "Customer Acquisition Cost",
          "conversionRate": "X%",
          "acquisitionChannels": [
            {
              "channel": "Channel1",
              "effectiveness": "Metrics or description",
              "cost": "Cost metrics"
            }
          ]
        },
        "retention": {
          "churnRate": "X%",
          "retentionRate": "X%",
          "customerLifetime": "X months/years",
          "ltv": "Lifetime Value"
        },
        "satisfaction": {
          "nps": "Net Promoter Score",
          "satisfactionScore": "X/10",
          "keyIssues": ["Issue1", "Issue2"]
        }
      },
      "customerBehavior": {
        "purchasePatterns": {
          "frequency": "Average purchase frequency",
          "basketSize": "Average order value",
          "seasonality": "Seasonal patterns"
        },
        "channelPreferences": {
          "channel1": "X% usage",
          "channel2": "Y% usage"
        }
      },
      "customerFeedback": {
        "positiveThemes": ["Theme1", "Theme2"],
        "negativeThemes": ["Theme1", "Theme2"],
        "productRequests": ["Request1", "Request2"]
      }
    },
    "sourceAssessment": {
      "relevance": "high" | "medium" | "low",
      "reliability": "high" | "medium" | "low",
      "dataFreshness": "date or period of data",
      "keyLimitations": ["limitation1", "limitation2"]
    }
  }`,

  industry_trends: `As a buy-side analyst focusing on industry trends, analyze the provided content about {company} and extract key information in this format:
  
  {
    "extracted": {
      "marketTrends": {
        "growthDrivers": [
          {
            "trend": "Trend1",
            "impact": "Specific impact on market",
            "timeline": "Expected timeline",
            "magnitude": "Size of impact"
          }
        ],
        "disruptiveForces": [
          {
            "force": "Force1",
            "potentialImpact": "Impact assessment",
            "probability": "high" | "medium" | "low",
            "timeframe": "Expected timeline"
          }
        ],
        "regulatoryChanges": [
          {
            "regulation": "Regulation1",
            "impact": "Specific impact",
            "status": "Current status",
            "timeline": "Implementation timeline"
          }
        ]
      },
      "technologyTrends": {
        "emergingTechnologies": [
          {
            "technology": "Technology1",
            "maturity": "Current state",
            "adoptionRate": "Market adoption rate",
            "companyPosition": "Company's position"
          }
        ],
        "digitalTransformation": {
          "industryProgress": "Overall industry progress",
          "companyProgress": "Company's progress",
          "keyInitiatives": ["Initiative1", "Initiative2"]
        }
      },
      "consumerTrends": {
        "changingPreferences": ["Trend1", "Trend2"],
        "demographicShifts": ["Shift1", "Shift2"],
        "behavioralChanges": ["Change1", "Change2"]
      },
      "competitiveLandscape": {
        "industryConsolidation": "Analysis of M&A trends",
        "newEntrants": ["NewPlayer1", "NewPlayer2"],
        "exitingPlayers": ["ExitingPlayer1", "ExitingPlayer2"],
        "powerDynamics": "Changes in competitive dynamics"
      },
      "supplyChainTrends": {
        "rawMaterials": "Trends in raw materials",
        "logistics": "Changes in logistics",
        "sustainability": "Sustainability initiatives"
      }
    },
    "sourceAssessment": {
      "relevance": "high" | "medium" | "low",
      "reliability": "high" | "medium" | "low",
      "dataFreshness": "date or period of data",
      "keyLimitations": ["limitation1", "limitation2"]
    }
  }`,
};
