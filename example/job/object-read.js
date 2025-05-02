const assert = require('assert');

const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

exports.__metadata = {
    name: 'example.object-read',
    description: 'outputs the contents of the first object in a bucket',
    dependencies: {
        logger: 'the job logger'
    }
}

exports.dependencies = {
}

/**
 * Reads content via stream event callbacks
 * 
 * @param {*} stream 
 * @returns 
 */
function readObjectContents_events(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', z => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}
  
/**
 * Reads content as chunks of stream with for loop
 * 
 * @param {*} body 
 * @returns 
 */
async function readObjectContents_chunks(body) {
    const chunks = [];
    for await (const chunk of body) chunks.push(chunk);
    
    return Buffer.concat(chunks).toString('utf-8');
}

async function getExport(bucket, deps) {
    const { s3 } = deps.resolve('s3');

    const commandParams = {
        Bucket: bucket
    }
    const res = await s3.send(new ListObjectsV2Command(commandParams));

    return res.Contents[0];
}

async function processExport(bucket, key, deps) {
    const { s3, logger } = deps.resolve('s3', 'logger');

    const params = {
        Bucket: bucket,
        Key: key
    }

    const obj = await s3.send(new GetObjectCommand(params));

    const content = await readObjectContents_chunks(obj.Body);
    // const content = await readObjectContents_events(obj.Body);

    logger.info(content);
}

/**
 * NOTE: this is meant to demonstrate simple interaction with S3 via AWS S3 client
 *  - defined as a gell-job job module
 *  - can be invoked via cli
 *  - bucket name must be passed into params
 *      - gell-job does not yet support this via CLI
 */
exports.run = async function(params={}, { logger }, deps) {
    const { bucket } = params;

    assert(bucket, 'bucket name is required');

    const obj = await getExport(bucket, deps);

    await processExport(bucket, obj.Key, deps);
}
