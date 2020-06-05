import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

export default {
    storage: multer.diskStorage({
        destination: path.resolve(__dirname, '..', '..', 'uploads', 'points'),
        filename(request, file, callback) {
            const hash = crypto.randomBytes(7).toString('hex');
            const splitName = file.originalname.split('.');
            const extension = splitName[splitName.length - 1];

            const fileName = `${hash}-${Date.now()}.${extension}`;

            callback(null,fileName);
        }
    }),
}

