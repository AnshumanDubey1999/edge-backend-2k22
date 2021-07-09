var express = require('express');
var router = express.Router();

//MIDDLEWARES
const Authenticate = require('../middlewares/auth');

//SCHEMAS
const UserSchema = require('../models/user');
const InvoiceSchema = require('../models/invoice');
const RefundSchema = require('../models/refund');
const EventSchema = require('../models/event');

router.get(
    '/dashboard',
    Authenticate.isLoggedIn,
    Authenticate.isAdmin,
    async (req, res) => {
        try {
            const today = new Date();
            const dayLimit = new Date(today - 60 * 24 * 3600 * 1000);
            const userCount = await UserSchema.estimatedDocumentCount();
            let totalPayments = await InvoiceSchema.aggregate([
                { $group: { _id: null, n: { $sum: '$amount' } } }
            ]);
            totalPayments = totalPayments[0].n;
            let totalRefunds = await RefundSchema.aggregate([
                { $group: { _id: null, n: { $sum: '$amount' } } }
            ]);
            totalRefunds = totalRefunds[0].n / 100;
            const usersPerDay = await UserSchema.aggregate([
                { $match: { createdAt: { $gte: dayLimit } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ]);
            const usersByStream = await UserSchema.aggregate([
                {
                    $group: {
                        _id: '$stream',
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);
            const usersByYear = await UserSchema.aggregate([
                {
                    $group: {
                        _id: '$year',
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);
            const earningPerDay = await InvoiceSchema.aggregate([
                { $match: { createdAt: { $gte: dayLimit } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        amount: {
                            $sum: '$amount'
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ]);
            const topUsers = await UserSchema.aggregate([
                {
                    $lookup: {
                        from: 'invoices',
                        localField: '_id',
                        foreignField: 'user',
                        as: 'invoices'
                    }
                },
                {
                    $project: {
                        amount: {
                            $sum: '$invoices.amount'
                        },
                        name: 1,
                        email: 1,
                        stream: 1,
                        year: 1,
                        instituteName: 1,
                        contact: 1,
                        isAdmin: 1,
                        registeredEvents: 1,
                        avatar: 1,
                        createdAt: 1
                    }
                },
                {
                    $sort: {
                        amount: -1
                    }
                },
                { $limit: 10 }
            ]);
            const eventsBought = await EventSchema.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        let: { eventCode: '$eventCode' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: [
                                            '$$eventCode',
                                            '$registeredEvents'
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1
                                }
                            }
                            // {
                            //     $addField: {
                            //         count: 1
                            //     }
                            // }
                        ],
                        as: 'users'
                    }
                },
                {
                    $project: {
                        total: {
                            $size: '$users'
                        },
                        title: 1,
                        eventCode: 1,
                        club: 1
                    }
                },
                {
                    $sort: {
                        club: 1
                    }
                }
            ]);
            res.json({
                success: true,
                userCount,
                usersPerDay,
                usersByStream,
                usersByYear,
                topUsers,
                totalPayments,
                earningPerDay,
                totalRefunds,
                eventsBought
            });
        } catch (error) {
            res.json({
                success: false,
                error: error
            });
        }
    }
);

module.exports = router;
