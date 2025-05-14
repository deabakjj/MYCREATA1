/**
 * 유저 생성 미션 서비스
 * 
 * 유저 생성 미션 관련 비즈니스 로직을 처리합니다.
 * 미션 생성, 조회, 수정, 삭제 및 관련 기능을 제공합니다.
 */

const { UserMission, UserMissionSubmission } = require('../../models/userMission');
const User = require('../../models/user');
const xpService = require('../xpService');
const tokenService = require('../tokenService');
const nftService = require('../nftService');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const { ApiError } = require('../../utils/errors');

/**
 * 유저 생성 미션 서비스 클래스
 */
class UserMissionService {
  /**
   * 미션 생성
   * 
   * @param {Object} missionData - 미션 데이터
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 미션
   */
  async createMission(missionData, userId) {
    try {
      // 사용자 확인
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, '사용자를 찾을 수 없습니다.');
      }

      // 미션 데이터 검증
      this._validateMissionData(missionData);

      // 태그 처리 (최대 5개)
      if (missionData.tags && missionData.tags.length > 5) {
        missionData.tags = missionData.tags.slice(0, 5);
      }

      // 미션 객체 생성
      const mission = new UserMission({
        ...missionData,
        creator: userId,
        status: '대기', // 관리자 또는 DAO 승인 대기
        stats: {
          participantCount: 0,
          submissionCount: 0,
          approvedCount: 0,
          viewCount: 0,
          likeCount: 0,
          shareCount: 0
        },
        community: {
          commentEnabled: missionData.community?.commentEnabled !== false,
          commentCount: 0,
          resultSharing: missionData.community?.resultSharing || '참여자만'
        }
      });

      // 미션 저장
      await mission.save();
      logger.info(`유저 미션 생성: ${mission._id}`, { userId });

