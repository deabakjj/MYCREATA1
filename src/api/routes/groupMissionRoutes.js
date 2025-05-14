/**
 * 그룹 미션 라우트
 * 
 * 그룹 미션 관련 API 엔드포인트를 정의합니다.
 */

const express = require('express');
const router = express.Router();
const groupMissionController = require('../controllers/groupMission/groupMissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// 인증 미들웨어 적용
router.use(authMiddleware.verifyToken);

// 미션 관리 엔드포인트
// 그룹 미션 생성 (누구나 생성 가능)
router.post('/', groupMissionController.createGroupMission);

// 그룹 미션 목록 조회
router.get('/', groupMissionController.getGroupMissions);

// 그룹 미션 상세 조회
router.get('/:missionId', groupMissionController.getGroupMissionById);

// 그룹 미션 수정 (생성자 또는 관리자만 가능)
router.put('/:missionId', groupMissionController.updateGroupMission);

// 그룹 미션 상태 변경 (생성자 또는 관리자만 가능)
router.patch('/:missionId/status', groupMissionController.updateMissionStatus);

// 그룹 미션 삭제 (생성자 또는 관리자만 가능)
router.delete('/:missionId', groupMissionController.deleteGroupMission);

// 참여 관련 엔드포인트
// 그룹 미션 참여
router.post('/:missionId/join', groupMissionController.joinGroupMission);

// 그룹 미션 참여 취소
router.post('/:missionId/leave', groupMissionController.leaveGroupMission);

// 그룹 상세 정보 조회
router.get('/groups/:groupId', groupMissionController.getGroupDetails);

// 그룹 목표 진행 업데이트
router.put('/groups/:groupId/objectives/:objectiveId', groupMissionController.updateGroupObjective);

// 개인 목표 진행 업데이트
router.put('/groups/:groupId/member-objectives/:objectiveId', groupMissionController.updateMemberObjective);

// 그룹 채팅 메시지 전송
router.post('/groups/:groupId/chat', groupMissionController.sendChatMessage);

// 사용자별 참여 미션 조회
router.get('/user/:userId?', groupMissionController.getUserGroupMissions);

// 관리자 전용 엔드포인트
// 그룹 매칭 실행
router.post('/admin/match', roleMiddleware.checkRole('admin'), groupMissionController.runGroupMatching);

module.exports = router;
