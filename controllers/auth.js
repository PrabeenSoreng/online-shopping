const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.getLogin = (req, res) => {
    res.render('auth/login', { path: '/login', pageTitle: 'Login', isAuthenticated: false });
};

exports.postLogin = (req, res) => {
    User.findById('5c1be8fe12e84805b0aee3ef')
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save(err => {
                console.log('Error : ', err);
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
};

exports.getSignup = (req, res) => {
    res.render('auth/signup', { path: '/signup', pageTitle: 'Signup', isAuthenticated: false });
}

exports.postSignup = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const cpassword = req.body.confirmPassword;
    User.findOne({ email: email })
        .then(userdoc => {
            if (userdoc) return res.redirect('/signup');
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