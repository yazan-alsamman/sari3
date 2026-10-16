import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MediaPurpose } from '@prisma/client';

const PURPOSE_PREFIX: Record<MediaPurpose, string> = {
  driver_id: 'kyc',
  shop_landmark: 'orders',
  delivery_proof: 'proofs',
};

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(ObjectStorageService.name);
  private client: S3Client | null = null;
  private live = false;
  readonly bucket: string;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT')?.trim() ?? '';
    this.bucket = config.get<string>('S3_BUCKET')?.trim() || 'sareee-media';
    this.configured = endpoint.length > 0;
    if (this.configured) {
      this.client = new S3Client({
        region: config.get<string>('S3_REGION')?.trim() || 'us-east-1',
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.get<string>('S3_ACCESS_KEY')?.trim() || 'sareee',
          secretAccessKey:
            config.get<string>('S3_SECRET_KEY')?.trim() || 'sareee-minio-secret',
        },
      });
    }
  }

  isEnabled(): boolean {
    return this.live;
  }

  keyFor(purpose: MediaPurpose, id: string): string {
    return `${PURPOSE_PREFIX[purpose]}/${id}`;
  }

  async onModuleInit() {
    if (!this.client) {
      this.logger.warn('S3_ENDPOINT empty — media uses local disk adapter');
      return;
    }
    try {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      } catch {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created bucket ${this.bucket}`);
      }
      const origins = (this.config.get<string>('CORS_ORIGINS') ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (origins.length > 0) {
        await this.client.send(
          new PutBucketCorsCommand({
            Bucket: this.bucket,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedOrigins: origins,
                  AllowedMethods: ['GET', 'PUT', 'HEAD'],
                  AllowedHeaders: ['*'],
                  ExposeHeaders: ['ETag'],
                  MaxAgeSeconds: 3000,
                },
              ],
            },
          }),
        );
      }
      this.live = true;
      this.logger.log(`MinIO/S3 ready bucket=${this.bucket}`);
    } catch (err) {
      this.live = false;
      this.logger.error(
        `MinIO/S3 unavailable — falling back to local disk (${err instanceof Error ? err.message : 'error'})`,
      );
    }
  }

  async presignPut(key: string, mime: string): Promise<string> {
    if (!this.client) throw new Error('S3 disabled');
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mime,
      }),
      { expiresIn: 15 * 60 },
    );
  }

  async put(key: string, body: Buffer, mime: string): Promise<void> {
    if (!this.client) throw new Error('S3 disabled');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mime,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    if (!this.live || !this.client) return false;
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /** Short-lived signed GET. Null while the local disk adapter is active. */
  async presignGet(key: string, expiresInSec: number): Promise<string | null> {
    if (!this.live || !this.client) return null;
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSec },
    );
  }

  async delete(key: string): Promise<void> {
    if (!this.live || !this.client) return;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
