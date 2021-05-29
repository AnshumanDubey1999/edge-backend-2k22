/* eslint-disable no-process-exit */
const mongoose = require('mongoose');
mongoose.Promise = Promise;

exports.connect = function () {
    // console.log(process.env.MONGO_DB_URI)
    mongoose.connect(
        process.env.MONGO_DB_URI,
        {
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        },
        () => {
            console.log('Database Connected');
        }
    );
    if (!process.env.cron) mongoose.set('debug', true);
    mongoose.connection.on('error', () => {
        console.log(
            'MongoDB connection error. Please make sure that MongoDB is running.'
        );
        // console.log(e);
        process.exit(1);
    });
};
