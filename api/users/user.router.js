
const { createUser,
    getUserByUserId,
    getUsers,
    updateUser,
    deleteUser,
    login,
    logout,
    forgetPassword,
    resetPassword,
    refreshToken
} = require('./user.controller');
const router = require('express').Router();
const { checkAccessToken, validatePassword, checkResetToken, checkRefreshToken } = require('../../auth/token_validation');

router.post('/', checkAccessToken, createUser);
router.get('/', checkAccessToken, getUsers);
router.get('/:id', checkAccessToken, getUserByUserId);
router.patch('/:id', checkAccessToken, updateUser);
router.delete('/:id', checkAccessToken, deleteUser);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgetPassword', forgetPassword);
router.post('/reset-password', checkResetToken, validatePassword, resetPassword);
router.post('/refresh-token', checkRefreshToken, refreshToken);

module.exports = router;