const cli = require('gell-job/new/cli');

const { S3Client } = require('@aws-sdk/client-s3');

const defs = {
    s3: deps => new S3Client()
}

cli(defs);
