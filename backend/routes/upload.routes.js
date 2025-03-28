import express from "express";
import multer from "multer";
import path from "path";
import { ApiResponse } from "../utils/ApiResponse.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const extname = path.extname(file.originalname);
    cb(null, `${file.originalname}-${Date.now()}${extname}`);
  },
});
const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Images only"), false);
  }
};

const upload = multer({ storage, fileFilter });
const uploadSingleImage = upload.single("image");

const router = express.Router();
router.route("/").post((req, res) => {
    uploadSingleImage(req, res, (err) => {
        if (err) {
          res.status(400).send({ message: err.message });
        } else if (req.file) {
          res.json(new ApiResponse(200,{
            image: `/${req.file.path}`,
          },"Image uploaded successfully"));
        } else {
          res.status(400).send({ message: "No image file provided" });
        }
      });
});
export default router;
