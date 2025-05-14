/**
 * 그룹 미션 컨트롤러
 * 
 * 그룹 미션 관련 API 요청을 처리하는 컨트롤러입니다.
 * 그룹 미션 생성, 관리, 참여, 진행 등의 기능을 제공합니다.
 */

const groupMissionService = require('../../../services/groupMission/groupMissionService');
const { successResponse, errorResponse, paginatedResponse } = require('../../../utils/responseHandler');
const logger = require('../../../utils/logger');

/**
 * 그룹 미션 생성
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 생성된 미션 정보
 */
exports.createGroupMission = async (req, res) => {
  try {
    const missionData = req.body;
    const userId = req.user._id;
    
    const mission = await groupMissionService.createGroupMission(missionData, userId);
    
    return successResponse(res, '그룹 미션이 성공적으로 생성되었습니다.', mission, 201);
  } catch (error) {
    logger.error('그룹 미션 생성 실패:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * 그룹 미션 목록 조회
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 미션 목록 및 페이징 정보
 */
exports.getGroupMissions = async (req, res) => {
  try {
    // 쿼리 파라미터 처리
    const filters = {
      status: req.query.status,
      category: req.query.category,
      tag: req.query.tag,
      difficulty: req.query.difficulty,
      activeOnly: req.query.activeOnly === 'true'
    };
    
    // 관리자인 경우 모든 미션 조회 허용
    if (req.user.role === 'admin' && req.query.showAll === 'true') {
      filters.showAll = true;
    }
    
    // 자신의 미션만 보기
    if (req.query.myMissions === 'true') {
      filters.createdBy = req.user._id;
    }
    
    // 페이징
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await groupMissionService.getGroupMissions(filters, page, limit);
    
    return paginatedResponse(
      res,
      '그룹 미션 목록을 성공적으로 조회했습니다.',
      result.missions,
      page,
      limit,
      result.pagination.total
    );
  } catch (error) {
    logger.error('그룹 미션 목록 조회 실패:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 미션 상세 조회
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 미션 상세 정보
 */
exports.getGroupMissionById = async (req, res) => {
  try {
    const { missionId } = req.params;
    
    const result = await groupMissionService.getGroupMissionDetails(missionId);
    
    return successResponse(res, '그룹 미션 상세 정보를 성공적으로 조회했습니다.', result);
  } catch (error) {
    logger.error(`그룹 미션 상세 조회 실패 ${req.params.missionId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 미션 수정
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 수정된 미션 정보
 */
exports.updateGroupMission = async (req, res) => {
  try {
    const { missionId } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    
    const mission = await groupMissionService.updateGroupMission(missionId, updateData, userId);
    
    return successResponse(res, '그룹 미션이 성공적으로 수정되었습니다.', mission);
  } catch (error) {
    logger.error(`그룹 미션 수정 실패 ${req.params.missionId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 미션 상태 변경
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 미션 정보
 */
exports.updateMissionStatus = async (req, res) => {
  try {
    const { missionId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    
    if (!status) {
      return errorResponse(res, '상태 정보가 필요합니다.');
    }
    
    const mission = await groupMissionService.updateMissionStatus(missionId, status, userId);
    
    return successResponse(res, `그룹 미션 상태가 ${status}(으)로 변경되었습니다.`, mission);
  } catch (error) {
    logger.error(`그룹 미션 상태 변경 실패 ${req.params.missionId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 미션 삭제
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 삭제 결과
 */
exports.deleteGroupMission = async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user._id;
    
    await groupMissionService.deleteGroupMission(missionId, userId);
    
    return successResponse(res, '그룹 미션이 성공적으로 삭제되었습니다.');
  } catch (error) {
    logger.error(`그룹 미션 삭제 실패 ${req.params.missionId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 미션 참여
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 참여 결과
 */
exports.joinGroupMission = async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user._id;
    const { autoJoin } = req.body;
    
    const result = await groupMissionService.joinGroupMission(
      missionId, 
      userId, 
      autoJoin !== undefined ? autoJoin : true
    );
    
    return successResponse(res, '그룹 미션에 성공적으로 참여했습니다.', result);
  } catch (error) {
    logger.error(`그룹 미션 참여 실패 ${req.params.missionId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 미션 참여 취소
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 취소 결과
 */
exports.leaveGroupMission = async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;
    
    const result = await groupMissionService.leaveGroupMission(missionId, userId, reason);
    
    return successResponse(res, '그룹 미션 참여가 취소되었습니다.', result);
  } catch (error) {
    logger.error(`그룹 미션 참여 취소 실패 ${req.params.missionId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 상세 정보 조회
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 그룹 상세 정보
 */
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    
    const group = await groupMissionService.getGroupDetails(groupId, userId);
    
    return successResponse(res, '그룹 상세 정보를 성공적으로 조회했습니다.', group);
  } catch (error) {
    logger.error(`그룹 상세 정보 조회 실패 ${req.params.groupId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 목표 진행 상황 업데이트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 목표 정보
 */
exports.updateGroupObjective = async (req, res) => {
  try {
    const { groupId, objectiveId } = req.params;
    const { progress } = req.body;
    const userId = req.user._id;
    
    if (progress === undefined) {
      return errorResponse(res, '진행도 정보가 필요합니다.');
    }
    
    const objective = await groupMissionService.updateGroupObjective(
      groupId, 
      objectiveId, 
      progress, 
      userId
    );
    
    return successResponse(res, '그룹 목표 진행 상황이 업데이트되었습니다.', objective);
  } catch (error) {
    logger.error(`그룹 목표 업데이트 실패 ${req.params.groupId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 개인 목표 진행 상황 업데이트
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트된 목표 정보
 */
exports.updateMemberObjective = async (req, res) => {
  try {
    const { groupId, objectiveId } = req.params;
    const { progress } = req.body;
    const userId = req.user._id;
    
    if (progress === undefined) {
      return errorResponse(res, '진행도 정보가 필요합니다.');
    }
    
    const objective = await groupMissionService.updateMemberObjective(
      groupId, 
      objectiveId, 
      progress, 
      userId
    );
    
    return successResponse(res, '개인 목표 진행 상황이 업데이트되었습니다.', objective);
  } catch (error) {
    logger.error(`개인 목표 업데이트 실패 ${req.params.groupId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 그룹 채팅 메시지 전송
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 전송된 메시지
 */
exports.sendChatMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, attachments } = req.body;
    const userId = req.user._id;
    
    if (!content) {
      return errorResponse(res, '메시지 내용이 필요합니다.');
    }
    
    const message = await groupMissionService.sendChatMessage(
      groupId, 
      content, 
      attachments || [], 
      userId
    );
    
    return successResponse(res, '채팅 메시지가 전송되었습니다.', message);
  } catch (error) {
    logger.error(`채팅 메시지 전송 실패 ${req.params.groupId}:`, error);
    return errorResponse(res, error.message);
  }
};

/**
 * 관리자용 그룹 매칭 실행
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 매칭 결과
 */
exports.runGroupMatching = async (req, res) => {
  try {
    // 관리자 권한 확인 (미들웨어로도 처리 가능)
    if (req.user.role !== 'admin') {
      return errorResponse(res, '관리자만 이 기능을 사용할 수 있습니다.', 403);
    }
    
    const result = await groupMissionService.runGroupMatching();
    
    return successResponse(res, '그룹 매칭이 실행되었습니다.', result);
  } catch (error) {
    logger.error('그룹 매칭 실행 실패:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 사용자별 참여 중인 그룹 미션 목록 조회
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 참여 중인 그룹 미션 목록
 */
exports.getUserGroupMissions = async (req, res) => {
  try {
    // 조회 대상 사용자 ID (기본값: 현재 로그인한 사용자)
    const targetUserId = req.params.userId || req.user._id;
    
    // 다른 사용자의 정보를 조회하려는 경우 관리자 권한 확인
    if (targetUserId !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '다른 사용자의 미션 정보를 조회할 권한이 없습니다.', 403);
    }
    
    // 특정 상태의 미션만 조회 (선택적)
    const statusFilter = req.query.status;
    
    // 서비스에서 사용자의 참여 미션 조회 (서비스 함수 추가 필요)
    const userMissions = await groupMissionService.getUserGroupMissions(targetUserId, statusFilter);
    
    return successResponse(res, '사용자의 참여 중인 그룹 미션 목록을 조회했습니다.', userMissions);
  } catch (error) {
    logger.error('사용자 참여 미션 목록 조회 실패:', error);
    return errorResponse(res, error.message);
  }
};
