const util = require("util");
const multer = require("multer");
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(__basedir);
    cb(null, __basedir + "/api/users/uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, file.originalname);
  },
});
let uploadFile = multer({storage: storage}).single("file");
let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;