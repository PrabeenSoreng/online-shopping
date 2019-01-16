const express = require('express');
const { check, body } = require('express-validator/check');
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', [
    body('email', 'Please enter valid Email.').isEmail().normalizeEmail(),
    body('password', 'Minimum password length is 5.').isLength({ min: 5 }).trim()
], authController.postLogin);

router.get('/signup', authController.getSignup);

router.post('/signup', [
    check('email').isEmail().withMessage('Please enter a valid Email.').custom((value, { req }) => {
        return User.findOne({ email: value })
            .then(userdoc => {
                if (userdoc) {
                    return Promise.reject('E-mail exists already, please pick a different one.');
                }
            });
    }).normalizeEmail(),
    body('password', 'Password should be alphanumeric with minimum length of 5.').isLength({ min: 5 }).isAlphanumeric().trim(),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords have to match!');
        }
        return true;
    }).trim()
], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;