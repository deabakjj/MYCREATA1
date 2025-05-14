/**
 * 평판 그래프 컨트롤러
 * 
 * 사용자의 온체인 활동 기반 평판 그래프 관련 API 엔드포인트 처리를 담당하는 컨트롤러입니다.
 * 그래프 조회, 평판 점수 계산, AI 분석 기능을 제공합니다.
 */

const reputationGraphService = require('../../services/reputationGraphService');
const { responseHandler } = require('../../utils/responseHandler');
const { ApiError } = require('../../utils/errors');
const { validateRequest } = require('../middlewares/validationMiddleware');
const logger = require('../../utils/logger');

/**
 * 사용자 평판 점수 조회
 * 
 * @route GET /api/reputation/users/:userId/scores
 * @access 공개
 */
exports.getUserReputationScores = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const scores = await reputationGraphService.getUserReputationScores(userId);

    return responseHandler.success(res, { scores });
  } catch (error) {
    logger.error('사용자 평판 점수 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 사용자 평판 그래프 조회
 * 
 * @route GET /api/reputation/users/:userId/graph
 * @access 공개
 */
exports.getUserReputationGraph = [
  validateRequest({
    query: {
      depth: { type: 'number', required: false, default: 2, min: 1, max: 3 },
      maxNodes: { type: 'number', required: false, default: 100, min: 10, max: 500 },
      nodeTypes: { type: 'array', required: false },
      edgeTypes: { type: 'array', required: false },
      minStrength: { type: 'number', required: false, default: 0.2, min: 0, max: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const options = {
        depth: parseInt(req.query.depth) || 2,
        maxNodes: parseInt(req.query.maxNodes) || 100,
        nodeTypes: req.query.nodeTypes,
        edgeTypes: req.query.edgeTypes,
        minStrength: parseFloat(req.query.minStrength) || 0.2
      };

      const graph = await reputationGraphService.getUserReputationGraph(userId, options);

      return responseHandler.success(res, { graph });
    } catch (error) {
      logger.error('사용자 평판 그래프 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 사용자 평판 점수 계산 작업 시작
 * 
 * @route POST /api/reputation/users/:userId/compute
 * @access 인증 필요 (본인 또는 관리자)
 */
exports.computeUserReputation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.user.id;
    
    // 본인 또는 관리자만 계산 작업 가능
    if (userId !== requestUserId && !req.user.isAdmin) {
      throw new ApiError(403, '권한이 없습니다.');
    }

    const computation = await reputationGraphService.startUserReputationComputation(userId);

    return responseHandler.success(res, {
      computation,
      message: '평판 계산 작업이 시작되었습니다. 작업 ID를 통해 진행 상황을 확인할 수 있습니다.'
    }, 202);
  } catch (error) {
    logger.error('사용자 평판 계산 작업 시작 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 계산 작업 상태 조회
 * 
 * @route GET /api/reputation/computations/:computationId
 * @access 인증 필요 (관리자)
 */
exports.getComputationStatus = async (req, res, next) => {
  try {
    const { computationId } = req.params;
    
    // 계산 작업 정보 조회 (ReputationComputation 모델)
    const { ReputationComputation } = require('../../models/reputationGraph');
    const computation = await ReputationComputation.findById(computationId);
    
    if (!computation) {
      throw new ApiError(404, '계산 작업을 찾을 수 없습니다.');
    }

    return responseHandler.success(res, { computation });
  } catch (error) {
    logger.error('계산 작업 상태 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 평판 그래프 시각화 데이터 생성
 * 
 * @route GET /api/reputation/users/:userId/visualization
 * @access 공개
 */
exports.getReputationVisualization = [
  validateRequest({
    query: {
      layout: { type: 'string', required: false, enum: ['force', 'radial', 'circular'], default: 'force' },
      includeLabels: { type: 'boolean', required: false, default: true },
      colorScheme: { type: 'string', required: false, enum: ['default', 'pastel', 'dark'], default: 'default' },
      maxNodes: { type: 'number', required: false, default: 100, min: 10, max: 300 }
    }
  }),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const options = {
        layout: req.query.layout || 'force',
        includeLabels: req.query.includeLabels !== 'false',
        colorScheme: req.query.colorScheme || 'default',
        maxNodes: parseInt(req.query.maxNodes) || 100
      };

      const visualizationData = await reputationGraphService.getReputationGraphVisualization(
        userId,
        options
      );

      return responseHandler.success(res, { visualization: visualizationData });
    } catch (error) {
      logger.error('평판 그래프 시각화 데이터 생성 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * AI 기반 사용자 평판 분석 및 인사이트
 * 
 * @route GET /api/reputation/users/:userId/insights
 * @access 인증 필요 (본인 또는 관리자)
 */
exports.getAIReputationInsights = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.user.id;
    
    // 본인 또는 관리자만 AI 인사이트 조회 가능
    if (userId !== requestUserId && !req.user.isAdmin) {
      throw new ApiError(403, '권한이 없습니다.');
    }

    const insights = await reputationGraphService.getAIReputationInsights(userId);

    return responseHandler.success(res, { insights });
  } catch (error) {
    logger.error('AI 평판 분석 인사이트 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 평판 점수 비교 (사용자 vs 평균)
 * 
 * @route GET /api/reputation/users/:userId/comparison
 * @access 공개
 */
exports.getReputationComparison = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // 사용자 점수 조회
    const userScores = await reputationGraphService.getUserReputationScores(userId);
    
    // 평균 점수 조회 (별도 구현 필요)
    // 임시 구현: 고정 평균 점수 반환
    const avgScores = [
      { domain: '전반적', score: 65, confidence: 0.8 },
      { domain: '커뮤니티', score: 60, confidence: 0.7 },
      { domain: '미션', score: 55, confidence: 0.75 },
      { domain: '콘텐츠', score: 62, confidence: 0.65 },
      { domain: '신뢰도', score: 70, confidence: 0.8 }
    ];
    
    // 순위 정보 (백분위수)
    // 임시 구현: 랜덤 백분위수 생성 (실제로는 데이터베이스 조회 필요)
    const percentiles = {};
    userScores.forEach(score => {
      percentiles[score.domain] = Math.floor(Math.random() * 100);
    });
    
    // 비교 결과 구성
    const comparison = userScores.map(score => {
      const avg = avgScores.find(a => a.domain === score.domain) || 
                { domain: score.domain, score: 50, confidence: 0.5 };
      
      return {
        domain: score.domain,
        user: {
          score: score.score,
          confidence: score.confidence
        },
        average: {
          score: avg.score,
          confidence: avg.confidence
        },
        difference: score.score - avg.score,
        percentile: percentiles[score.domain] || 50
      };
    });
    
    return responseHandler.success(res, { comparison });
  } catch (error) {
    logger.error('평판 비교 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 특정 도메인의 상위 사용자 목록 조회
 * 
 * @route GET /api/reputation/domains/:domain/top-users
 * @access 공개
 */
exports.getTopUsersByDomain = [
  validateRequest({
    params: {
      domain: { type: 'string', required: true, enum: ['전반적', '커뮤니티', '미션', '콘텐츠', '신뢰도'] }
    },
    query: {
      limit: { type: 'number', required: false, default: 10, min: 1, max: 100 }
    }
  }),
  async (req, res, next) => {
    try {
      const { domain } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      // 사용자 평판 점수 모델
      const { UserReputationScore } = require('../../models/reputationGraph');
      
      // 상위 사용자 조회
      const topScores = await UserReputationScore.find({ domain })
        .sort({ score: -1 })
        .limit(limit)
        .populate('user', 'username name profileImage')
        .lean();
      
      // 사용자 정보 포함하여 반환
      const topUsers = topScores.map((score, index) => ({
        rank: index + 1,
        userId: score.user._id,
        username: score.user.username,
        name: score.user.name,
        profileImage: score.user.profileImage,
        score: score.score,
        confidence: score.confidence
      }));
      
      return responseHandler.success(res, { 
        domain,
        topUsers 
      });
    } catch (error) {
      logger.error('상위 사용자 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 전체 평판 그래프 데이터 통계
 * 
 * @route GET /api/reputation/stats
 * @access 인증 필요 (관리자만)
 */
exports.getReputationGraphStats = async (req, res, next) => {
  try {
    // 관리자 권한 확인
    if (!req.user.isAdmin) {
      throw new ApiError(403, '권한이 없습니다.');
    }
    
    // 모델 임포트
    const { 
      ReputationNode, 
      ReputationEdge, 
      UserReputationScore 
    } = require('../../models/reputationGraph');
    
    // 노드 유형별 통계
    const nodeStats = await ReputationNode.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 엣지 유형별 통계
    const edgeStats = await ReputationEdge.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 평판 점수 영역별 통계
    const scoreStats = await UserReputationScore.aggregate([
      { 
        $group: { 
          _id: '$domain', 
          avgScore: { $avg: '$score' },
          minScore: { $min: '$score' },
          maxScore: { $max: '$score' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 최근 계산 작업 통계
    const { ReputationComputation } = require('../../models/reputationGraph');
    const computationStats = await ReputationComputation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // 전체 통계 구성
    const stats = {
      nodes: {
        total: nodeStats.reduce((sum, stat) => sum + stat.count, 0),
        byType: nodeStats.reduce((obj, stat) => {
          obj[stat._id] = stat.count;
          return obj;
        }, {})
      },
      edges: {
        total: edgeStats.reduce((sum, stat) => sum + stat.count, 0),
        byType: edgeStats.reduce((obj, stat) => {
          obj[stat._id] = stat.count;
          return obj;
        }, {})
      },
      scores: {
        total: scoreStats.reduce((sum, stat) => sum + stat.count, 0),
        byDomain: scoreStats.reduce((obj, stat) => {
          obj[stat._id] = {
            avg: Math.round(stat.avgScore * 100) / 100,
            min: stat.minScore,
            max: stat.maxScore,
            count: stat.count
          };
          return obj;
        }, {})
      },
      computations: {
        byStatus: computationStats.reduce((obj, stat) => {
          obj[stat._id] = stat.count;
          return obj;
        }, {})
      },
      timestamp: new Date()
    };
    
    return responseHandler.success(res, { stats });
  } catch (error) {
    logger.error('평판 그래프 통계 조회 중 오류 발생:', error);
    return next(error);
  }
};
