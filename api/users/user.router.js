
const { createUser,
    getUserByUserId,
    getUsers,
    updateUser,
    deleteUser,
    login,
    logout,
    forgetPassword,
    resetPassword,
    refreshToken,
    subscriptionList,
    buySubscription
} = require('./user.controller');
const router = require('express').Router();
const { checkAccessToken, validatePassword, checkResetToken, checkRefreshToken } = require('../../auth/token_validation');

router.post('/', checkAccessToken, createUser);
router.get('/', checkAccessToken, getUsers);
router.get('/subscription-list', checkAccessToken, subscriptionList);
router.post('/buy-subscription', checkAccessToken, buySubscription);
router.get('/:id', checkAccessToken, getUserByUserId);
router.patch('/:id', checkAccessToken, updateUser);
router.delete('/:id', checkAccessToken, deleteUser);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgetPassword', forgetPassword);
router.post('/reset-password', checkResetToken, validatePassword, resetPassword);
router.post('/refresh-token', checkRefreshToken, refreshToken);

module.exports = router;