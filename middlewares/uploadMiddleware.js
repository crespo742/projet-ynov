const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3');  // Ton fichier de config actuel avec AWS SDK v2

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'my-moto-ads-images',  // Remplace par le nom de ton bucket
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `moto-ads/${Date.now().toString()}_${file.originalname}`);
    },
  }),
});

module.exports = upload;
