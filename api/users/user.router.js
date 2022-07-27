const passport  = require('passport');
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
    buySubscription,
    verifyEmail,
    // verifyEmailSend,
    fileUpload,
    payment,
    payments,
    checkSubscription,
    authFacebook,
    authFacebookCallback
} = require('./user.controller');
const router = require('express').Router();
const { checkAccessToken, validatePassword, checkResetToken, checkRefreshToken } = require('../../auth/token_validation');

let Publishable_Key = 'pk_test_51LOFBCSIWOhbslXvJi4cEwyYEiY7p6s1SYYmCJxFMHDz7Jn3U6Eu7yYmYHr4ZorvmKKvoUhJI0nVFG62MJVxAkdo00n2IDSoTP';
let Secret_Key = 'sk_test_51LOFBCSIWOhbslXvejhEDkhsHX48VlhAuFe0keUoI6ElHscYVCtH43z9dJBPE1QjpjmSkqvVvZdMwhWmSaCmE3Ye002P8Vb9uX';

router.post('/', createUser);
// router.get('/', checkAccessToken, getUsers);
router.get('/subscription-list', checkAccessToken, subscriptionList);
router.post('/buy-subscription', checkAccessToken, buySubscription);
router.get('/check-subscription', checkAccessToken, checkSubscription);
router.post('/file-upload', checkAccessToken, fileUpload);
// router.get('/:id', checkAccessToken, getUserByUserId);
router.patch('/:id', checkAccessToken, updateUser);
router.delete('/:id', checkAccessToken, deleteUser);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgetPassword', forgetPassword);
// router.post('/verify/email', verifyEmailSend);
router.get('/verify/:token/:email', verifyEmail);
router.post('/reset-password', checkResetToken, validatePassword, resetPassword);
router.get('/payment', payment);
router.post('/payments', payments);
router.get('/auth/facebook', passport.authenticate("facebook"));
router.get('/auth/facebook/callback', passport.authenticate("facebook", {
    successRedirect: "/success",
    failureRedirect: "/fail"
  }));

  router.get("/fail", (req, res) => {
    res.send("Failed attempt");
  });
  
  router.get("/success", (req, res) => {
    res.send("Success");
  });
// router.get('/payment', function(req, res){
//     console.log('ok');
//     res.render('Home', {
//        key: Publishable_Key
//     })
// })
router.post('/refresh-token', checkRefreshToken, refreshToken);

module.exports = router;