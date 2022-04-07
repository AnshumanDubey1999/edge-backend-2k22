const UserSchema = require('../models/user');
const InvoiceSchema = require('../models/invoice');
const EventSchema = require('../models/event');
const generateAccessToken = require('../middlewares/auth').generateAccessToken;
const fastCsv = require('fast-csv');
const TokenSchema = require('../models/token');
const mail = require('../middlewares/mail');

exports.login = async (req, res) => {
    try {
        // console.log(req.user);
        let isRegistered = true;
        let user = await UserSchema.findByEmail(req.user.email).lean();
        if (!user) {
            user = {
                name: req.user.name,
                avatar: req.user.avatar,
                contact: req.user.phone,
                email: req.user.email,
                _id: null
            };
            isRegistered = false;
        }
        const isAdmin =
            req.user &&
            req.user.permissions &&
            req.user.permissions.includes('register');
        // user.isAdmin = tru
        if (isRegistered && isAdmin != user.isAdmin) {
            user = await UserSchema.findOneAndUpdate(
                { email: req.user.email },
                { isAdmin: isAdmin },
                { upsert: true, new: true }
            ).lean();
        }

        // console.log('user', user);
        const tokenData = {
            name: user.name,
            email: user.email,
            isAdmin: isAdmin,
            contact: user.contact,
            _id: user._id
        };
        if (!isRegistered) tokenData.avatar = req.user.avatar;
        const token = generateAccessToken(
            tokenData,
            isRegistered ? '1d' : '1hr'
        );
        res.status(200).json({
            success: true,
            isRegistered: isRegistered,
            user: user,
            token: token
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.register = async (req, res) => {
    try {
        const user = {
            name: req.user.name,
            contact: req.user.contact,
            email: req.user.email,
            avatar: req.user.avatar,
            stream: req.body.stream,
            year: req.body.year,
            instituteName: req.body.instituteName,
            isAdmin: req.user.isAdmin,
            registeredEvents: []
        };
        const newUser = await UserSchema.create(user);
        const token = generateAccessToken(
            {
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                _id: newUser._id
            },
            '1d'
        );
        res.status(200).json({
            success: true,
            isRegistered: true,
            user: user,
            token: token
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.myProfile = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id);
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user._id);
        user.stream = req.body.stream;
        user.instituteName = req.body.instituteName;
        user.year = req.body.year;
        await user.save();
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

//ADMIN ONLY
exports.addUser = async (req, res) => {
    try {
        const user = await UserSchema.findByEmail(req.body.email);
        if (!user) {
            throw new Error('User not registered!');
        }
        if (user.intra22InvoiceId) {
            const invoice = await InvoiceSchema.findById(user.intra22InvoiceId);
            // console.log({e:req.body.events})
            for (let i = 0; i < req.body.events.length; i++) {
                const event = req.body.events[i];
                if (!invoice.events.includes(event)) {
                    invoice.events.push(event);
                }
            }
            user.registeredEvents = invoice.events;
            // console.log({
            //     user: user.registeredEvents,
            //     inv: invoice.events
            // })
            await user.save();
            await invoice.save();
            return res.status(200).json({
                amount: 0,
                invoice
            });
        }
        const invoice = await InvoiceSchema.create({
            user: user._id,
            amount: Number(process.env.INTRA_AMOUNT) || 300,
            type: 'INTRA',
            events: req.body.events,
            payment_method: 'offline',
            collector: req.user._id
        });
        user.registeredEvents = invoice.events;
        user.intra22InvoiceId = invoice._id;
        await mail.sendPaymentConfirmationMail(user, invoice, {
            amount: invoice.amount,
            method: 'cash'
        });
        await user.save();
        res.status(200).json({
            amount: invoice.amount,
            invoice
        });
    } catch (error) {
        // console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.viewUser = async (req, res) => {
    try {
        let query = {};
        if (req.query.id) {
            query = {
                _id: req.query.id
            };
        } else if (req.query.email) {
            query = {
                email: req.query.email
            };
        } else if (req.query.contact) {
            query = {
                contact: req.query.contact
            };
        } else {
            return res.status(200).json({
                success: false,
                error: 'Need id, email or contact to find user.'
            });
        }

        const user = await UserSchema.findOne(query).lean();
        if (user) {
            user.registeredEvents = await EventSchema.getEventTitles(
                user.registeredEvents
            );
        }
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.allUsers = async (req, res) => {
    try {
        const limit = 20;
        const skip = (Number(req.query.page) - 1) * 20;
        let query = {
            $and: []
        };
        if (req.query.eventCode) {
            query['$and'].push({
                $expr: {
                    $in: [req.query.eventCode, '$registeredEvents']
                }
            });
        }
        if (req.query.stream) {
            query['$and'].push({
                stream: req.query.stream
            });
        }
        if (req.query.year) {
            query['$and'].push({
                year: req.query.year
            });
        }
        if (req.query.instituteName) {
            query['$and'].push({
                instituteName: req.query.instituteName
            });
        }
        if (req.query.name) {
            query['$and'].push({
                $text: {
                    $search: req.query.name
                }
            });
        }
        if (query.$and.length == 0) query = {};
        let documentCount = await UserSchema.aggregate([
            { $match: query },
            { $group: { _id: null, n: { $sum: 1 } } }
        ]);
        documentCount = documentCount[0] ? documentCount[0].n : 0;
        const users = await UserSchema.aggregate([
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'events',
                    let: { registeredEvents: '$registeredEvents' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$eventCode', '$$registeredEvents']
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                eventCode: 1
                            }
                        }
                    ],
                    as: 'registeredEvents'
                }
            }
        ]);
        res.status(200).json({
            success: true,
            totalDocuments: documentCount,
            range: `${skip}-${Math.min(
                documentCount,
                skip + 20
            )}/${documentCount}`,
            users: users
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await UserSchema.findByIdAndDelete(req.body.user_id);
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.toCSV = (req, res) => {
    const query = {};
    const queryText = ['ALL', 'ALL', 'ALL', 'ALL', 'ALL'];
    if (req.query.name) {
        query['$text'] = {
            $search: req.query.name
        };
        queryText[0] = req.query.name;
    }
    if (req.query.eventCode) {
        query['registeredEvents'] = { $in: [req.query.eventCode] };
        queryText[1] = req.query.eventCode;
    }
    if (req.query.stream) {
        query['stream'] = req.query.stream;
        queryText[2] = req.query.stream;
    }
    if (req.query.year) {
        query['year'] = req.query.year;
        queryText[3] = req.query.year;
    }
    if (req.query.instituteName) {
        query['instituteName'] = req.query.instituteName;
        queryText[4] = req.query.instituteName;
    }
    const cursor = UserSchema.find(query);

    const transformer = (doc) => {
        return {
            Id: doc._id,
            Name: doc.name,
            Email: doc.email,
            Contact: doc.contact,
            Stream: doc.stream,
            Year: doc.year,
            College: doc.instituteName,
            Events: doc.registeredEvents.join(','),
            Invoice: doc.intra22InvoiceId
        };
    };

    const filename = 'users(' + queryText.join('|') + ').csv';

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.writeHead(200, { 'Content-Type': 'text/csv' });

    res.flushHeaders();

    var csvStream = fastCsv.format({ headers: true }).transform(transformer);
    cursor.stream().pipe(csvStream).pipe(res);
};

exports.saveAdminToken = async (req, res) => {
    try {
        const token = await TokenSchema.create({
            token:
                req.headers['Authorization'] ||
                req.headers['authorization'] ||
                req.cookies.token
        });
        res.status(200).json({
            success: true,
            id: token._id,
            url: `${process.env.ADMIN_URL}/?id=${token._id}`
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};

exports.fetchAdminToken = async (req, res) => {
    try {
        let tokenID =
            req.headers['Authorization'] ||
            req.headers['authorization'] ||
            req.cookies.token;
        if (tokenID.match(/Bearer/i)) tokenID = tokenID.split(' ')[1];
        const token = await TokenSchema.findByIdAndDelete(tokenID).lean();
        res.status(200).json({
            success: true,
            token: token.token
        });
    } catch (error) {
        // console.log(error);
        res.json({
            success: false,
            err: String(error)
        });
    }
};
