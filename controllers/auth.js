const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res) => {
    let message = req.flash('error');
    if (message.length > 0) message = message[0];
    else message = null;

    res.render('auth/login', { path: '/login', pageTitle: 'Login', errorMessage: message });
};

exports.postLogin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then(user => {
            req.flash('error', 'Invalid email or password.');
            if (!user) res.redirect('/login');

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log('Error : ', err);
                            res.redirect('/');
                        });
                    }
                    req.flash('error', 'Invalid email or password.');
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });

        })
        .catch(err => console.log(err));
};

exports.getSignup = (req, res) => {
    let message = req.flash('error');
    if (message.length > 0) message = message[0];
    else message = null;

    res.render('auth/signup', { path: '/signup', pageTitle: 'Signup', errorMessage: message });
}

exports.postSignup = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const cpassword = req.body.confirmPassword;
    User.findOne({ email: email })
        .then(userdoc => {
            if (userdoc) {
                req.flash('error', 'E-mail exists already, please pick a different one.');
                return res.redirect('/signup');
            }
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] }
                    });
                    return user.save();
                })
                .then(result => {
                    res.redirect('/login');
                    return transporter.sendMail({
                        to: email,
                        from: 'shop@node-complete.com',
                        subject: 'Signup succeeded',
                        html: `<h1>You succeessfully signed up!</h1>`
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
}

exports.postLogout = (req, res) => {
    req.session.destroy(err => {
        console.log('Error : ', err);
        res.redirect('/');
    });
};

exports.getReset = (req, res) => {
    let message = req.flash('error');
    if (message.length > 0) message = message[0];
    else message = null;

    res.render('auth/reset', { path: '/reset', pageTitle: 'Reset Password', errorMessage: message });
};

exports.postReset = (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that E-mail found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@node-complete.com',
                    subject: 'Password Reset',
                    html: `
                        <p>You requested password reset.</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                });
            })
            .catch(err => console.log(err));
    });
};

exports.getNewPassword = (req, res) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) message = message[0];
            else message = null;

            res.render('auth/new-password', { path: '/new-password', pageTitle: 'New Password', errorMessage: message, userId: user._id.toString(), passwordToken: token });
        })
        .catch(err => console.log(err));
};

exports.postNewPassword = (req, res) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => console.log(err));
};