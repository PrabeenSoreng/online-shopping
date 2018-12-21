const Product = require('../models/product');
const Order = require('../models/order');

exports.getIndex = (req, res) => {
    Product.find()
        .then(products => {
            res.render('shop/index', { prods: products, pageTitle: 'Shop', path: '/' });
        })
        .catch(err => console.log(err));
}

exports.getProducts = (req, res) => {
    Product.find()
        .then(products => {
            res.render('shop/product-list', { prods: products, pageTitle: 'All Products', path: '/products' });
        })
        .catch(err => console.log(err));
};

exports.getProduct = (req, res) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', { pageTitle: product.title, path: '', product: product });
        })
        .catch(err => console.log(err));
};

exports.getCart = (req, res) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', { pageTitle: 'Your Cart', path: '/cart', products: products });
        })
        .catch(err => console.log(err));
};

exports.postCart = (req, res) => {
    const prodId = req.body.productId;

    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res) => {
    const prodId = req.body.productId;
    req.user
        .removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

exports.postOrder = (req, res) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(item => {
                return {
                    product: {...item.productId._doc },
                    quantity: item.quantity
                }
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res) => {
    req.user
        .getOrders()
        .then(orders => {
            res.render('shop/orders', { pageTitle: 'Your Orders', path: '/orders', orders: orders });
        })
        .catch(err => console.log(err));
};

exports.getCheckout = (req, res) => {
    res.render('shop/checkout', { pageTitle: 'Checkout', path: '/checkout' })
};