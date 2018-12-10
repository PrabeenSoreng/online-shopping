const Product = require('../models/product');

exports.getIndex = (req, res) => {
    Product.fetchAll(products => {
        res.render('shop/index', { prods: products, pageTitle: 'Shop', path: '/' });
    });
}

exports.getProducts = (req, res) => {
    Product.fetchAll(products => {
        res.render('shop/product-list', { prods: products, pageTitle: 'All Products', path: '/products' });
    });
};

exports.getCart = (req, res) => {
    res.render('shop/cart', { pageTitle: 'Your Cart', path: '/cart' });
};

exports.getOrders = (req, res) => {
    res.render('shop/orders', { pageTitle: 'Your Orders', path: '/orders' });
}

exports.getCheckout = (req, res) => {
    res.render('shop/checkout', { pageTitle: 'Checkout', path: '/checkout' })
};