/**
 * 유저 미션 라우트
 * 
 * 유저 생성 미션, 제출물, 댓글 관련 API 라우트를 정의합니다.
 * 인증, 권한 검사 미들웨어를 적용하고 컨트롤러와 연결합니다.
 */

const express = require('express');
const router = express.Router();

// 컨트롤러 임포트
const userMissionController = require('../controllers/userMission/userMissionController');
const userMissionSubmissionController = require('../controllers/userMission/userMissionSubmissionController');
const userMissionCommentController = require('../controllers/userMission/userMissionCommentController');

// 미들웨어 임포트
const { authenticate } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

/**
 * 미션 관련 라우트
 */

// 미션 목록 및 통계
router.get('/categories', userMissionController.getCategories);
router.get('/tags/popular', userMissionController.getPopularTags);
router.get('/popular', userMissionController.getPopularMissions);
router.get('/recent', userMissionController.getRecentMissions);
router.get('/recommended', authenticate, userMissionController.getRecommendedMissions);
router.get('/stats', authenticate, checkRole(['admin']), userMissionController.getMissionStats);

// 내 미션 관련
router.get('/my-created', authenticate, userMissionController.getMyCreatedMissions);
router.get('/my-participated', authenticate, userMissionController.getMyParticipatedMissions);

// 미션 CRUD
router.post('/', authenticate, userMissionController.createMission);
router.get('/', userMissionController.getMissions);
router.get('/:missionId', userMissionController.getMission);
router.put('/:missionId', authenticate, userMissionController.updateMission);
router.delete('/:missionId', authenticate, checkRole(['admin']), userMissionController.deleteMission);

// 미션 상태 및 펀딩
router.patch('/:missionId/status', authenticate, userMissionController.changeMissionStatus);
router.post('/:missionId/funding', authenticate, userMissionController.addFunding);

/**
 * 제출물 관련 라우트
 */

// 내 제출물
router.get('/my-submissions', authenticate, userMissionSubmissionController.getMySubmissions);

// 제출물 CRUD
router.post('/:missionId/submissions', authenticate, userMissionSubmissionController.createSubmission);
router.get('/:missionId/submissions', userMissionSubmissionController.getSubmissionsByMission);
router.get('/submissions/:submissionId', userMissionSubmissionController.getSubmission);
router.put('/submissions/:submissionId', authenticate, userMissionSubmissionController.updateSubmission);
router.delete('/submissions/:submissionId', authenticate, userMissionSubmissionController.deleteSubmission);

// 제출물 평가 및 투표
router.patch('/submissions/:submissionId/evaluate', authenticate, userMissionSubmissionController.evaluateSubmission);
router.post('/submissions/:submissionId/vote', authenticate, userMissionSubmissionController.voteSubmission);

// 사용자별 제출물
router.get('/users/:userId/submissions', userMissionSubmissionController.getSubmissionsByUser);

/**
 * 댓글 관련 라우트
 */

// 미션 댓글
router.post('/:missionId/comments', authenticate, userMissionCommentController.createComment);
router.get('/:missionId/comments', userMissionCommentController.getCommentsByMission);
router.delete('/:missionId/comments', authenticate, checkRole(['admin']), userMissionCommentController.deleteAllMissionComments);

// 댓글 CRUD
router.get('/comments/:commentId', userMissionCommentController.getComment);
router.put('/comments/:commentId', authenticate, userMissionCommentController.updateComment);
router.delete('/comments/:commentId', authenticate, userMissionCommentController.deleteComment);

// 댓글 좋아요
router.post('/comments/:commentId/like', authenticate, userMissionCommentController.toggleLike);

// 사용자 댓글 통계
router.get('/users/:userId/comment-stats', userMissionCommentController.getUserCommentStats);

module.exports = router;
