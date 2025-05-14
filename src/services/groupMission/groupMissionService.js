/**
 * 그룹 미션 서비스
 * 
 * 그룹 미션 생성, 관리, 참여, 매칭 등 그룹 미션 관련 비즈니스 로직을 제공합니다.
 */

const GroupMission = require('../../models/groupMission');
const GroupMissionParticipation = require('../../models/groupMissionParticipation');
const User = require('../../models/user');
const { ObjectId } = require('mongoose').Types;
const logger = require('../../utils/logger');

/**
 * 그룹 미션 서비스 클래스
 */
class GroupMissionService {
  /**
   * 새 그룹 미션 생성
   * 
   * @param {Object} missionData - 미션 데이터
   * @param {ObjectId} creatorId - 생성자 ID
   * @returns {Promise<Object>} 생성된 미션 객체
   */
  async createGroupMission(missionData, creatorId) {
    try {
      // 미션 기간 설정 확인
      if (missionData.timeSettings) {
        // 시작일이 없으면 현재 시간으로 설정
        if (!missionData.timeSettings.startDate) {
          missionData.timeSettings.startDate = new Date();
        }
        
        // 종료일이 시작일보다 이후인지 확인
        if (new Date(missionData.timeSettings.endDate) <= new Date(missionData.timeSettings.startDate)) {
          throw new Error('종료일은 시작일보다 이후여야 합니다.');
        }
      }
      
      // 그룹 설정 검증
      if (missionData.groupSettings) {
        // 최대 인원이 최소 인원보다 크거나 같은지 확인
        if (missionData.groupSettings.maxMembers < missionData.groupSettings.minMembers) {
          throw new Error('최대 인원은 최소 인원보다 크거나 같아야 합니다.');
        }
        
        // 자동 매칭 시 그룹 형성 마감 시간 확인
        if (missionData.groupSettings.autoMatch && !missionData.groupSettings.formationDeadline) {
          // 기본값: 시작일 하루 전
          const startDate = new Date(missionData.timeSettings.startDate);
          missionData.groupSettings.formationDeadline = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        }
      }
      
      // 생성자 정보 추가
      missionData.createdBy = creatorId;
      
      // 미션 상태 설정
      if (!missionData.status) {
        missionData.status = 'draft';
      }
      
      // 그룹 미션 생성
      const groupMission = new GroupMission(missionData);
      await groupMission.save();
      
      logger.info(`그룹 미션 생성됨: ${groupMission._id}`, { userId: creatorId });
      
      return groupMission;
    } catch (error) {
      logger.error('그룹 미션 생성 실패:', error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 상세 정보 조회
   * 
   * @param {string} missionId - 미션 ID
   * @returns {Promise<Object>} 미션 상세 정보
   */
  async getGroupMissionDetails(missionId) {
    try {
      // 미션 ID 검증
      if (!ObjectId.isValid(missionId)) {
        throw new Error('유효하지 않은 미션 ID입니다.');
      }
      
      // 미션 정보 조회 및 생성자 정보 포함
      const mission = await GroupMission.findById(missionId)
        .populate('createdBy', 'name profileImage')
        .populate('integrations', 'name type category');
      
      if (!mission) {
        throw new Error('미션을 찾을 수 없습니다.');
      }
      
      // 그룹 참여 현황 집계
      const participations = await GroupMissionParticipation.find({ groupMission: missionId });
      
      // 참여 통계 계산
      const stats = {
        totalGroups: participations.length,
        activeGroups: participations.filter(p => p.status.current === 'active').length,
        completedGroups: participations.filter(p => p.status.current === 'completed').length,
        totalParticipants: participations.reduce((sum, p) => sum + p.members.length, 0),
        averageCompletion: this._calculateAverageCompletion(participations)
      };
      
      return {
        mission,
        stats
      };
    } catch (error) {
      logger.error(`그룹 미션 조회 실패 ${missionId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 목록 조회
   * 
   * @param {Object} filters - 필터 옵션
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 미션 목록 및 페이징 정보
   */
  async getGroupMissions(filters = {}, page = 1, limit = 10) {
    try {
      // 기본 쿼리 객체
      const query = {};
      
      // 필터 적용
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.tag) {
        query.tags = filters.tag;
      }
      
      if (filters.difficulty) {
        query.difficulty = filters.difficulty;
      }
      
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }
      
      // 기본적으로 공개 미션만 표시
      if (filters.showAll !== true) {
        query['settings.isPublic'] = true;
      }
      
      // 진행 중인 미션만 표시
      if (filters.activeOnly) {
        query.status = { $in: ['registration', 'forming_groups', 'in_progress'] };
        query['timeSettings.endDate'] = { $gt: new Date() };
      }
      
      // 페이징 계산
      const skip = (page - 1) * limit;
      
      // 미션 목록 조회
      const missions = await GroupMission.find(query)
        .populate('createdBy', 'name profileImage')
        .sort({ 'timeSettings.startDate': -1 })
        .skip(skip)
        .limit(limit);
      
      // 전체 미션 수 조회
      const total = await GroupMission.countDocuments(query);
      
      // 페이징 정보
      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
      
      return {
        missions,
        pagination
      };
    } catch (error) {
      logger.error('그룹 미션 목록 조회 실패:', error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 수정
   * 
   * @param {string} missionId - 미션 ID
   * @param {Object} updateData - 수정할 데이터
   * @param {ObjectId} userId - 수정자 ID
   * @returns {Promise<Object>} 수정된 미션 객체
   */
  async updateGroupMission(missionId, updateData, userId) {
    try {
      // 미션 ID 검증
      if (!ObjectId.isValid(missionId)) {
        throw new Error('유효하지 않은 미션 ID입니다.');
      }
      
      // 기존 미션 조회
      const mission = await GroupMission.findById(missionId);
      
      if (!mission) {
        throw new Error('미션을 찾을 수 없습니다.');
      }
      
      // 수정 권한 확인 (생성자 또는 관리자만 수정 가능)
      if (mission.createdBy.toString() !== userId.toString()) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('미션 수정 권한이 없습니다.');
        }
      }
      
      // 미션 상태에 따른 수정 제한
      if (['in_progress', 'completed', 'cancelled'].includes(mission.status)) {
        // 진행 중이거나 완료된 미션은 제한적인 필드만 수정 가능
        const allowedFields = ['description', 'imageUrl', 'settings'];
        
        // 허용되지 않은 필드가 수정되는지 확인
        const updateFields = Object.keys(updateData);
        const disallowedFields = updateFields.filter(field => !allowedFields.includes(field));
        
        if (disallowedFields.length > 0) {
          throw new Error(`다음 필드는 수정할 수 없습니다: ${disallowedFields.join(', ')}`);
        }
      }
      
      // 수정 데이터 적용
      for (const [key, value] of Object.entries(updateData)) {
        mission[key] = value;
      }
      
      // 수정 시간 업데이트
      mission.updatedAt = new Date();
      
      // 저장
      await mission.save();
      
      logger.info(`그룹 미션 수정됨: ${missionId}`, { userId });
      
      return mission;
    } catch (error) {
      logger.error(`그룹 미션 수정 실패 ${missionId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 상태 변경
   * 
   * @param {string} missionId - 미션 ID
   * @param {string} newStatus - 새 상태
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 미션 객체
   */
  async updateMissionStatus(missionId, newStatus, userId) {
    try {
      // 미션 ID 검증
      if (!ObjectId.isValid(missionId)) {
        throw new Error('유효하지 않은 미션 ID입니다.');
      }
      
      // 유효한 상태인지 확인
      const validStatuses = ['draft', 'registration', 'forming_groups', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('유효하지 않은 상태입니다.');
      }
      
      // 기존 미션 조회
      const mission = await GroupMission.findById(missionId);
      
      if (!mission) {
        throw new Error('미션을 찾을 수 없습니다.');
      }
      
      // 권한 확인
      if (mission.createdBy.toString() !== userId.toString()) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('미션 상태 변경 권한이 없습니다.');
        }
      }
      
      // 상태 변경 유효성 검사
      this._validateStatusTransition(mission.status, newStatus);
      
      // 특정 상태 변경 시 추가 작업
      if (newStatus === 'in_progress') {
        // 그룹 형성 완료 처리
        await this._finalizeGroupFormation(missionId);
      } else if (newStatus === 'completed') {
        // 미션 완료 및 보상 지급 처리
        await this._completeMission(missionId);
      } else if (newStatus === 'cancelled') {
        // 미션 취소 처리
        await this._cancelMission(missionId);
      }
      
      // 상태 업데이트
      mission.status = newStatus;
      mission.updatedAt = new Date();
      
      // 저장
      await mission.save();
      
      logger.info(`그룹 미션 상태 변경됨: ${missionId} -> ${newStatus}`, { userId });
      
      return mission;
    } catch (error) {
      logger.error(`그룹 미션 상태 변경 실패 ${missionId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 삭제
   * 
   * @param {string} missionId - 미션 ID
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async deleteGroupMission(missionId, userId) {
    try {
      // 미션 ID 검증
      if (!ObjectId.isValid(missionId)) {
        throw new Error('유효하지 않은 미션 ID입니다.');
      }
      
      // 기존 미션 조회
      const mission = await GroupMission.findById(missionId);
      
      if (!mission) {
        throw new Error('미션을 찾을 수 없습니다.');
      }
      
      // 삭제 권한 확인 (생성자 또는 관리자만 삭제 가능)
      if (mission.createdBy.toString() !== userId.toString()) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('미션 삭제 권한이 없습니다.');
        }
      }
      
      // 미션 상태에 따른 삭제 제한
      if (['in_progress', 'completed'].includes(mission.status)) {
        throw new Error('진행 중이거나 완료된 미션은 삭제할 수 없습니다.');
      }
      
      // 기존 참여 정보 삭제
      await GroupMissionParticipation.deleteMany({ groupMission: missionId });
      
      // 미션 삭제
      await GroupMission.findByIdAndDelete(missionId);
      
      logger.info(`그룹 미션 삭제됨: ${missionId}`, { userId });
      
      return true;
    } catch (error) {
      logger.error(`그룹 미션 삭제 실패 ${missionId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 참여 신청
   * 
   * @param {string} missionId - 미션 ID
   * @param {ObjectId} userId - 사용자 ID
   * @param {boolean} autoJoin - 자동 그룹 매칭 여부
   * @returns {Promise<Object>} 참여 신청 결과
   */
  async joinGroupMission(missionId, userId, autoJoin = true) {
    try {
      // 미션 ID 검증
      if (!ObjectId.isValid(missionId)) {
        throw new Error('유효하지 않은 미션 ID입니다.');
      }
      
      // 미션 정보 조회
      const mission = await GroupMission.findById(missionId);
      
      if (!mission) {
        throw new Error('미션을 찾을 수 없습니다.');
      }
      
      // 미션 상태 확인
      if (!['registration', 'forming_groups'].includes(mission.status)) {
        throw new Error('현재 참여 신청이 불가능한 미션입니다.');
      }
      
      // 사용자 정보 조회
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      // 참여 요건 확인
      await this._checkJoinRequirements(mission, user);
      
      // 이미 참여 중인지 확인
      const existingParticipation = await GroupMissionParticipation.findOne({
        groupMission: missionId,
        'members.user': userId,
        'members.status': { $in: ['active', 'pending'] }
      });
      
      if (existingParticipation) {
        throw new Error('이미 해당 미션에 참여 중입니다.');
      }
      
      // 자동 매칭 선택 시
      if (autoJoin && mission.groupSettings.autoMatch) {
        // 기존 그룹 중 참여 가능한 그룹 찾기
        const availableGroup = await this._findAvailableGroup(missionId, user);
        
        if (availableGroup) {
          // 기존 그룹에 추가
          return await this._addUserToGroup(availableGroup._id, userId);
        }
      }
      
      // 새 그룹 생성 필요 여부 확인
      const needNewGroup = autoJoin || !mission.groupSettings.autoMatch;
      
      if (needNewGroup) {
        // 새 그룹 생성
        return await this._createNewGroup(missionId, userId);
      }
      
      // 대기 상태로 등록
      return {
        status: 'pending',
        message: '그룹 매칭 대기 중입니다. 관리자의 수동 매칭을 기다려주세요.'
      };
    } catch (error) {
      logger.error(`그룹 미션 참여 신청 실패 ${missionId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 미션 참여 취소
   * 
   * @param {string} missionId - 미션 ID
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<Object>} 취소 결과
   */
  async leaveGroupMission(missionId, userId, reason = '') {
    try {
      // 미션 ID 검증
      if (!ObjectId.isValid(missionId)) {
        throw new Error('유효하지 않은 미션 ID입니다.');
      }
      
      // 참여 정보 조회
      const participation = await GroupMissionParticipation.findOne({
        groupMission: missionId,
        'members.user': userId,
        'members.status': { $in: ['active', 'pending'] }
      });
      
      if (!participation) {
        throw new Error('해당 미션에 참여 중이 아닙니다.');
      }
      
      // 미션 상태 확인
      const mission = await GroupMission.findById(missionId);
      
      if (mission.status === 'completed') {
        throw new Error('이미 완료된 미션은 취소할 수 없습니다.');
      }
      
      // 사용자 인덱스 찾기
      const memberIndex = participation.members.findIndex(
        member => member.user.toString() === userId.toString() && 
        ['active', 'pending'].includes(member.status)
      );
      
      if (memberIndex === -1) {
        throw new Error('해당 미션에 참여 중이 아닙니다.');
      }
      
      // 사용자 상태 업데이트
      participation.members[memberIndex].status = 'left';
      participation.members[memberIndex].leftAt = new Date();
      participation.members[memberIndex].leaveReason = reason;
      
      // 그룹 리더인 경우 리더 변경
      if (participation.group.leader && 
          participation.group.leader.toString() === userId.toString()) {
        // 남은 활성 멤버 중 새 리더 선택
        const activeMembers = participation.members.filter(
          member => member.status === 'active' && member.user.toString() !== userId.toString()
        );
        
        if (activeMembers.length > 0) {
          // 가장 먼저 참여한 멤버를 리더로 설정
          participation.group.leader = activeMembers[0].user;
          
          // 리더 변경 이력 추가
          participation.group.leaderHistory.push({
            user: userId,
            startedAt: participation.group.formedAt,
            endedAt: new Date(),
            reason: '탈퇴로 인한 리더 변경'
          });
        } else {
          // 그룹에 활성 멤버가 없으면 그룹 상태 변경
          participation.status.current = 'disbanded';
          participation.status.updatedAt = new Date();
        }
      }
      
      // 변경 사항 저장
      await participation.save();
      
      logger.info(`그룹 미션 참여 취소: ${missionId}`, { userId });
      
      return {
        success: true,
        message: '미션 참여가 취소되었습니다.'
      };
    } catch (error) {
      logger.error(`그룹 미션 참여 취소 실패 ${missionId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 정보 조회
   * 
   * @param {string} groupId - 그룹 참여 ID
   * @param {ObjectId} userId - 조회 요청자 ID
   * @returns {Promise<Object>} 그룹 정보
   */
  async getGroupDetails(groupId, userId) {
    try {
      // 그룹 ID 검증
      if (!ObjectId.isValid(groupId)) {
        throw new Error('유효하지 않은 그룹 ID입니다.');
      }
      
      // 그룹 정보 조회
      const group = await GroupMissionParticipation.findById(groupId)
        .populate('groupMission')
        .populate('members.user', 'name profileImage level xp')
        .populate('group.leader', 'name profileImage');
      
      if (!group) {
        throw new Error('그룹을 찾을 수 없습니다.');
      }
      
      // 접근 권한 확인 (그룹 멤버 또는 미션 생성자 또는 관리자)
      const isMember = group.members.some(member => 
        member.user._id.toString() === userId.toString() && 
        ['active', 'completed'].includes(member.status)
      );
      
      const isCreator = group.groupMission.createdBy.toString() === userId.toString();
      
      if (!isMember && !isCreator) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('그룹 정보 조회 권한이 없습니다.');
        }
      }
      
      return group;
    } catch (error) {
      logger.error(`그룹 정보 조회 실패 ${groupId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 목표 진행 상황 업데이트
   * 
   * @param {string} groupId - 그룹 참여 ID
   * @param {string} objectiveId - 목표 ID
   * @param {number} progress - 진행도
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 목표 정보
   */
  async updateGroupObjective(groupId, objectiveId, progress, userId) {
    try {
      // 그룹 ID 검증
      if (!ObjectId.isValid(groupId)) {
        throw new Error('유효하지 않은 그룹 ID입니다.');
      }
      
      // 그룹 정보 조회
      const group = await GroupMissionParticipation.findById(groupId);
      
      if (!group) {
        throw new Error('그룹을 찾을 수 없습니다.');
      }
      
      // 접근 권한 확인 (그룹 멤버)
      const isMember = group.members.some(member => 
        member.user.toString() === userId.toString() && 
        member.status === 'active'
      );
      
      if (!isMember) {
        throw new Error('그룹 목표 업데이트 권한이 없습니다.');
      }
      
      // 그룹 상태 확인
      if (group.status.current !== 'active') {
        throw new Error('활성 상태의 그룹만 목표를 업데이트할 수 있습니다.');
      }
      
      // 목표 인덱스 찾기
      const objectiveIndex = group.groupObjectives.findIndex(
        objective => objective._id.toString() === objectiveId
      );
      
      if (objectiveIndex === -1) {
        throw new Error('목표를 찾을 수 없습니다.');
      }
      
      // 현재 목표 정보
      const objective = group.groupObjectives[objectiveIndex];
      
      // 진행도 계산
      const newProgress = Math.min(progress, objective.target);
      const progressDelta = newProgress - objective.progress;
      
      // 진행도 변화가 없으면 종료
      if (progressDelta === 0) {
        return objective;
      }
      
      // 목표 업데이트
      objective.progress = newProgress;
      objective.progressPercentage = Math.round((newProgress / objective.target) * 100);
      objective.lastUpdated = new Date();
      
      // 목표 완료 여부 확인
      if (newProgress >= objective.target && !objective.completed) {
        objective.completed = true;
        objective.completedAt = new Date();
      }
      
      // 진행 이력 추가
      objective.history.push({
        timestamp: new Date(),
        progressDelta,
        totalProgress: newProgress,
        progressPercentage: objective.progressPercentage,
        updatedBy: userId,
        note: `사용자에 의한 진행도 업데이트: ${progressDelta > 0 ? '+' : ''}${progressDelta}`
      });
      
      // 그룹 전체 완료율 재계산
      group.status.completionPercentage = this._calculateGroupCompletionPercentage(group);
      
      // 모든 목표 완료 시 그룹 완료 처리
      const allObjectivesCompleted = group.groupObjectives.every(obj => obj.completed);
      
      if (allObjectivesCompleted && group.status.current !== 'completed') {
        group.status.current = 'completed';
        group.status.completedAt = new Date();
        
        // 조기 완료 여부 확인
        const mission = await GroupMission.findById(group.groupMission);
        const endDate = new Date(mission.timeSettings.endDate);
        const now = new Date();
        
        if (now < endDate) {
          group.status.completedEarly = true;
          const daysEarly = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          group.status.daysCompletedEarly = daysEarly;
        }
        
        // 보상 지급 대기 상태로 설정
        // 실제 보상 지급은 별도 프로세스에서 진행
      }
      
      // 변경 사항 저장
      await group.save();
      
      return objective;
    } catch (error) {
      logger.error(`그룹 목표 업데이트 실패 ${groupId}:`, error);
      throw error;
    }
  }
  
  /**
   * 개인 목표 진행 상황 업데이트
   * 
   * @param {string} groupId - 그룹 참여 ID
   * @param {string} objectiveId - 목표 ID
   * @param {number} progress - 진행도
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 목표 정보
   */
  async updateMemberObjective(groupId, objectiveId, progress, userId) {
    try {
      // 그룹 ID 검증
      if (!ObjectId.isValid(groupId)) {
        throw new Error('유효하지 않은 그룹 ID입니다.');
      }
      
      // 그룹 정보 조회
      const group = await GroupMissionParticipation.findById(groupId);
      
      if (!group) {
        throw new Error('그룹을 찾을 수 없습니다.');
      }
      
      // 멤버 인덱스 찾기
      const memberIndex = group.members.findIndex(
        member => member.user.toString() === userId.toString() && 
        member.status === 'active'
      );
      
      if (memberIndex === -1) {
        throw new Error('활성 상태인 그룹 멤버가 아닙니다.');
      }
      
      // 그룹 상태 확인
      if (group.status.current !== 'active') {
        throw new Error('활성 상태의 그룹만 목표를 업데이트할 수 있습니다.');
      }
      
      // 목표 인덱스 찾기
      const member = group.members[memberIndex];
      const objectiveIndex = member.objectives.findIndex(
        objective => objective._id.toString() === objectiveId
      );
      
      if (objectiveIndex === -1) {
        throw new Error('목표를 찾을 수 없습니다.');
      }
      
      // 현재 목표 정보
      const objective = member.objectives[objectiveIndex];
      
      // 진행도 계산
      const newProgress = Math.min(progress, objective.target);
      const progressDelta = newProgress - objective.progress;
      
      // 진행도 변화가 없으면 종료
      if (progressDelta === 0) {
        return objective;
      }
      
      // 목표 업데이트
      objective.progress = newProgress;
      objective.lastUpdated = new Date();
      
      // 목표 완료 여부 확인
      if (newProgress >= objective.target && !objective.completed) {
        objective.completed = true;
        objective.completedAt = new Date();
      }
      
      // 진행 이력 추가
      objective.history.push({
        timestamp: new Date(),
        progressDelta,
        totalProgress: newProgress,
        note: `사용자에 의한 진행도 업데이트: ${progressDelta > 0 ? '+' : ''}${progressDelta}`
      });
      
      // 멤버의 모든 목표 완료 시 완료 상태로 변경
      const allMemberObjectivesCompleted = member.objectives.every(obj => obj.completed);
      
      if (allMemberObjectivesCompleted && member.status !== 'completed') {
        member.status = 'completed';
      }
      
      // 활동 로그 추가
      member.activityLog.push({
        type: 'progress_update',
        timestamp: new Date(),
        details: {
          objectiveId,
          progressDelta,
          totalProgress: newProgress
        },
        activityScore: progressDelta > 0 ? progressDelta : 1
      });
      
      // 변경 사항 저장
      await group.save();
      
      // 기여도 점수 재계산
      await this._recalculateContributionScores(groupId);
      
      return objective;
    } catch (error) {
      logger.error(`개인 목표 업데이트 실패 ${groupId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 채팅 메시지 전송
   * 
   * @param {string} groupId - 그룹 참여 ID
   * @param {string} content - 메시지 내용
   * @param {Array<string>} attachments - 첨부 파일 URL 목록
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<Object>} 전송된 메시지
   */
  async sendChatMessage(groupId, content, attachments = [], userId) {
    try {
      // 그룹 ID 검증
      if (!ObjectId.isValid(groupId)) {
        throw new Error('유효하지 않은 그룹 ID입니다.');
      }
      
      // 그룹 정보 조회
      const group = await GroupMissionParticipation.findById(groupId);
      
      if (!group) {
        throw new Error('그룹을 찾을 수 없습니다.');
      }
      
      // 접근 권한 확인 (그룹 멤버)
      const isMember = group.members.some(member => 
        member.user.toString() === userId.toString() && 
        ['active', 'completed'].includes(member.status)
      );
      
      if (!isMember) {
        throw new Error('그룹 채팅 메시지 전송 권한이 없습니다.');
      }
      
      // 채팅 기능 활성화 여부 확인
      const mission = await GroupMission.findById(group.groupMission);
      
      if (!mission.interactions.enableChat) {
        throw new Error('이 미션은 채팅 기능이 비활성화되어 있습니다.');
      }
      
      // 멤버 인덱스 찾기
      const memberIndex = group.members.findIndex(
        member => member.user.toString() === userId.toString()
      );
      
      // 새 메시지 생성
      const newMessage = {
        sender: userId,
        content,
        timestamp: new Date(),
        attachments,
        readBy: [{
          user: userId,
          readAt: new Date()
        }]
      };
      
      // 메시지 추가
      group.chatMessages.push(newMessage);
      
      // 활동 로그 추가
      if (memberIndex !== -1) {
        group.members[memberIndex].activityLog.push({
          type: 'chat_message',
          timestamp: new Date(),
          details: {
            messageId: newMessage._id
          },
          activityScore: 1
        });
      }
      
      // 변경 사항 저장
      await group.save();
      
      return newMessage;
    } catch (error) {
      logger.error(`채팅 메시지 전송 실패 ${groupId}:`, error);
      throw error;
    }
  }
  
  /**
   * 그룹 매칭 실행 (백그라운드 작업용)
   * 
   * @returns {Promise<Object>} 매칭 결과
   */
  async runGroupMatching() {
    try {
      // 매칭이 필요한 미션 목록 조회
      const missions = await GroupMission.findNeedingMatching();
      
      if (missions.length === 0) {
        return {
          matched: 0,
          message: '매칭이 필요한 미션이 없습니다.'
        };
      }
      
      let totalMatched = 0;
      
      // 각 미션별로 매칭 실행
      for (const mission of missions) {
        const matched = await this._matchGroupsForMission(mission._id);
        totalMatched += matched;
        
        // 매칭 완료 후 미션 상태 업데이트
        if (mission.status === 'forming_groups') {
          mission.status = 'in_progress';
          await mission.save();
        }
      }
      
      return {
        matched: totalMatched,
        message: `${missions.length}개 미션에서 총 ${totalMatched}명의 사용자를 매칭했습니다.`
      };
    } catch (error) {
      logger.error('그룹 매칭 실행 실패:', error);
      throw error;
    }
  }
  
  /**
   * 참여 요건 확인
   * 
   * @param {Object} mission - 미션 객체
   * @param {Object} user - 사용자 객체
   * @returns {Promise<boolean>} 참여 가능 여부
   * @private
   */
  async _checkJoinRequirements(mission, user) {
    // 요구 사항이 없으면 바로 통과
    if (!mission.joinRequirements) {
      return true;
    }
    
    // 레벨 요구사항 확인
    if (mission.joinRequirements.minLevel > user.level) {
      throw new Error(`최소 레벨 ${mission.joinRequirements.minLevel} 이상이어야 합니다. (현재: ${user.level})`);
    }
    
    // NFT 소유 요건 확인
    if (mission.joinRequirements.requireNFT && mission.joinRequirements.requireNFT.active) {
      // NFT 소유 여부 확인 로직 구현 필요
      // 블록체인 서비스를 통해 확인
      // const hasNFT = await nftService.checkNFTOwnership(
      //   user.wallet.address,
      //   mission.joinRequirements.requireNFT.contractAddress,
      //   mission.joinRequirements.requireNFT.tokenIdList
      // );
      
      // if (!hasNFT) {
      //   throw new Error('필요한 NFT를 보유하고 있지 않습니다.');
      // }
    }
    
    // 토큰 보유량 확인
    if (mission.joinRequirements.minTokenHolding && mission.joinRequirements.minTokenHolding.active) {
      // 토큰 보유량 확인 로직 구현 필요
      // const tokenBalance = await tokenService.getBalance(user.wallet.address);
      
      // if (tokenBalance < mission.joinRequirements.minTokenHolding.amount) {
      //   throw new Error(`최소 ${mission.joinRequirements.minTokenHolding.amount} NEST 토큰을 보유해야 합니다.`);
      // }
    }
    
    // 관심사 태그 확인
    if (mission.joinRequirements.requiredTags && mission.joinRequirements.requiredTags.length > 0) {
      const hasMatchingTag = mission.joinRequirements.requiredTags.some(tag => 
        user.interests && user.interests.includes(tag)
      );
      
      if (!hasMatchingTag) {
        throw new Error('필요한 관심사 태그를 보유하고 있지 않습니다.');
      }
    }
    
    return true;
  }
  
  /**
   * 사용자에게 적합한 그룹 찾기
   * 
   * @param {string} missionId - 미션 ID
   * @param {Object} user - 사용자 객체
   * @returns {Promise<Object|null>} 찾은 그룹 또는 null
   * @private
   */
  async _findAvailableGroup(missionId, user) {
    // 미션 정보 조회
    const mission = await GroupMission.findById(missionId);
    
    // 기존 그룹 목록 조회
    const groups = await GroupMissionParticipation.find({
      groupMission: missionId,
      status: { current: 'forming' }
    });
    
    // 참여 가능한 그룹 필터링 (인원 제한 확인)
    const availableGroups = groups.filter(group => {
      const activeMembers = group.members.filter(m => ['active', 'pending'].includes(m.status));
      return activeMembers.length < mission.groupSettings.maxMembers;
    });
    
    if (availableGroups.length === 0) {
      return null;
    }
    
    // 매칭 조건에 따라 최적의 그룹 선택
    if (mission.groupSettings.matchingCriteria) {
      const criteria = mission.groupSettings.matchingCriteria;
      
      // 관심사 기반 매칭
      if (criteria.byInterest && user.interests && user.interests.length > 0) {
        // 관심사 기반으로 그룹 점수 계산
        const groupScores = await Promise.all(availableGroups.map(async (group) => {
          // 그룹 멤버 정보 조회
          const memberIds = group.members
            .filter(m => m.status === 'active')
            .map(m => m.user);
          
          const members = await User.find({ _id: { $in: memberIds } });
          
          // 관심사 일치 점수 계산
          let interestScore = 0;
          
          members.forEach(member => {
            if (member.interests && member.interests.length > 0) {
              const matchingInterests = member.interests.filter(interest => 
                user.interests.includes(interest)
              );
              interestScore += matchingInterests.length;
            }
          });
          
          // 평균 점수 계산
          const avgScore = members.length > 0 ? interestScore / members.length : 0;
          
          return {
            group,
            score: avgScore
          };
        }));
        
        // 점수 기준 내림차순 정렬
        groupScores.sort((a, b) => b.score - a.score);
        
        // 가장 높은 점수의 그룹 반환
        if (groupScores.length > 0 && groupScores[0].score > 0) {
          return groupScores[0].group;
        }
      }
      
      // 레벨 기반 매칭
      if (criteria.byLevel) {
        // 레벨 기반으로 그룹 점수 계산
        const groupScores = await Promise.all(availableGroups.map(async (group) => {
          // 그룹 멤버 정보 조회
          const memberIds = group.members
            .filter(m => m.status === 'active')
            .map(m => m.user);
          
          const members = await User.find({ _id: { $in: memberIds } });
          
          // 평균 레벨 계산
          const avgLevel = members.reduce((sum, member) => sum + member.level, 0) / members.length;
          
          // 레벨 차이 기반 점수 계산 (차이가 적을수록 높은 점수)
          const levelDiff = Math.abs(avgLevel - user.level);
          const levelScore = 10 - Math.min(levelDiff, 10); // 0-10 점수 범위
          
          return {
            group,
            score: levelScore
          };
        }));
        
        // 점수 기준 내림차순 정렬
        groupScores.sort((a, b) => b.score - a.score);
        
        // 가장 높은 점수의 그룹 반환
        if (groupScores.length > 0 && groupScores[0].score > 5) { // 점수가 5 이상인 경우만 고려
          return groupScores[0].group;
        }
      }
    }
    
    // 특별한 매칭 조건이 없거나 조건에 맞는 그룹이 없으면
    // 단순히 인원이 가장 많은 그룹을 선택 (그룹 빠르게 완성하기 위함)
    availableGroups.sort((a, b) => {
      const aActiveMembers = a.members.filter(m => ['active', 'pending'].includes(m.status)).length;
      const bActiveMembers = b.members.filter(m => ['active', 'pending'].includes(m.status)).length;
      return bActiveMembers - aActiveMembers;
    });
    
    return availableGroups[0];
  }
  
  /**
   * 새 그룹 생성
   * 
   * @param {string} missionId - 미션 ID
   * @param {ObjectId} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 그룹
   * @private
   */
  async _createNewGroup(missionId, userId) {
    // 미션 정보 조회
    const mission = await GroupMission.findById(missionId);
    const user = await User.findById(userId);
    
    // 그룹명 생성
    const groupName = `${user.name}의 그룹`;
    
    // 새 그룹 생성
    const newGroup = new GroupMissionParticipation({
      groupMission: missionId,
      group: {
        name: groupName,
        description: `${mission.title} 미션을 위한 그룹입니다.`,
        formationType: 'self_form',
        formedAt: new Date(),
        leader: userId
      },
      members: [{
        user: userId,
        status: 'active',
        joinedAt: new Date(),
        objectives: mission.objectives.memberObjectives.map(obj => ({
          description: obj.description,
          target: obj.target,
          progress: 0,
          completed: false
        })),
        contribution: {
          autoScore: 0,
          peerScore: 0,
          leaderScore: 0,
          finalScore: 0
        },
        activityLog: [{
          type: 'custom',
          timestamp: new Date(),
          details: {
            action: 'create_group',
            description: '그룹 생성'
          },
          activityScore: 5
        }]
      }],
      groupObjectives: mission.objectives.groupObjectives.map(obj => ({
        description: obj.description,
        target: obj.target,
        progress: 0,
        progressPercentage: 0,
        completed: false
      })),
      status: {
        current: 'forming',
        updatedAt: new Date(),
        completionPercentage: 0
      }
    });
    
    // 단계별 진행 정보 추가 (미션이 단계가 있는 경우)
    if (mission.timeSettings.hasStages && mission.timeSettings.stages.length > 0) {
      newGroup.stageProgress = mission.timeSettings.stages.map((stage, index) => ({
        stageIndex: index,
        name: stage.name,
        status: index === 0 ? 'in_progress' : 'not_started',
        startedAt: index === 0 ? new Date() : null,
        completedAt: null,
        progressPercentage: 0
      }));
    }
    
    // 저장
    await newGroup.save();
    
    logger.info(`새 그룹 생성됨: ${newGroup._id}`, { userId, missionId });
    
    return {
      success: true,
      group: newGroup,
      message: '새 그룹이 생성되었습니다.'
    };
  }
  
  /**
   * 그룹 완료율 계산
   * 
   * @param {Object} group - 그룹 객체
   * @returns {number} 완료율 (%)
   * @private
   */
  _calculateGroupCompletionPercentage(group) {
    if (!group.groupObjectives || group.groupObjectives.length === 0) {
      return 0;
    }
    
    // 미션 목표 정보 조회
    const mission = group.groupMission;
    const completionCriteria = mission?.objectives?.completionCriteria || 'all';
    const completionPercentage = mission?.objectives?.completionPercentage || 100;
    
    // 목표별 진행률 계산
    const objectives = group.groupObjectives;
    const totalObjectives = objectives.length;
    
    // 각 목표의 진행률 계산
    const objectiveProgress = objectives.map(objective => {
      const progress = objective.progress;
      const target = objective.target;
      return progress >= target ? 1 : progress / target;
    });
    
    // 전체 평균 진행률 계산
    const avgProgress = objectiveProgress.reduce((sum, p) => sum + p, 0) / totalObjectives;
    
    // 완료된 목표 개수 계산
    const completedObjectives = objectives.filter(obj => obj.completed).length;
    
    // 달성 기준에 따라 계산
    if (completionCriteria === 'all') {
      // 모든 목표 달성 시 완료 (진행률 기준)
      return Math.round(avgProgress * 100);
    } else if (completionCriteria === 'percentage') {
      // 목표 중 일정 비율 달성 시 완료
      const requiredCompletions = Math.ceil(totalObjectives * (completionPercentage / 100));
      const completionRatio = Math.min(completedObjectives / requiredCompletions, 1);
      return Math.round(completionRatio * 100);
    }
    
    return Math.round(avgProgress * 100);
  }
  
  /**
   * 평균 완료율 계산
   * 
   * @param {Array} participations - 참여 그룹 목록
   * @returns {number} 평균 완료율 (%)
   * @private
   */
  _calculateAverageCompletion(participations) {
    if (!participations || participations.length === 0) {
      return 0;
    }
    
    // 활성 및 완료된 그룹만 고려
    const activeGroups = participations.filter(p => 
      ['active', 'completed'].includes(p.status.current)
    );
    
    if (activeGroups.length === 0) {
      return 0;
    }
    
    // 완료율 합계 계산
    const totalCompletion = activeGroups.reduce(
      (sum, group) => sum + (group.status.completionPercentage || 0), 0
    );
    
    // 평균 완료율 반환
    return Math.round(totalCompletion / activeGroups.length);
  }
  
  /**
   * 기여도 점수 재계산
   * 
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   * @private
   */
  async _recalculateContributionScores(groupId) {
    // 그룹 정보 조회
    const group = await GroupMissionParticipation.findById(groupId);
    
    if (!group) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }
    
    // 활성 멤버만 필터링
    const activeMembers = group.members.filter(member => 
      member.status === 'active'
    );
    
    if (activeMembers.length === 0) {
      return;
    }
    
    // 미션 정보 조회
    const mission = await GroupMission.findById(group.groupMission);
    
    // 기여도 측정 방식 확인
    const contributionTracking = mission.interactions.contributionTracking || 'equal';
    
    // 기여도 계산 방식에 따라 점수 계산
    if (contributionTracking === 'equal') {
      // 동등한 기여도 (모든 멤버에게 100점)
      activeMembers.forEach(member => {
        member.contribution.autoScore = 100;
        member.contribution.finalScore = 100;
      });
    } else if (contributionTracking === 'activity') {
      // 활동 기반 기여도
      const activityScores = activeMembers.map(member => {
        // 활동 로그에서 점수 합산
        const score = member.activityLog.reduce((sum, log) => sum + (log.activityScore || 1), 0);
        return { memberId: member.user.toString(), score };
      });
      
      // 최대 점수 찾기
      const maxScore = Math.max(...activityScores.map(item => item.score));
      
      // 점수 정규화 (최대 100점 기준)
      activityScores.forEach(item => {
        const normalizedScore = maxScore > 0 ? Math.round((item.score / maxScore) * 100) : 100;
        
        // 해당 멤버 찾기
        const memberIndex = activeMembers.findIndex(
          member => member.user.toString() === item.memberId
        );
        
        if (memberIndex !== -1) {
          activeMembers[memberIndex].contribution.autoScore = normalizedScore;
          activeMembers[memberIndex].contribution.finalScore = normalizedScore;
        }
      });
    } else if (contributionTracking === 'peer_rating') {
      // 동료 평가 기반 기여도
      // 동료 평가 데이터 처리
      // 여기서는 간소화를 위해 생략
    } else if (contributionTracking === 'leader_rating') {
      // 리더 평가 기반 기여도
      // 리더 평가 데이터 처리
      // 여기서는 간소화를 위해 생략
    }
    
    // 기여도 순위 계산
    const sortedMembers = [...activeMembers].sort((a, b) => 
      b.contribution.finalScore - a.contribution.finalScore
    );
    
    sortedMembers.forEach((member, index) => {
      // 해당 멤버 찾기
      const memberIndex = group.members.findIndex(
        m => m.user.toString() === member.user.toString()
      );
      
      if (memberIndex !== -1) {
        group.members[memberIndex].contribution.rank = index + 1;
        
        // 백분위 계산
        group.members[memberIndex].contribution.percentile = 
          Math.round(((sortedMembers.length - index) / sortedMembers.length) * 100);
      }
    });
    
    // 변경 사항 저장
    await group.save();
  }
  
  /**
   * 상태 전환 유효성 검사
   * 
   * @param {string} currentStatus - 현재 상태
   * @param {string} newStatus - 새 상태
   * @returns {boolean} 유효한 전환인지 여부
   * @private
   */
  _validateStatusTransition(currentStatus, newStatus) {
    // 유효한 상태 전환 정의
    const validTransitions = {
      'draft': ['registration', 'cancelled'],
      'registration': ['forming_groups', 'cancelled'],
      'forming_groups': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': ['draft']
    };
    
    // 현재 상태에서 가능한 전환인지 확인
    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`${currentStatus} 상태에서 ${newStatus} 상태로 변경할 수 없습니다.`);
    }
    
    return true;
  }
}

module.exports = new GroupMissionService();
