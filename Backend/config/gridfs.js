const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket;

const initGridfs = () => {
    const db = mongoose.connection.db;

    bucket = new GridFSBucket(db, {
        bucketName: 'resumes'
    });
};

const getBucket = () => bucket;

module.exports = { initGridfs, getBucket };