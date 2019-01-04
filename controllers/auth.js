exports.getLogin = (req, res) => {
    //const isLoggedIn = req.get('Cookie').trim().split('=')[1];
    console.log(req.session.isLoggedIn);
    res.render('auth/login', { path: '/login', pageTitle: 'Login', isAuthenticated: false });
};

exports.postLogin = (req, res) => {
    req.session.isLoggedIn = true;
    res.redirect('/');
};