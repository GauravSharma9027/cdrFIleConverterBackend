import express from "express";
import { upload, convertFile } from "../controllers/convertController.js";

const router = express.Router();

router.post("/convert", upload.single("file"), convertFile);

export default router;
