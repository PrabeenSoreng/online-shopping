exports.get404 = (req, res) => {
    res.status(404).render('not-found', { pageTitle: 'Not Found', path: '', isAuthenticated: req.session.isLoggedIn });
};

exports.get500 = (req, res) => {
    res.status(500).render('500', { pageTitle: 'Error', path: '', isAuthenticated: req.session.isLoggedIn });
};