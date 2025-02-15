var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const { ValidationError } = require('express-validation');

var app = express();
app.use(cors());

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var invoicesRouter = require('./routes/invoices');
var eventsRouter = require('./routes/events');
var categoryRouter = require('./routes/categories');
var razorPayRouter = require('./routes/razorpay');
var sponsorRouter = require('./routes/sponsor');
var adminRouter = require('./routes/admin');
var payuRouter = require('./routes/payu');
var instamojoRouter = require('./routes/instamojo');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/invoices', invoicesRouter);
app.use('/events', eventsRouter);
app.use('/categories', categoryRouter);
app.use('/confirmPayments', razorPayRouter);
app.use('/sponsors', sponsorRouter);
app.use('/admin', adminRouter);
app.use('/payu', payuRouter);
app.use('/instamojo', instamojoRouter);
// app.use('/payu', (req, res) => {
//     console.log({
//         body: req.body,
//         q: req.query,
//         p: req.params,
//         h: req.headers
//     });
//     res.status(200).json({});
// });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, _next) {
    // set locals, only providing error in development
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json(err);
    }
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
