require('dotenv').config();
const { verify } = require('jsonwebtoken');

module.exports = {
    checkAccessToken: (req, res, next) => {
        let token = req.get("authorization");
        if (token) {
            token = token.slice(7);
            verify(token, process.env.JWT_KEY, (err, decoded) => {
                if (err) {
                    res.json({
                        success: 0,
                        message: 'Token expired!'
                    });
                } else {
                    next();
                }
            });
        } else {
            res.json({
                success: 0,
                message: 'Access denied! unauthorized user'
            });
        }
    },
    checkResetToken: (req, res, next) => {
        let token = req.body.token;
        if (token) {
            verify(token, process.env.JWT_KEY, (err, decoded) => {
                if (err) {
                    res.json({
                        success: 0,
                        message: 'Invalid token'
                    });
                } else {
                    next();
                }
            });
        } else {
            res.json({
                success: 0,
                message: 'Token required'
            });
        }
    },
    validatePassword: (req, res, next) => {
        var password = req.body.password;
        var confirmPassword = req.body.confirm_password;
        if (password.length < 6) {
            return res.json({
                success: 0,
                message: 'Password should be minimum 6 characters'
            });
        }
        if(password !== confirmPassword) {
            return res.json({
                success: 0,
                message: 'Password and Confirm Password not matched!'
            });
        } else {
            next();
        }
    },
    checkRefreshToken: (req, res, next) => {
        let token = req.body.token;
        if (token) {
            verify(token, process.env.JWT_LOGIN_KEY, (err, decoded) => {
                if (err) {
                    res.json({
                        success: 0,
                        message: 'Token invalid or expired!'
                    });
                } else {
                    next();
                }
            });
        } else {
            res.json({
                success: 0,
                message: 'Enter token'
            });
        }
    }
}