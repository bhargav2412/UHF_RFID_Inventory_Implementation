import * as AWS from 'aws-sdk';
import * as fs from 'fs';

export class S3Util {
    s3: AWS.S3;
    constructor() {

        var credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        };
        AWS.config.update({ credentials: credentials, region: process.env.AWS_REGION });

        this.s3 = new AWS.S3();
    }

    async createPresignedPost(key: string, fileType: string) {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Fields: {
                key, // Path in the bucket
                'Content-Type': fileType,
            },
            Conditions: [
                ['starts-with', '$Content-Type', fileType],
                ['content-length-range', 0, 10485760], // Limit to 10MB
            ],
            Expires: 300,
            ACL: 'public-read',
        };
        return this.s3.createPresignedPost(params)
    }

    async createPresignedUrl(key: string, fileType: string) {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key, // Path in the bucket
            ContentType: fileType,
            Expires: 300
        };
        return this.s3.getSignedUrlPromise('putObject', params);
    }

    async getObject(key: string) {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };
        return this.s3.getObject(params).promise();
    }

    async uploadFile(file: fs.ReadStream, key: string) {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file,
            ACL: 'public-read'
        };
        return this.s3.upload(params).promise();
    }

    async deleteObject(key: string) {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };
        return this.s3.deleteObject(params).promise();
    }
}
