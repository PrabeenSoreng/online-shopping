const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res) => {
    const page = Number(req.query.page) || 1;
    let totalItems;

    Product.find().countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getProducts = (req, res) => {
    const page = Number(req.query.page) || 1;
    let totalItems;

    Product.find().countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', { pageTitle: product.title, path: '', product: product });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', { pageTitle: 'Your Cart', path: '/cart', products: products });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
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
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCartDeleteProduct = (req, res) => {
    const prodId = req.body.productId;
    req.user
        .removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
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
                    email: req.user.email,
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
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', { pageTitle: 'Your Orders', path: '/orders', orders: orders });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if (!order) return next(new Error('No order found.'));
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            //Generating pdf on the go...
            const pdfDoc = new PDFDocument();
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${invoiceName}`);
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });
            pdfDoc.fontSize(14).text('--------------------------------------------------------------------');
            let totPrice = 0;
            order.products.forEach(prod => {
                totPrice += prod.quantity * prod.product.price;
                pdfDoc.fontSize(14).text(prod.product.title + ': -    ' + prod.quantity + ' x  $' + prod.product.price);
            });
            pdfDoc.text('-----------------');
            pdfDoc.fontSize(20).text('Total Price: $' + totPrice);

            pdfDoc.end();

            // readFile is used for small files, because it preloades the whole data into the memory before serving it to the client... It could lead to overflow of memory in the server if lots of requests are comming. 
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) return next(err);
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader('Content-Disposition', `attachment; filename=${invoiceName}`);
            //     res.send(data);
            // });

            //createReadStream is used to serve big size files to clients because it acts as a stream or buffer, and small chunk of data is only stored in the memory at a given time.
            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', `attachment; filename=${invoiceName}`);
            // file.pipe(res);
        })
        .catch(err => next(err));
};

exports.getCheckout = (req, res) => {
    res.render('shop/checkout', { pageTitle: 'Checkout', path: '/checkout' })
};