      return mission;
    } catch (error) {
      logger.error('유저 미션 생성 실패:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `미션 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 미션 데이터 검증
   * 
   * @param {Object} missionData - 미션 데이터
   * @private
   */
  _validateMissionData(missionData) {
    // 필수 필드 확인
    const requiredFields = ['title', 'description', 'category', 'submissionType'];
    for (const field of requiredFields) {
      if (!missionData[field]) {
        throw new ApiError(400, `${field} 필드는 필수입니다.`);
      }
    }

    // 제목 길이 제한
    if (missionData.title.length < 2 || missionData.title.length > 100) {
      throw new ApiError(400, '제목은 2~100자 사이여야 합니다.');
    }

    // 설명 길이 제한
    if (missionData.description.length < 10 || missionData.description.length > 5000) {
      throw new ApiError(400, '설명은 10~5000자 사이여야 합니다.');
    }

    // 난이도 범위 확인
    if (missionData.difficulty && (missionData.difficulty < 1 || missionData.difficulty > 5)) {
      throw new ApiError(400, '난이도는 1~5 사이여야 합니다.');
    }

    // 제출 필드 확인 (복합 유형일 경우)
    if (missionData.submissionType === '복합' && (!missionData.submissionFields || missionData.submissionFields.length === 0)) {
      throw new ApiError(400, '복합 제출 타입은 하나 이상의 제출 필드가 필요합니다.');
    }

    // 날짜 유효성 검증
    if (missionData.duration) {
      if (missionData.duration.startDate && new Date(missionData.duration.startDate) < new Date()) {
        throw new ApiError(400, '시작 날짜는 현재 시간 이후여야 합니다.');
      }

      if (missionData.duration.startDate && missionData.duration.endDate && 
          new Date(missionData.duration.startDate) >= new Date(missionData.duration.endDate)) {
        throw new ApiError(400, '종료 날짜는 시작 날짜 이후여야 합니다.');
      }
    }

    // 보상 데이터 검증
    if (missionData.rewards) {
      // XP 보상 확인
      if (missionData.rewards.xp && missionData.rewards.xp < 0) {
        throw new ApiError(400, 'XP 보상은 0 이상이어야 합니다.');
      }

      // 토큰 보상 확인
      if (missionData.rewards.nestToken) {
        if (missionData.rewards.nestToken.amount < 0) {
          throw new ApiError(400, '토큰 보상 금액은 0 이상이어야 합니다.');
        }

        if (missionData.rewards.nestToken.type === '예산' && missionData.rewards.nestToken.budget < 0) {
          throw new ApiError(400, '토큰 보상 예산은 0 이상이어야 합니다.');
        }
      }
    }

    // 펀딩 데이터 검증
    if (missionData.funding && missionData.funding.enabled) {
      if (missionData.funding.targetAmount <= 0) {
        throw new ApiError(400, '펀딩 목표 금액은 0보다 커야 합니다.');
      }

      if (missionData.funding.startDate && missionData.funding.endDate && 
          new Date(missionData.funding.startDate) >= new Date(missionData.funding.endDate)) {
        throw new ApiError(400, '펀딩 종료 날짜는 시작 날짜 이후여야 합니다.');
      }
    }
  }

  /**
   * 미션 조회
   * 
   * @param {string} missionId - 미션 ID
   * @param {string} userId - 조회 사용자 ID (선택 사항)
   * @returns {Promise<Object>} 미션 정보
   */
  async getMission(missionId, userId = null) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(missionId)) {
        throw new ApiError(400, '유효하지 않은 미션 ID입니다.');
      }

      // 미션 조회
      const mission = await UserMission.findById(missionId)
        .populate('creator', 'name profileImage')
        .lean();

      if (!mission) {
        throw new ApiError(404, '미션을 찾을 수 없습니다.');
      }

      // 비공개 미션인 경우 권한 확인
      if (!mission.isPublic && (!userId || mission.creator._id.toString() !== userId)) {
        throw new ApiError(403, '이 미션에 접근할 권한이 없습니다.');
      }

      // 대기 상태 미션인 경우 작성자만 조회 가능
      if (mission.status === '대기' && (!userId || mission.creator._id.toString() !== userId)) {
        throw new ApiError(403, '승인되지 않은 미션입니다.');
      }

      // 조회수 증가 (본인 제외)
      if (userId && mission.creator._id.toString() !== userId) {
        await UserMission.findByIdAndUpdate(missionId, { $inc: { 'stats.viewCount': 1 } });
      }

      // 참여 가능 여부 확인
      let canParticipate = false;
      if (userId && mission.status === '활성') {
        const now = new Date();
        const hasStarted = !mission.duration.startDate || new Date(mission.duration.startDate) <= now;
        const hasNotEnded = !mission.duration.endDate || new Date(mission.duration.endDate) > now;
        const notMaxParticipants = !mission.maxParticipants || mission.stats.participantCount < mission.maxParticipants;
        
        // 이미 참여 중인지 확인
        const existingSubmission = await UserMissionSubmission.findOne({
          mission: missionId,
          submitter: userId
        });
        
        canParticipate = hasStarted && hasNotEnded && notMaxParticipants && !existingSubmission;
      }

      // 참여 가능 여부 추가
      mission.canParticipate = canParticipate;

      // 작성자 여부 확인
      mission.isCreator = userId && mission.creator._id.toString() === userId;

      return mission;
    } catch (error) {
      logger.error(`미션 조회 실패 ${missionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `미션 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 미션 목록 조회
   * 
   * @param {Object} filter - 필터 조건
   * @param {Object} options - 페이지네이션, 정렬 옵션
   * @returns {Promise<Object>} 미션 목록 및 페이지네이션 정보
   */
  async getMissions(filter = {}, options = {}) {
    try {
      // 기본 옵션 설정
      const { page = 1, limit = 20, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      // 쿼리 빌드
      const query = this._buildQuery(filter);

      // 총 건수 조회
      const total = await UserMission.countDocuments(query);

      // 미션 목록 조회
      const missions = await UserMission.find(query)
        .populate('creator', 'name profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // 페이지네이션 정보
      const pagination = {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      };

      return { missions, pagination };
    } catch (error) {
      logger.error('미션 목록 조회 실패:', error);
      throw new ApiError(500, `미션 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 쿼리 빌드
   * 
   * @param {Object} filter - 필터 조건
   * @returns {Object} 쿼리 객체
   * @private
   */
  _buildQuery(filter) {
    const query = {};

    // 상태 필터
    if (filter.status) {
      query.status = filter.status;
    } else {
      // 기본적으로 활성 미션만 조회
      query.status = '활성';
    }

    // 공개 여부 필터
    if (filter.isPublic !== undefined) {
      query.isPublic = filter.isPublic;
    } else {
      // 기본적으로 공개 미션만 조회
      query.isPublic = true;
    }

    // 작성자 필터
    if (filter.creator) {
      query.creator = filter.creator;
    }

    // 카테고리 필터
    if (filter.category) {
      query.category = filter.category;
    }

    // 태그 필터
    if (filter.tag) {
      query.tags = filter.tag;
    }

    // 난이도 필터
    if (filter.difficulty) {
      query.difficulty = filter.difficulty;
    }

    // 기간 필터 (활성 미션만)
    if (filter.active) {
      const now = new Date();
      query.$or = [
        { 'duration.endDate': { $gt: now } },
        { 'duration.endDate': null }
      ];
      
      if (filter.started) {
        query['duration.startDate'] = { $lte: now };
      }
    }

    // 검색어 필터
    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    return query;
  }

  /**
   * 미션 업데이트
   * 
   * @param {string} missionId - 미션 ID
   * @param {Object} updateData - 업데이트 데이터
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 미션
   */
  async updateMission(missionId, updateData, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(missionId)) {
        throw new ApiError(400, '유효하지 않은 미션 ID입니다.');
      }

      // 미션 조회
      const mission = await UserMission.findById(missionId);
      if (!mission) {
        throw new ApiError(404, '미션을 찾을 수 없습니다.');
      }

      // 작성자 확인
      if (mission.creator.toString() !== userId) {
        throw new ApiError(403, '미션 수정 권한이 없습니다.');
      }

      // 미션 상태에 따른 수정 제한
      if (mission.status !== '대기' && mission.status !== '활성') {
        throw new ApiError(403, '이 상태의 미션은 수정할 수 없습니다.');
      }

      // 활성 미션 중 일부 필드는 수정 불가
      if (mission.status === '활성') {
        const restrictedFields = ['creator', 'status', 'duration.startDate', 'approvalType'];
        
        for (const field of restrictedFields) {
          if (updateData[field] !== undefined) {
            throw new ApiError(400, `활성 미션의 ${field} 필드는 수정할 수 없습니다.`);
          }
        }
      }

      // 업데이트할 데이터 필터링 (일부 필드는 직접 수정 불가)
      const allowedUpdateFields = [
        'title', 'description', 'category', 'tags', 'difficulty', 'imageUrl',
        'submissionType', 'submissionFields', 'duration.endDate', 
        'maxParticipants', 'isPublic', 'community', 'rewards'
      ];
      
      const filteredUpdateData = {};
      for (const field of allowedUpdateFields) {
        if (updateData[field] !== undefined) {
          // 중첩 필드 처리 (예: duration.endDate)
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (!filteredUpdateData[parent]) {
              filteredUpdateData[parent] = {};
            }
            filteredUpdateData[parent][child] = updateData[field];
          } else {
            filteredUpdateData[field] = updateData[field];
          }
        }
      }

      // 태그 제한 처리 (최대 5개)
      if (filteredUpdateData.tags && filteredUpdateData.tags.length > 5) {
        filteredUpdateData.tags = filteredUpdateData.tags.slice(0, 5);
      }

      // 데이터 검증
      this._validateMissionData({
        ...mission.toObject(),
        ...filteredUpdateData
      });

      // 미션 업데이트
      const updatedMission = await UserMission.findByIdAndUpdate(
        missionId,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      );

      logger.info(`유저 미션 업데이트: ${missionId}`, { userId });
      return updatedMission;
    } catch (error) {
      logger.error(`미션 업데이트 실패 ${missionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `미션 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 미션 상태 변경
   * 
   * @param {string} missionId - 미션 ID
   * @param {string} newStatus - 새 상태 ('활성', '종료', '취소', '반려')
   * @param {string} userId - 사용자 ID
   * @param {string} reason - 상태 변경 이유 (취소, 반려 시 필수)
   * @returns {Promise<Object>} 업데이트된 미션
   */
  async changeMissionStatus(missionId, newStatus, userId, reason = null) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(missionId)) {
        throw new ApiError(400, '유효하지 않은 미션 ID입니다.');
      }

      // 상태 유효성 검증
      const validStatuses = ['활성', '종료', '취소', '반려'];
      if (!validStatuses.includes(newStatus)) {
        throw new ApiError(400, '유효하지 않은 상태입니다.');
      }

      // 취소, 반려 시 이유 필수
      if ((newStatus === '취소' || newStatus === '반려') && !reason) {
        throw new ApiError(400, `${newStatus} 상태로 변경하려면 이유를 제공해야 합니다.`);
      }

      // 미션 조회
      const mission = await UserMission.findById(missionId);
      if (!mission) {
        throw new ApiError(404, '미션을 찾을 수 없습니다.');
      }

      // 작성자 또는 관리자인지 확인 (여기서는 작성자만 확인, 관리자 권한은 별도 처리 필요)
      const isCreator = mission.creator.toString() === userId;
      const isAdmin = await this._isAdmin(userId); // 관리자 확인 메서드는 별도 구현 필요
      
      if (!isCreator && !isAdmin) {
        throw new ApiError(403, '미션 상태 변경 권한이 없습니다.');
      }

      // 상태에 따른 액션 실행
      let updatedMission;
      
      switch (newStatus) {
        case '활성':
          // 작성자는 대기 상태만 활성으로 변경 가능
          if (isCreator && mission.status !== '대기') {
            throw new ApiError(403, '작성자는 대기 상태의 미션만 활성화할 수 있습니다.');
          }
          
          // 관리자는 대기 또는 반려 상태만 활성으로 변경 가능
          if (isAdmin && mission.status !== '대기' && mission.status !== '반려') {
            throw new ApiError(403, '관리자는 대기 또는 반려 상태의 미션만 활성화할 수 있습니다.');
          }
          
          updatedMission = await mission.activate();
          break;
          
        case '종료':
          // 활성 상태만 종료 가능
          if (mission.status !== '활성') {
            throw new ApiError(403, '활성 상태의 미션만 종료할 수 있습니다.');
          }
          
          updatedMission = await mission.complete();
          break;
          
        case '취소':
          // 작성자는 대기, 활성 상태만 취소 가능
          if (isCreator && mission.status !== '대기' && mission.status !== '활성') {
            throw new ApiError(403, '작성자는 대기 또는 활성 상태의 미션만 취소할 수 있습니다.');
          }
          
          updatedMission = await mission.cancel(reason);
          break;
          
        case '반려':
          // 관리자만 반려 가능
          if (!isAdmin) {
            throw new ApiError(403, '관리자만 미션을 반려할 수 있습니다.');
          }
          
          // 대기 상태만 반려 가능
          if (mission.status !== '대기') {
            throw new ApiError(403, '대기 상태의 미션만 반려할 수 있습니다.');
          }
          
          updatedMission = await mission.reject(reason);
          break;
      }

      logger.info(`유저 미션 상태 변경: ${missionId} -> ${newStatus}`, { userId });
      return updatedMission;
    } catch (error) {
      logger.error(`미션 상태 변경 실패 ${missionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `미션 상태 변경 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 관리자 여부 확인
   * 
   * @param {string} userId - 사용자 ID
   * @returns {Promise<boolean>} 관리자 여부
   * @private
   */
  async _isAdmin(userId) {
    try {
      const user = await User.findById(userId);
      return user && user.roles && user.roles.includes('admin');
    } catch (error) {
      logger.error(`관리자 확인 실패 ${userId}:`, error);
      return false;
    }
  }

  /**
   * 미션 펀딩 추가
   * 
   * @param {string} missionId - 미션 ID
   * @param {string} userId - 사용자 ID
   * @param {number} amount - 펀딩 금액
   * @returns {Promise<Object>} 업데이트된 미션
   */
  async addFunding(missionId, userId, amount) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(missionId)) {
        throw new ApiError(400, '유효하지 않은 미션 ID입니다.');
      }

      // 금액 유효성 검증
      if (!amount || amount <= 0) {
        throw new ApiError(400, '유효한 펀딩 금액을 입력해야 합니다.');
      }

      // 미션 조회
      const mission = await UserMission.findById(missionId);
      if (!mission) {
        throw new ApiError(404, '미션을 찾을 수 없습니다.');
      }

      // 펀딩 가능 상태 확인
      if (mission.status !== '활성') {
        throw new ApiError(403, '활성 상태의 미션만 펀딩할 수 있습니다.');
      }

      // 펀딩 활성화 여부 확인
      if (!mission.funding.enabled) {
        throw new ApiError(403, '이 미션은 펀딩을 지원하지 않습니다.');
      }

      // 펀딩 기간 확인
      const now = new Date();
      if (mission.funding.startDate && now < new Date(mission.funding.startDate)) {
        throw new ApiError(403, '펀딩이 아직 시작되지 않았습니다.');
      }
      
      if (mission.funding.endDate && now > new Date(mission.funding.endDate)) {
        throw new ApiError(403, '펀딩이 종료되었습니다.');
      }

      // 사용자 토큰 잔액 확인 및 차감
      const wallet = await tokenService.getWalletByUserId(userId);
      if (!wallet || wallet.balance < amount) {
        throw new ApiError(403, '토큰 잔액이 부족합니다.');
      }

      // 토큰 차감
      await tokenService.deductTokens(userId, amount, 'mission_funding', {
        missionId: missionId,
        missionTitle: mission.title
      });

      // 펀딩 추가
      const updatedMission = await mission.addFunding(userId, amount);

      logger.info(`유저 미션 펀딩 추가: ${missionId}`, { userId, amount });
      return updatedMission;
    } catch (error) {
      logger.error(`미션 펀딩 추가 실패 ${missionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `미션 펀딩 추가 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 인기 미션 목록 조회
   * 
   * @param {number} limit - 조회할 미션 수
   * @returns {Promise<Array>} 인기 미션 목록
   */
  async getPopularMissions(limit = 10) {
    try {
      // 활성 미션 중 참여자 수, 조회수 기준 정렬
      const missions = await UserMission.find({
        status: '활성',
        isPublic: true,
        $or: [
          { 'duration.endDate': { $gt: new Date() } },
          { 'duration.endDate': null }
        ]
      })
      .populate('creator', 'name profileImage')
      .sort({ 'stats.participantCount': -1, 'stats.viewCount': -1 })
      .limit(limit)
      .lean();

      return missions;
    } catch (error) {
      logger.error('인기 미션 목록 조회 실패:', error);
      throw new ApiError(500, `인기 미션 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 최신 미션 목록 조회
   * 
   * @param {number} limit - 조회할 미션 수
   * @returns {Promise<Array>} 최신 미션 목록
   */
  async getRecentMissions(limit = 10) {
    try {
      // 최근 생성된 활성 미션 조회
      const missions = await UserMission.find({
        status: '활성',
        isPublic: true,
        $or: [
          { 'duration.endDate': { $gt: new Date() } },
          { 'duration.endDate': null }
        ]
      })
      .populate('creator', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return missions;
    } catch (error) {
      logger.error('최신 미션 목록 조회 실패:', error);
      throw new ApiError(500, `최신 미션 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 추천 미션 목록 조회
   * 
   * @param {string} userId - 사용자 ID
   * @param {number} limit - 조회할 미션 수
   * @returns {Promise<Array>} 추천 미션 목록
   */
  async getRecommendedMissions(userId, limit = 10) {
    try {
      // 사용자 관심사 기반 추천 (사용자 참여 미션 카테고리, 태그 등 고려)
      // 간단한 구현으로 사용자가 참여한 미션과 같은 카테고리의 다른 미션 추천
      
      // 1. 사용자가 참여한 미션 조회
      const userSubmissions = await UserMissionSubmission.find({ submitter: userId })
        .distinct('mission');
      
      // 2. 참여한 미션이 없는 경우 인기 미션 반환
      if (userSubmissions.length === 0) {
        return this.getPopularMissions(limit);
      }
      
      // 3. 참여한 미션의 카테고리 조회
      const userMissions = await UserMission.find({
        _id: { $in: userSubmissions }
      });
      
      const categories = [...new Set(userMissions.map(m => m.category))];
      const tags = [...new Set(userMissions.flatMap(m => m.tags))];
      
      // 4. 같은 카테고리, 태그의 다른 활성 미션 추천
      const recommendations = await UserMission.find({
        _id: { $nin: userSubmissions },
        status: '활성',
        isPublic: true,
        $or: [
          { category: { $in: categories } },
          { tags: { $in: tags } }
        ],
        $and: [
          { $or: [
            { 'duration.endDate': { $gt: new Date() } },
            { 'duration.endDate': null }
          ]}
        ]
      })
      .populate('creator', 'name profileImage')
      .sort({ 'stats.participantCount': -1 })
      .limit(limit)
      .lean();
      
      // 5. 추천 결과가 충분하지 않으면 인기 미션으로 보충
      if (recommendations.length < limit) {
        const popularMissions = await this.getPopularMissions(limit - recommendations.length);
        
        // 중복 제거
        const existingIds = recommendations.map(m => m._id.toString());
        const additionalMissions = popularMissions.filter(m => !existingIds.includes(m._id.toString()));
        
        recommendations.push(...additionalMissions);
      }
      
      return recommendations;
    } catch (error) {
      logger.error('추천 미션 목록 조회 실패:', error);
      throw new ApiError(500, `추천 미션 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 미션 삭제 (관리자 전용)
   * 
   * @param {string} missionId - 미션 ID
   * @param {string} userId - 사용자 ID (관리자)
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteMission(missionId, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(missionId)) {
        throw new ApiError(400, '유효하지 않은 미션 ID입니다.');
      }

      // 관리자 확인
      const isAdmin = await this._isAdmin(userId);
      if (!isAdmin) {
        throw new ApiError(403, '미션 삭제는 관리자만 가능합니다.');
      }

      // 미션 조회
      const mission = await UserMission.findById(missionId);
      if (!mission) {
        throw new ApiError(404, '미션을 찾을 수 없습니다.');
      }

      // 미션 제출물 확인
      const submissions = await UserMissionSubmission.countDocuments({ mission: missionId });
      if (submissions > 0) {
        throw new ApiError(403, '제출물이 있는 미션은 삭제할 수 없습니다.');
      }

      // 미션 삭제
      await UserMission.findByIdAndDelete(missionId);

      logger.info(`유저 미션 삭제: ${missionId}`, { userId });
      return { success: true, message: '미션이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      logger.error(`미션 삭제 실패 ${missionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `미션 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const userMissionService = new UserMissionService();
module.exports = userMissionService;
