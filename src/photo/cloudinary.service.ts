import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadBuffer(
    buffer:    Buffer,
    folder:    string = 'greenbox/plants',
    publicId?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id:      publicId,
          resource_type:  'image',
          transformation: [
            { width: 1080, height: 1080, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Error subiendo imagen a Cloudinary: ${error.message}`);
            return reject(error);
          }
          this.logger.log(`Imagen subida: ${result!.secure_url}`);
          resolve(result!.secure_url);
        },
      );
      uploadStream.end(buffer);
    });
  }

  async deleteByUrl(imageUrl: string): Promise<void> {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder   = urlParts[urlParts.length - 2];
      const publicId = `${folder}/${fileName.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Imagen eliminada de Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.warn(`No se pudo eliminar imagen de Cloudinary: ${error.message}`);
    }
  }
}