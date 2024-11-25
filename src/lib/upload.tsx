import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Types
type CloudFrontMapping = {
  [key: string]: string;
};

type CacheData<T> = {
  key: string;
  data: T;
  expiry: Date;
};

// Constants
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_DEFAULT_S3_BUCKET || 'pinelime-orders';

// Initialize S3 client
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const cloudFrontURLs: CloudFrontMapping = {
  "user-images-polaroid": "d1wxxs914x4wga.cloudfront.net",
  "pinelime-orders": "d1tsukz865bhnw.cloudfront.net",
};

const s3URLs: CloudFrontMapping = Object.entries(cloudFrontURLs)
  .reduce((acc, [bucket, domain]) => ({
    ...acc,
    [domain]: bucket
  }), {});

export async function uploadToS3(
  data: Buffer,
  fileType: string,
  filename: string = uuidv4(),
  destinationPath: string = "",
  bucket: string = DEFAULT_BUCKET
): Promise<{ objectURL: string; cloudFront: string; } | Error> {
  console.log('uploading to s3', bucket)
  const fileSaveName = destinationPath ? `${destinationPath}/${filename}` : filename;

  const params = {
    Bucket: bucket,
    Key: fileSaveName,
    Body: data,
    ContentType: fileType,
    ACL: 'public-read'
  };

  if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
    console.error('Missing required AWS credentials in environment variables');
    return new Error('AWS credentials not configured');
  }
  try {
    await s3.send(new PutObjectCommand({ ...params, ACL: 'public-read' }));
    return {
      objectURL: `https://${bucket}.s3.${REGION}.amazonaws.com/${fileSaveName}`,
      cloudFront: `https://${cloudFrontURLs[bucket]}/${fileSaveName}`
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

export async function getCloudfrontObject<T>(
  bucketOrUrl: string,
  path?: string
): Promise<T> {
  let bucket: string;
  let objectPath: string;

  if (!path) {
    // Handle full CloudFront URL
    const url = new URL(bucketOrUrl);
    const domain = url.hostname;
    bucket = s3URLs[domain];
    objectPath = url.pathname.slice(1); // Remove leading slash
  } else {
    bucket = bucketOrUrl;
    objectPath = path;
  }

  if (!bucket) {
    throw new Error('Invalid bucket or CloudFront URL');
  }

  const params = {
    Bucket: bucket,
    Key: objectPath,
  };

  try {
    await s3.send(new HeadObjectCommand(params));
    const response = await fetch(
      `https://${cloudFrontURLs[bucket]}/${objectPath}`
    );
    return response.json();
  } catch (error) {
    console.error('CloudFront fetch error:', error);
    throw error;
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  expiryDays: number = 7
): Promise<{ objectURL: string; cloudFront: string; } | Error> {
  const bucket = DEFAULT_BUCKET;
  const path = 'cache';
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);

  const cacheData: CacheData<T> = {
    key,
    data,
    expiry
  };

  const jsonString = JSON.stringify(cacheData);
  const buffer = Buffer.from(jsonString, 'utf-8');
  
  const result = await uploadToS3(
    buffer,
    'application/json',
    `${key}.json`,
    path,
    bucket
  );
  return result;
}

export async function getCache<T>(key: string): Promise<T> {
  const bucket = DEFAULT_BUCKET;
  const path = `cache/${key}.json`;
  
  const cacheData = await getCloudfrontObject<CacheData<T>>(bucket, path);
  
  if (new Date(cacheData.expiry) < new Date()) {
    throw new Error('Cache expired');
  }
  
  return cacheData.data;
}