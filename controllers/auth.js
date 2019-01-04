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

exports.postLogout = (req, res) => {
    req.session.destroy(err => {
        console.log('Error : ', err);
        res.redirect('/');
    });
};