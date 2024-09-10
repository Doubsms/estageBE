const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload.single('file'); // Assuming the file is sent with a 'file' field