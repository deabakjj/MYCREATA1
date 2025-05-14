/**
 * 유저 생성 미션 제출물 서비스
 * 
 * 유저 생성 미션에 대한 제출물 관련 비즈니스 로직을 처리합니다.
 * 제출물 생성, 조회, 평가, 보상 지급 등의 기능을 제공합니다.
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
 * 유저 생성 미션 제출물 서비스 클래스
 */
class UserMissionSubmissionService {
  /**
   * 미션 제출물 생성
   * 
   * @param {string} missionId - 미션 ID
   * @param {Object} submissionData - 제출 데이터
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 제출물
   */
  async createSubmission(missionId, submissionData, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(missionId)) {
        throw new ApiError(400, '유효하지 않은 미션 ID입니다.');
      }

      // 사용자 확인
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, '사용자를 찾을 수 없습니다.');
      }

      // 미션 조회
      const mission = await UserMission.findById(missionId);
      if (!mission) {
        throw new ApiError(404, '미션을 찾을 수 없습니다.');
      }

      // 미션 상태 확인
      if (mission.status !== '활성') {
        throw new ApiError(403, '활성 상태의 미션에만 제출할 수 있습니다.');
      }

      // 미션 기간 확인
      const now = new Date();
      if (mission.duration.startDate && now < new Date(mission.duration.startDate)) {
        throw new ApiError(403, '미션이 아직 시작되지 않았습니다.');
      }
      
      if (mission.duration.endDate && now > new Date(mission.duration.endDate)) {
        throw new ApiError(403, '미션이 종료되었습니다.');
      }

      // 참여 제한 인원 확인
      if (mission.maxParticipants > 0 && mission.stats.participantCount >= mission.maxParticipants) {
        throw new ApiError(403, '미션 참여 인원이 마감되었습니다.');
      }

      // 기존 제출물 확인 (중복 제출 방지)
      const existingSubmission = await UserMissionSubmission.findOne({
        mission: missionId,
        submitter: userId
      });
      
      if (existingSubmission) {
        throw new ApiError(403, '이미 이 미션에 제출하셨습니다.');
      }

      // 제출 데이터 검증
      this._validateSubmissionData(submissionData, mission);

      // 제출물 요약 생성
      const summary = this._generateSubmissionSummary(submissionData);

      // 제출물 객체 생성
      const submission = new UserMissionSubmission({
        mission: missionId,
        submitter: userId,
        content: {
          fields: submissionData.fields,
          summary
        },
        status: '대기',
        isPublic: submissionData.isPublic !== false,
        stats: {
          likeCount: 0,
          commentCount: 0,
          viewCount: 0
        }
      });

      // DAO 투표가 필요한 경우 초기화
      if (mission.approvalType === 'DAO' || mission.approvalType === '투표') {
        submission.daoVote = {
          approvalCount: 0,
          rejectionCount: 0,
          voters: [],
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후 종료
        };
      }

      // 제출물 저장
      await submission.save();

      // 미션 통계 업데이트
      await mission.incrementParticipantCount();
      await mission.incrementSubmissionCount();
      
      logger.info(`유저 미션 제출물 생성: ${submission._id}`, { userId, missionId });

      return submission;
    } catch (error) {
      logger.error('유저 미션 제출물 생성 실패:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 제출 데이터 검증
   * 
   * @param {Object} submissionData - 제출 데이터
   * @param {Object} mission - 미션 정보
   * @private
   */
  _validateSubmissionData(submissionData, mission) {
    // 필수 필드 확인
    if (!submissionData || !submissionData.fields || !Array.isArray(submissionData.fields)) {
      throw new ApiError(400, '유효한 제출 데이터가 필요합니다.');
    }

    // 제출 유형에 따른 검증
    if (mission.submissionType === '복합') {
      // 필수 필드 존재 확인
      if (mission.submissionFields && mission.submissionFields.length > 0) {
        const requiredFields = mission.submissionFields
          .filter(field => field.required)
          .map(field => field.name);
        
        const submittedFieldNames = submissionData.fields.map(field => field.name);
        
        for (const requiredField of requiredFields) {
          if (!submittedFieldNames.includes(requiredField)) {
            throw new ApiError(400, `필수 필드 '${requiredField}'가 누락되었습니다.`);
          }
        }
      }
      
      // 각 필드 유효성 검증
      for (const field of submissionData.fields) {
        // 필드 이름과 타입 확인
        if (!field.name || !field.type) {
          throw new ApiError(400, '모든 필드는 이름과 타입이 필요합니다.');
        }
        
        // 미션 정의 필드와 비교
        const missionField = mission.submissionFields.find(f => f.name === field.name);
        if (missionField && field.type !== missionField.type) {
          throw new ApiError(400, `필드 '${field.name}'의 타입이 일치하지 않습니다.`);
        }
        
        // 필드 타입에 따른 값 확인
        switch (field.type) {
          case '텍스트':
          case '장문텍스트':
            if (!field.textValue) {
              throw new ApiError(400, `필드 '${field.name}'의 텍스트 값이 누락되었습니다.`);
            }
            
            // 길이 제한 확인
            if (missionField && missionField.maxLength && field.textValue.length > missionField.maxLength) {
              throw new ApiError(400, `필드 '${field.name}'의 텍스트가 최대 길이를 초과했습니다.`);
            }
            
            if (missionField && missionField.minLength && field.textValue.length < missionField.minLength) {
              throw new ApiError(400, `필드 '${field.name}'의 텍스트가 최소 길이보다 짧습니다.`);
            }
            break;
            
          case '이미지':
            if (!field.imageUrl) {
              throw new ApiError(400, `필드 '${field.name}'의 이미지가 누락되었습니다.`);
            }
            break;
            
          case '파일':
            if (!field.file || !field.file.url) {
              throw new ApiError(400, `필드 '${field.name}'의 파일이 누락되었습니다.`);
            }
            break;
            
          case '링크':
            if (!field.linkUrl) {
              throw new ApiError(400, `필드 '${field.name}'의 링크가 누락되었습니다.`);
            }
            
            // 링크 형식 확인
            try {
              new URL(field.linkUrl);
            } catch (e) {
              throw new ApiError(400, `필드 '${field.name}'의 링크 형식이 올바르지 않습니다.`);
            }
            break;
            
          case '체크박스':
            if (field.checkboxValue === undefined) {
              throw new ApiError(400, `필드 '${field.name}'의 체크박스 값이 누락되었습니다.`);
            }
            break;
            
          case '날짜':
            if (!field.dateValue) {
              throw new ApiError(400, `필드 '${field.name}'의 날짜가 누락되었습니다.`);
            }
            
            // 날짜 형식 확인
            if (isNaN(new Date(field.dateValue).getTime())) {
              throw new ApiError(400, `필드 '${field.name}'의 날짜 형식이 올바르지 않습니다.`);
            }
            break;
        }
      }
    } else {
      // 단일 유형 제출
      if (submissionData.fields.length === 0) {
        throw new ApiError(400, '제출 데이터가 필요합니다.');
      }
      
      const field = submissionData.fields[0];
      
      // 미션 제출 유형과 필드 타입 확인
      const expectedType = mission.submissionType === '텍스트' ? '텍스트' :
                            mission.submissionType === '이미지' ? '이미지' :
                            mission.submissionType === '파일' ? '파일' :
                            mission.submissionType === '링크' ? '링크' :
                            mission.submissionType === '체크리스트' ? '체크박스' : null;
      
      if (field.type !== expectedType) {
        throw new ApiError(400, `제출 타입이 미션 요구사항과 일치하지 않습니다. 예상: ${expectedType}, 실제: ${field.type}`);
      }
      
      // 필드 값 확인
      switch (field.type) {
        case '텍스트':
          if (!field.textValue) {
            throw new ApiError(400, '텍스트 값이 누락되었습니다.');
          }
          break;
          
        case '이미지':
          if (!field.imageUrl) {
            throw new ApiError(400, '이미지가 누락되었습니다.');
          }
          break;
          
        case '파일':
          if (!field.file || !field.file.url) {
            throw new ApiError(400, '파일이 누락되었습니다.');
          }
          break;
          
        case '링크':
          if (!field.linkUrl) {
            throw new ApiError(400, '링크가 누락되었습니다.');
          }
          
          // 링크 형식 확인
          try {
            new URL(field.linkUrl);
          } catch (e) {
            throw new ApiError(400, '링크 형식이 올바르지 않습니다.');
          }
          break;
          
        case '체크박스':
          if (field.checkboxValue === undefined) {
            throw new ApiError(400, '체크박스 값이 누락되었습니다.');
          }
          break;
      }
    }
  }

  /**
   * 제출물 요약 생성
   * 
   * @param {Object} submissionData - 제출 데이터
   * @returns {string} 제출물 요약
   * @private
   */
  _generateSubmissionSummary(submissionData) {
    let summary = '';
    
    // 텍스트 필드 우선 사용
    const textField = submissionData.fields.find(f => f.type === '텍스트' || f.type === '장문텍스트');
    if (textField && textField.textValue) {
      // 텍스트 길이 제한
      summary = textField.textValue.length > 200 ? 
                `${textField.textValue.substring(0, 200)}...` : 
                textField.textValue;
      return summary;
    }
    
    // 텍스트가 없는 경우 다른 필드 타입 사용
    for (const field of submissionData.fields) {
      switch (field.type) {
        case '이미지':
          summary = '이미지 제출';
          break;
          
        case '파일':
          summary = field.file?.name ? `파일 제출: ${field.file.name}` : '파일 제출';
          break;
          
        case '링크':
          summary = `링크 제출: ${field.linkUrl}`;
          break;
          
        case '체크박스':
          summary = field.checkboxValue ? '체크됨' : '체크되지 않음';
          break;
          
        case '날짜':
          summary = `날짜 선택: ${new Date(field.dateValue).toLocaleDateString()}`;
          break;
      }
      
      // 첫 번째 유효한 필드만 사용
      if (summary) {
        break;
      }
    }
    
    return summary || '제출물';
  }

  /**
   * 제출물 조회
   * 
   * @param {string} submissionId - 제출물 ID
   * @param {string} userId - 조회 사용자 ID (선택 사항)
   * @returns {Promise<Object>} 제출물 정보
   */
  async getSubmission(submissionId, userId = null) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError(400, '유효하지 않은 제출물 ID입니다.');
      }

      // 제출물 조회
      const submission = await UserMissionSubmission.findById(submissionId)
        .populate('submitter', 'name profileImage')
        .populate('mission')
        .populate('evaluation.evaluator', 'name profileImage')
        .lean();

      if (!submission) {
        throw new ApiError(404, '제출물을 찾을 수 없습니다.');
      }

      // 미션 정보
      const mission = submission.mission;
      
      // 접근 권한 확인
      const isSubmitter = userId && submission.submitter._id.toString() === userId;
      const isCreator = userId && mission.creator.toString() === userId;
      const isAdmin = await this._isAdmin(userId);
      
      // 비공개 제출물인 경우 권한 확인
      if (!submission.isPublic && !isSubmitter && !isCreator && !isAdmin) {
        throw new ApiError(403, '이 제출물에 접근할 권한이 없습니다.');
      }
      
      // 미션 결과물 공개 설정에 따른 권한 확인
      if (!isSubmitter && !isCreator && !isAdmin) {
        if (mission.community.resultSharing === '비공개') {
          throw new ApiError(403, '이 미션은 결과물 공개가 비활성화되어 있습니다.');
        }
        
        if (mission.community.resultSharing === '참여자만') {
          // 사용자가 참여자인지 확인
          const isParticipant = await UserMissionSubmission.exists({
            mission: mission._id,
            submitter: userId
          });
          
          if (!isParticipant) {
            throw new ApiError(403, '이 미션에 참여한 사용자만 결과물을 볼 수 있습니다.');
          }
        }
        
        if (mission.community.resultSharing === '승인됨만' && submission.status !== '승인') {
          throw new ApiError(403, '승인된 결과물만 공개됩니다.');
        }
      }

      // 조회수 증가 (본인 제외)
      if (userId && submission.submitter._id.toString() !== userId) {
        await UserMissionSubmission.findByIdAndUpdate(submissionId, { $inc: { 'stats.viewCount': 1 } });
      }

      // 역할 정보 추가
      submission.isSubmitter = isSubmitter;
      submission.isCreator = isCreator;
      submission.isAdmin = isAdmin;

      return submission;
    } catch (error) {
      logger.error(`제출물 조회 실패 ${submissionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 미션별 제출물 목록 조회
   * 
   * @param {string} missionId - 미션 ID
   * @param {Object} filter - 필터 조건
   * @param {Object} options - 페이지네이션, 정렬 옵션
   * @param {string} userId - 조회 사용자 ID (선택 사항)
   * @returns {Promise<Object>} 제출물 목록 및 페이지네이션 정보
   */
  async getSubmissionsByMission(missionId, filter = {}, options = {}, userId = null) {
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
      
      // 미션 결과물 공개 설정에 따른 권한 확인
      const isCreator = userId && mission.creator.toString() === userId;
      const isAdmin = await this._isAdmin(userId);
      
      if (!isCreator && !isAdmin) {
        if (mission.community.resultSharing === '비공개') {
          throw new ApiError(403, '이 미션은 결과물 공개가 비활성화되어 있습니다.');
        }
        
        if (mission.community.resultSharing === '참여자만') {
          // 사용자가 참여자인지 확인
          const isParticipant = await UserMissionSubmission.exists({
            mission: missionId,
            submitter: userId
          });
          
          if (!isParticipant) {
            throw new ApiError(403, '이 미션에 참여한 사용자만 결과물을 볼 수 있습니다.');
          }
        }
      }

      // 기본 옵션 설정
      const { page = 1, limit = 20, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      // 쿼리 빌드
      const query = this._buildSubmissionsQuery(missionId, filter, userId, mission, isCreator, isAdmin);

      // 총 건수 조회
      const total = await UserMissionSubmission.countDocuments(query);

      // 제출물 목록 조회
      const submissions = await UserMissionSubmission.find(query)
        .populate('submitter', 'name profileImage')
        .populate('evaluation.evaluator', 'name profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // 사용자 역할 정보 추가
      const enhancedSubmissions = submissions.map(submission => {
        const isSubmitter = userId && submission.submitter._id.toString() === userId;
        return {
          ...submission,
          isSubmitter
        };
      });

      // 페이지네이션 정보
      const pagination = {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      };

      return {
        submissions: enhancedSubmissions,
        pagination,
        mission: {
          isCreator,
          isAdmin
        }
      };
    } catch (error) {
      logger.error(`미션별 제출물 목록 조회 실패 ${missionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 제출물 쿼리 빌드
   * 
   * @param {string} missionId - 미션 ID
   * @param {Object} filter - 필터 조건
   * @param {string} userId - 사용자 ID
   * @param {Object} mission - 미션 정보
   * @param {boolean} isCreator - 미션 작성자 여부
   * @param {boolean} isAdmin - 관리자 여부
   * @returns {Object} 쿼리 객체
   * @private
   */
  _buildSubmissionsQuery(missionId, filter, userId, mission, isCreator, isAdmin) {
    const query = { mission: missionId };

    // 상태 필터
    if (filter.status) {
      query.status = filter.status;
    } else if (mission.community.resultSharing === '승인됨만' && !isCreator && !isAdmin) {
      // 결과물 공개 설정이 '승인됨만'인 경우 승인된 제출물만 표시
      query.status = '승인';
    }

    // 공개 여부 필터
    if (!isCreator && !isAdmin) {
      query.isPublic = true;
      
      // 본인 제출물은 항상 볼 수 있음
      if (userId) {
        query.$or = [
          { isPublic: true },
          { submitter: userId }
        ];
      }
    }

    // 제출자 필터
    if (filter.submitter) {
      query.submitter = filter.submitter;
    }

    // 검색어 필터
    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    return query;
  }

  /**
   * 사용자별 제출물 목록 조회
   * 
   * @param {string} userId - 사용자 ID
   * @param {Object} filter - 필터 조건
   * @param {Object} options - 페이지네이션, 정렬 옵션
   * @returns {Promise<Object>} 제출물 목록 및 페이지네이션 정보
   */
  async getSubmissionsByUser(userId, filter = {}, options = {}) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, '유효하지 않은 사용자 ID입니다.');
      }

      // 사용자 확인
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, '사용자를 찾을 수 없습니다.');
      }

      // 기본 옵션 설정
      const { page = 1, limit = 20, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      // 쿼리 빌드
      const query = { submitter: userId };

      // 상태 필터
      if (filter.status) {
        query.status = filter.status;
      }

      // 공개 여부 필터
      if (filter.isPublic !== undefined) {
        query.isPublic = filter.isPublic;
      }

      // 검색어 필터
      if (filter.search) {
        query.$text = { $search: filter.search };
      }

      // 총 건수 조회
      const total = await UserMissionSubmission.countDocuments(query);

      // 제출물 목록 조회
      const submissions = await UserMissionSubmission.find(query)
        .populate('mission', 'title category')
        .populate('evaluation.evaluator', 'name profileImage')
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

      return { submissions, pagination };
    } catch (error) {
      logger.error(`사용자별 제출물 목록 조회 실패 ${userId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 제출물 평가 (승인/반려)
   * 
   * @param {string} submissionId - 제출물 ID
   * @param {Object} evaluationData - 평가 데이터
   * @param {string} userId - 평가자 ID
   * @returns {Promise<Object>} 평가된 제출물
   */
  async evaluateSubmission(submissionId, evaluationData, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError(400, '유효하지 않은 제출물 ID입니다.');
      }

      // 제출물 조회
      const submission = await UserMissionSubmission.findById(submissionId)
        .populate('mission');

      if (!submission) {
        throw new ApiError(404, '제출물을 찾을 수 없습니다.');
      }

      // 미션 정보
      const mission = submission.mission;

      // 승인 권한 확인
      const isCreator = mission.creator.toString() === userId;
      const isAdmin = await this._isAdmin(userId);

      if (!isCreator && !isAdmin) {
        throw new ApiError(403, '제출물 평가 권한이 없습니다.');
      }

      // 이미 평가된 제출물인지 확인
      if (submission.status !== '대기') {
        throw new ApiError(403, `이미 ${submission.status} 상태인 제출물입니다.`);
      }

      // 평가 데이터 검증
      if (!evaluationData || !evaluationData.status) {
        throw new ApiError(400, '평가 상태가 필요합니다.');
      }

      if (evaluationData.status !== '승인' && evaluationData.status !== '반려') {
        throw new ApiError(400, '유효한 평가 상태가 아닙니다.');
      }

      if (evaluationData.status === '반려' && !evaluationData.reason) {
        throw new ApiError(400, '반려 이유가 필요합니다.');
      }

      // 평가 처리
      let updatedSubmission;

      if (evaluationData.status === '승인') {
        updatedSubmission = await submission.approve(
          userId,
          evaluationData.score || 100,
          evaluationData.comment || '승인되었습니다.'
        );

        // 미션 통계 업데이트
        await mission.incrementApprovedCount();

        // 보상 지급 처리
        await this._processRewards(updatedSubmission);
      } else {
        updatedSubmission = await submission.reject(
          userId,
          evaluationData.reason,
          evaluationData.score || 0
        );
      }

      logger.info(`유저 미션 제출물 평가: ${submissionId} -> ${evaluationData.status}`, { userId });
      return updatedSubmission;
    } catch (error) {
      logger.error(`제출물 평가 실패 ${submissionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 평가 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * DAO 투표 처리
   * 
   * @param {string} submissionId - 제출물 ID
   * @param {Object} voteData - 투표 데이터
   * @param {string} userId - 투표자 ID
   * @returns {Promise<Object>} 업데이트된 제출물
   */
  async voteSubmission(submissionId, voteData, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError(400, '유효하지 않은 제출물 ID입니다.');
      }

      // 제출물 조회
      const submission = await UserMissionSubmission.findById(submissionId)
        .populate('mission');

      if (!submission) {
        throw new ApiError(404, '제출물을 찾을 수 없습니다.');
      }

      // 미션 정보
      const mission = submission.mission;

      // DAO 투표 미션인지 확인
      if (mission.approvalType !== 'DAO' && mission.approvalType !== '투표') {
        throw new ApiError(403, '이 미션은 DAO 투표 방식이 아닙니다.');
      }

      // 투표 상태 확인
      if (submission.status !== '대기') {
        throw new ApiError(403, `이미 ${submission.status} 상태인 제출물입니다.`);
      }

      // 투표 종료 시간 확인
      if (submission.daoVote.endTime && new Date() > new Date(submission.daoVote.endTime)) {
        throw new ApiError(403, '투표 기간이 종료되었습니다.');
      }

      // 투표 데이터 검증
      if (!voteData || voteData.approved === undefined) {
        throw new ApiError(400, '투표 결과가 필요합니다.');
      }

      // 본인 제출물 투표 불가
      if (submission.submitter.toString() === userId) {
        throw new ApiError(403, '본인 제출물에는 투표할 수 없습니다.');
      }

      // 투표 처리
      const updatedSubmission = await submission.addVote(
        userId,
        voteData.approved,
        voteData.comment
      );

      // 투표 결과 처리 (투표율이 일정 이상이면 자동 승인/반려)
      const totalVotes = updatedSubmission.daoVote.approvalCount + updatedSubmission.daoVote.rejectionCount;
      const requiredVotes = 5; // 최소 투표 수 설정
      
      if (totalVotes >= requiredVotes) {
        const approvalRate = (updatedSubmission.daoVote.approvalCount / totalVotes) * 100;
        
        if (approvalRate >= mission.approvalThreshold) {
          // 승인 처리
          await updatedSubmission.approve(
            null, // DAO 투표로 결정됨
            approvalRate,
            `DAO 투표 결과 승인되었습니다. (찬성률: ${approvalRate.toFixed(2)}%)`
          );
          
          // 미션 통계 업데이트
          await mission.incrementApprovedCount();
          
          // 보상 지급 처리
          await this._processRewards(updatedSubmission);
        } else if (approvalRate < mission.approvalThreshold / 2) {
          // 반려 처리 (기준의 절반 이하면 자동 반려)
          await updatedSubmission.reject(
            null, // DAO 투표로 결정됨
            `DAO 투표 결과 반려되었습니다. (찬성률: ${approvalRate.toFixed(2)}%)`
          );
        }
      }

      logger.info(`유저 미션 제출물 투표: ${submissionId}`, { userId, approved: voteData.approved });
      return updatedSubmission;
    } catch (error) {
      logger.error(`제출물 투표 실패 ${submissionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 투표 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 보상 지급 처리
   * 
   * @param {Object} submission - 제출물 객체
   * @returns {Promise<void>}
   * @private
   */
  async _processRewards(submission) {
    try {
      const mission = await UserMission.findById(submission.mission);
      if (!mission) {
        logger.error(`보상 지급 실패: 미션을 찾을 수 없습니다. ${submission.mission}`);
        return;
      }

      const userId = submission.submitter;

      // XP 보상 지급
      if (mission.rewards.xp > 0) {
        await xpService.addXP(userId, mission.rewards.xp, 'mission_completion', {
          missionId: mission._id,
          missionTitle: mission.title
        });
        
        await submission.payXpReward(mission.rewards.xp);
        logger.info(`XP 보상 지급: ${userId}, ${mission.rewards.xp}`, { submissionId: submission._id });
      }

      // 토큰 보상 지급
      if (mission.rewards.nestToken && mission.rewards.nestToken.amount > 0) {
        let tokenAmount = mission.rewards.nestToken.amount;
        
        // 예산 방식인 경우 승인 순서에 따라 금액 조정
        if (mission.rewards.nestToken.type === '예산') {
          const approvedCount = await UserMissionSubmission.countDocuments({
            mission: mission._id,
            status: '승인',
            'rewards.tokenPaid': true
          });
          
          const remainingBudget = mission.rewards.nestToken.budget - (approvedCount * tokenAmount);
          
          if (remainingBudget <= 0) {
            logger.warn(`토큰 보상 예산 소진: ${mission._id}`);
            return;
          }
          
          // 마지막 지급 대상인 경우 남은 예산 모두 지급
          if (remainingBudget < tokenAmount) {
            tokenAmount = remainingBudget;
          }
        }
        
        // 토큰 지급
        const txResult = await tokenService.transferTokens('system', userId, tokenAmount, 'mission_reward', {
          missionId: mission._id,
          missionTitle: mission.title
        });
        
        // 지급 기록
        await submission.payTokenReward(tokenAmount, txResult.txHash);
        logger.info(`토큰 보상 지급: ${userId}, ${tokenAmount}`, { submissionId: submission._id });
      }

      // NFT 보상 지급
      if (mission.rewards.nft && mission.rewards.nft.enabled) {
        try {
          // NFT 민팅
          const nftResult = await nftService.mintNFT(
            userId,
            mission.rewards.nft.collectionId,
            {
              name: mission.rewards.nft.metadata.name || `${mission.title} 완료 인증`,
              description: mission.rewards.nft.metadata.description || `${mission.title} 미션 완료 기념 NFT`,
              imageUrl: mission.rewards.nft.metadata.imageUrl || '',
              attributes: [
                { trait_type: 'Mission', value: mission.title },
                { trait_type: 'Category', value: mission.category },
                { trait_type: 'Difficulty', value: mission.difficulty.toString() },
                { trait_type: 'Completion Date', value: new Date().toISOString().split('T')[0] }
              ]
            }
          );
          
          // 지급 기록
          await submission.payNftReward(nftResult.tokenId, nftResult.txHash);
          logger.info(`NFT 보상 지급: ${userId}, ${nftResult.tokenId}`, { submissionId: submission._id });
        } catch (error) {
          logger.error(`NFT 보상 지급 실패: ${error.message}`, { submissionId: submission._id });
        }
      }

      // 뱃지 보상 지급
      if (mission.rewards.badge && mission.rewards.badge.enabled) {
        try {
          // 뱃지 지급 로직은 별도 서비스 구현 필요
          // 임시 로직
          await submission.payBadgeReward(mission.rewards.badge.badgeId);
          logger.info(`뱃지 보상 지급: ${userId}, ${mission.rewards.badge.badgeId}`, { submissionId: submission._id });
        } catch (error) {
          logger.error(`뱃지 보상 지급 실패: ${error.message}`, { submissionId: submission._id });
        }
      }
    } catch (error) {
      logger.error(`보상 지급 처리 실패: ${error.message}`, { submissionId: submission._id });
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
      if (!userId) return false;
      
      const user = await User.findById(userId);
      return user && user.roles && user.roles.includes('admin');
    } catch (error) {
      logger.error(`관리자 확인 실패 ${userId}:`, error);
      return false;
    }
  }

  /**
   * 제출물 업데이트 (본인만 가능)
   * 
   * @param {string} submissionId - 제출물 ID
   * @param {Object} updateData - 업데이트 데이터
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 제출물
   */
  async updateSubmission(submissionId, updateData, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError(400, '유효하지 않은 제출물 ID입니다.');
      }

      // 제출물 조회
      const submission = await UserMissionSubmission.findById(submissionId)
        .populate('mission');

      if (!submission) {
        throw new ApiError(404, '제출물을 찾을 수 없습니다.');
      }

      // 작성자 확인
      if (submission.submitter.toString() !== userId) {
        throw new ApiError(403, '제출물 수정 권한이 없습니다.');
      }

      // 수정 가능 상태 확인
      if (submission.status !== '대기' && submission.status !== '반려') {
        throw new ApiError(403, `${submission.status} 상태의 제출물은 수정할 수 없습니다.`);
      }

      // 업데이트할 데이터 필터링
      const allowedUpdateFields = ['content', 'isPublic'];
      const filteredUpdateData = {};
      
      for (const field of allowedUpdateFields) {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      }

      // 내용 업데이트 시 검증
      if (filteredUpdateData.content) {
        // 제출 데이터 검증
        this._validateSubmissionData({
          fields: filteredUpdateData.content.fields
        }, submission.mission);
        
        // 요약 재생성
        filteredUpdateData.content.summary = this._generateSubmissionSummary({
          fields: filteredUpdateData.content.fields
        });
      }

      // 제출물 상태 업데이트 (반려 → 대기)
      if (submission.status === '반려') {
        filteredUpdateData.status = '대기';
      }

      // 제출물 업데이트
      const updatedSubmission = await UserMissionSubmission.findByIdAndUpdate(
        submissionId,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      );

      logger.info(`유저 미션 제출물 업데이트: ${submissionId}`, { userId });
      return updatedSubmission;
    } catch (error) {
      logger.error(`제출물 업데이트 실패 ${submissionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 제출물 삭제 (본인 또는 관리자만 가능)
   * 
   * @param {string} submissionId - 제출물 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteSubmission(submissionId, userId) {
    try {
      // ID 유효성 검증
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError(400, '유효하지 않은 제출물 ID입니다.');
      }

      // 제출물 조회
      const submission = await UserMissionSubmission.findById(submissionId);
      if (!submission) {
        throw new ApiError(404, '제출물을 찾을 수 없습니다.');
      }

      // 권한 확인
      const isSubmitter = submission.submitter.toString() === userId;
      const isAdmin = await this._isAdmin(userId);
      
      if (!isSubmitter && !isAdmin) {
        throw new ApiError(403, '제출물 삭제 권한이 없습니다.');
      }

      // 작성자 본인인 경우 추가 제한사항
      if (isSubmitter && !isAdmin) {
        // 승인된 제출물은 삭제 불가
        if (submission.status === '승인') {
          throw new ApiError(403, '승인된 제출물은 삭제할 수 없습니다.');
        }
        
        // 보상이 지급된 제출물 삭제 불가
        if (submission.rewards.xpPaid || submission.rewards.tokenPaid || 
            submission.rewards.nftPaid || submission.rewards.badgePaid) {
          throw new ApiError(403, '보상이 지급된 제출물은 삭제할 수 없습니다.');
        }
      }

      // 미션 통계 업데이트
      const mission = await UserMission.findById(submission.mission);
      if (mission) {
        // 참여자 수 감소 (다른 제출물이 없는 경우만)
        const otherSubmissions = await UserMissionSubmission.exists({
          mission: submission.mission,
          submitter: submission.submitter,
          _id: { $ne: submissionId }
        });
        
        if (!otherSubmissions && mission.stats.participantCount > 0) {
          mission.stats.participantCount -= 1;
        }
        
        // 제출물 수 감소
        if (mission.stats.submissionCount > 0) {
          mission.stats.submissionCount -= 1;
        }
        
        // 승인된 제출물인 경우 승인 수 감소
        if (submission.status === '승인' && mission.stats.approvedCount > 0) {
          mission.stats.approvedCount -= 1;
        }
        
        await mission.save();
      }

      // 제출물 삭제
      await UserMissionSubmission.findByIdAndDelete(submissionId);

      logger.info(`유저 미션 제출물 삭제: ${submissionId}`, { userId });
      return { success: true, message: '제출물이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      logger.error(`제출물 삭제 실패 ${submissionId}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `제출물 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const userMissionSubmissionService = new UserMissionSubmissionService();
module.exports = userMissionSubmissionService;
