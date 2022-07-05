require('dotenv').config();
const sequelize = require('../../config/seq_database');
const Registration = require('../../model/users');
const Details = require('../../model/user.detail');
const nodemailer = require('nodemailer');
const { genSaltSync, hashSync, compareSync } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
const { Op } = require("sequelize");

Registration.hasMany(Details);
Details.belongsTo(Registration);

sequelize.sync().then((result) => {
}).catch((err) => {
    console.log(err);
});

module.exports = {
    createUser: (req, res) => {
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.create({
            firstName: body.first_name,
            role_id: 2,
            lastName: body.last_name,
            gender: body.gender,
            email: body.email,
            password: body.password,
            number: body.number
        }).then(customer => {
            return customer.createDetail({address: body.address});
        }).then(details => {
            console.log('User location is ',details);
            return res.json({
                success: 1,
                message: 'User added successfully'
            });
        }).catch(error => {
            return res.json({
                success: 0,
                message: 'User not created!'
            });
        });
    },
    getUsers: (req, res) => {
        Registration.findAll({
            where: {
                role_id: {
                    [Op.ne]: 1
                }
            },
            attributes: {
                exclude: ['reset_password_token', 'password', 'role_id']
            }
        }).then(allUsers => {
            console.log(allUsers);
            if (allUsers.length === 0) {
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            } else {
                return res.json({
                    success: 1,
                    message: allUsers
                });
            }
        }).catch(error => {
            return res.json({
                success: 0,
                message: error
            });
        });
    },
    getUserByUserId: (req, res) => {
        const regId = req.params.id;
        Registration.findAll({
            where: {
                role_id: {
                    [Op.ne]: 1
                },
                id: regId
            },
            attributes: {
                exclude: ['reset_password_token', 'password', 'role_id']
            }
        }).then(data =>{
            if(data.length > 0){
                return res.json({
                    success: 1,
                    message: data
                });
            }else{
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            }
        });
    },
    updateUser: (req, res) => {
        const regId = req.params.id;
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.findOne({
            where: {
                role_id: 2,
                id: regId
            }
        })
        .then(record => {
            if (!record) {
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            }
            let values = {
                registered : true,
                firstName: body.first_name,
                lastName: body.last_name,
                gender: body.gender,
                email: body.email,
                password: body.password,
                number: body.number
            }
            record.update(values).then( updatedRecord => {
                return res.json({
                    success: 1,
                    message: 'User updated successfully'
                });
            })
        })
        .catch((error) => {
            return res.json({
                success: 0,
                message: 'User not updated!'
            });
        })
    },
    deleteUser: (req, res) => {
        const regId = req.params.id;
        Registration.destroy({ where: {id: regId} }).then(rowDeleted =>{          
            if(rowDeleted === 1){
                return res.json({
                    success: 1,
                    message: 'User deleted successfully'
                });
            }else{
                return res.json({
                    success: 0,
                    message: 'Record not found!'
                });
            }
        });
    },
    login: (req, res) => {
        const body = req.body;
        if (!body.email && !body.password) {
            return res.json({
                success: 0,
                message: 'Please fill all fields...!'
            });
        }
        if (!body.email) {
            return res.json({
                success: 0,
                message: 'Please fill email'
            });
        }
        if (!body.password) {
            return res.json({
                success: 0,
                message: 'Please fill password'
            });
        }
        Registration.findOne({where: {email: body.email}}).then(results => {
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid Email'
                });
            }
            const result = compareSync(body.password, results.password);
            if (result) {
                results.password = undefined;
                const access_token = sign({
                    email: body.email
                }, process.env.JWT_KEY, {
                    expiresIn: '1h',
                });
                const refresh_token = sign({
                    email: body.email
                }, process.env.JWT_LOGIN_KEY, {
                    expiresIn: '24h',
                });
                return res.json({
                    success: 1,
                    message: 'login successfully',
                    access_token: access_token,
                    refresh_token: refresh_token
                });
            } else {
                return res.json({
                    success: 0,
                    data: 'Wrong Password!'
                });
            }
        });
    },
    logout: (req, res) => {
        const body = req.body;
        if (!body.token) {
            return res.json({
                success: 0,
                data: 'Token required!'
            });
        } else {
            var decoded = jwt_destroy(body.token);
            return res.json({
                success: 1,
                data: 'User Logout Successfully!'
            });
        }
    },
    forgetPassword: (req, res) => {
        const body = req.body;
        const baseUrl = process.env.BASEURL + process.env.APP_PORT + req.baseUrl;
        Registration.findOne({where: {email: body.email}}).then(results => {
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid email'
                });
            }
            const token = sign({
                id: results.dataValues.id,
            }, process.env.JWT_RESET_KEY, {
                expiresIn: '1h',
            });
            let values = {
                registered : true,
                reset_password_token: token,
            }
            results.update(values).then(updatedPassword => {
                if (!updatedPassword) {
                    return res.json({
                        success: 0,
                        message: 'Reset password link sending failed...!'
                    });
                }
            });
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS
                }
            });
            const mailOptions = {
                from: 'Zamin Mirza',
                to: body.email,
                subject: 'Reset Password Link - 01Synergy',
                html: '<p>You requested for reset password, kindly use below token to reset your password</p><br><p>TOKEN - '+ token
            }
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return res.json({
                        success: 0,
                        message: 'Mail sending failed!'
                    });
                } else {
                    return res.json({
                        success: 1,
                        message: 'Mail sent'
                    });
                }
            });
            return res.json({
                success: 1,
                message: 'Password reset link has been sent to your emails. please check...',
                token: token
            });
        })
    },
    resetPassword: (req, res) => {
        const body = req.body;
        const token = body.token;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        Registration.findOne({where: {reset_password_token: token}}).then(results => {
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid token'
                });
            }
            let values = {
                password: body.password,
            }
            results.update(values).then( updatedPassword => {
                return res.json({
                    success: 1,
                    message: 'Password reset successfully'
                });
            }).catch(error => {
                return res.json({
                    success: 0,
                    message: 'Password not reset!'
                });
            })
        })
    },
    refreshToken: (req, res) => {
        const refreshToken = req.body.token;
        var decoded = jwt_decode(refreshToken);
        var email = decoded.email;
        Registration.findOne({where: {email: email}}).then(results => { 
            if (!results) {
                return res.json({
                    success: 0,
                    message: 'Invalid Email'
                });
            }
            results.password = undefined;
            const access_token = sign({
                email: email
            }, process.env.JWT_KEY, {
                expiresIn: '1h',
            });
            const refresh_token = sign({
                email: email
            }, process.env.JWT_LOGIN_KEY, {
                expiresIn: '24h',
            });
            var data = {
                access_token: access_token,
                refresh_token: refresh_token,
            }
            return res.json({
                success: 1,
                access_token: access_token,
                refresh_token: refresh_token
            });
        })
    }
}