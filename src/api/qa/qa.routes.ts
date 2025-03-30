import express from 'express';
import { qaController } from './qa.controller';
import { authorize } from "../../middlewares/authorization.middleware";
import { validateQuestionCreate, validateAnswerCreate, validateQuestionCommentCreate, validateAnswerCommentCreate, validateQuestionVote, validateAnswerVote, validateTagCreate, validateAcceptAnswer, validateUpdateQuestion, validateUpdateAnswer, validateGetQuestionsQuery } from './qa.validation';
import { questionCreateLimiter, questionGetLimiter, questionUpdateLimiter, questionDeleteLimiter, answerCreateLimiter, answerUpdateLimiter, answerDeleteLimiter, commentCreateLimiter, commentDeleteLimiter, voteLimiter, tagCreateLimiter, acceptAnswerLimiter } from './qa.rateLimiting';

const router = express.Router();

// Question routes
router.post(
    '/questions',
    authorize,
    questionCreateLimiter,
    validateQuestionCreate,
    qaController.createQuestion
);
router.get(
    '/questions',
    questionGetLimiter,
    validateGetQuestionsQuery,
    qaController.getQuestions
);
router.get(
    '/questions/:id',
    questionGetLimiter,
    qaController.getQuestionById
);
router.put(
    '/questions/:id',
    authorize,
    questionUpdateLimiter,
    validateUpdateQuestion,
    qaController.updateQuestion
);
router.delete(
    '/questions/:id',
    authorize,
    questionDeleteLimiter,
    qaController.deleteQuestion
);
router.delete(
    '/admin/questions/:id',
    authorize,
    qaController.adminDeleteQuestion
);

// User questions
router.get(
    '/users/questions',
    authorize,
    questionGetLimiter,
    validateGetQuestionsQuery,
    qaController.getUserQuestions
);
router.get(
    '/users/:userId/questions',
    questionGetLimiter,
    validateGetQuestionsQuery,
    qaController.getUserQuestions
);

// Answer routes
router.post(
    '/answers',
    authorize,
    answerCreateLimiter,
    validateAnswerCreate,
    qaController.createAnswer
);
router.get(
    '/answers/:id',
    qaController.getAnswerById
);
router.put(
    '/answers/:id',
    authorize,
    answerUpdateLimiter,
    validateUpdateAnswer, qaController.updateAnswer
);
router.delete(
    '/answers/:id',
    authorize,
    answerDeleteLimiter,
    qaController.deleteAnswer
);
router.delete(
    '/admin/answers/:id',
    authorize,
    qaController.adminDeleteAnswer
);
router.post(
    '/answers/accept',
    authorize,
    acceptAnswerLimiter,
    validateAcceptAnswer,
    qaController.acceptAnswer
);

// Question comment routes
router.post(
    '/questions/comments',
    authorize,
    commentCreateLimiter,
    validateQuestionCommentCreate,
    qaController.createQuestionComment
);
router.delete(
    '/questions/comments/:id',
    authorize,
    commentDeleteLimiter,
    qaController.deleteQuestionComment
);
router.delete(
    '/admin/questions/comments/:id',

    authorize,
    qaController.adminDeleteQuestionComment
);

// Answer comment routes
router.post(
    '/answers/comments',
    authorize,
    commentCreateLimiter,
    validateAnswerCommentCreate,
    qaController.createAnswerComment
);
router.delete(
    '/answers/comments/:id',
    authorize,
    commentDeleteLimiter,
    qaController.deleteAnswerComment
);
router.delete(
    '/admin/answers/comments/:id',
    authorize,
    qaController.adminDeleteAnswerComment
);

// Voting routes
router.post(
    '/questions/vote',
    authorize,
    voteLimiter,
    validateQuestionVote,
    qaController.voteQuestion
);
router.post(
    '/answers/vote',
    authorize,
    voteLimiter,
    validateAnswerVote,
    qaController.voteAnswer

);

// Tag routes
router.post(

    '/tags',
    authorize,
    tagCreateLimiter,
    validateTagCreate,
    qaController.createTag
);
router.get(
    '/tags',
    qaController.getTags
);
router.get(
    '/tags/:id',
    qaController.getTagById
);

// Statistics routes
router.get(
    '/statistics',
    authorize,
    qaController.getQAStatistics
);

export default router;