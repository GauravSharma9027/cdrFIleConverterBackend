import axios from "axios";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data";

console.log("convertController loaded");
// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
export const upload = multer({ storage });

// Supported output formats
const SUPPORTED_OUTPUTS = ["pdf", "svg", "png", "tiff", "jpg", "jpeg", "ps", "eps"];

export const convertFile = async (req, res) => {
    const filePath = req.file.path;
    const requestedFormat = (req.body.output_format || "pdf").toLowerCase();
   
    if (!SUPPORTED_OUTPUTS.includes(requestedFormat)) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: `Output format ${requestedFormat} not supported.` });
    }

    try {
        console.log(`🔥 [Step 1] Creating Job for format: ${requestedFormat}`);
        // Decide conversion steps dynamically
        let tasks;
        if (["pdf", "svg", "png"].includes(requestedFormat)) {
            // Direct conversion using Inkscape
            tasks = {
                "upload-cdr": { operation: "import/upload" },
                "convert-to-target": {
                    operation: "convert",
                    input: "upload-cdr",
                    input_format: "cdr",
                    output_format: requestedFormat,
                    engine: "inkscape",
                    filename: `converted.${requestedFormat}`
                },
                "export-file": { operation: "export/url", input: "convert-to-target" }
            };
        } 
        
        else if (requestedFormat === "eps") {
            // Fallback chain: CDR → PDF (Inkscape) → EPS (Ghostscript)
            tasks = {
                "upload-cdr": { operation: "import/upload" },
                "convert-to-pdf": {
                    operation: "convert",
                    input: "upload-cdr",
                    input_format: "cdr",
                    output_format: "pdf",
                    engine: "inkscape",
                    filename: "intermediate.pdf"
                },
                "convert-to-eps": {
                    operation: "convert",
                    input: "convert-to-pdf",
                    input_format: "pdf",
                    output_format: "eps",
                    engine: "ghostscript", // fallback engine
                    filename: "converted.eps"
                },
                "export-file": { operation: "export/url", input: "convert-to-eps" }
            };
        }

        else {
            // Two-step conversion: CDR → PDF → TIFF/JPG/PS
            tasks = {
                "upload-cdr": { operation: "import/upload" },
                "convert-to-pdf": {
                    operation: "convert",
                    input: "upload-cdr",
                    input_format: "cdr",
                    output_format: "pdf",
                    engine: "inkscape",
                    filename: "intermediate.pdf"
                },
                "convert-to-target": {
                    operation: "convert",
                    input: "convert-to-pdf",
                    input_format: "pdf",
                    output_format: requestedFormat,
                    engine: "imagemagick",
                    filename: `converted.${requestedFormat}`
                },
                "export-file": { operation: "export/url", input: "convert-to-target" }
            };
        }

        // console.log("🌍 CLOUDCONVERT_API_KEY:", CLOUDCONVERT_API_KEY);

        // Step 1: Create Job
        const jobResponse = await axios.post(
            "https://api.cloudconvert.com/v2/jobs",
            { tasks },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`
                }
            }
        );

        const job = jobResponse.data.data;
        console.log("✅ Job created:", job.id);

        // Step 2: Upload File
        const uploadTask = job.tasks.find(t => t.name === "upload-cdr");
        if (!uploadTask?.result?.form) throw new Error("Upload task form missing");

        console.log("🔥 [Step 2] Uploading file...");
        const form = new FormData();
        Object.entries(uploadTask.result.form.parameters).forEach(([k, v]) => form.append(k, v));
        form.append("file", fs.createReadStream(filePath));

        await axios.post(uploadTask.result.form.url, form, { headers: form.getHeaders() });
        fs.unlinkSync(filePath); // delete local file
        console.log("✅ File uploaded!");

        // Step 3: Poll for export task result
        const exportTask = job.tasks.find(t => t.name === "export-file");
        console.log("🔥 [Step 3] Polling for result...");

        let fileUrl = null;
        for (let i = 0; i < 15; i++) {
            const taskRes = await axios.get(
                `https://api.cloudconvert.com/v2/tasks/${exportTask.id}`,
                {
                    headers: { Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}` }
                }
            );

            const task = taskRes.data.data;
            if (task.status === "finished" && task.result?.files?.length > 0) {
                fileUrl = task.result.files[0].url;
                console.log("✅ File ready:", fileUrl);
                break;
            }

            console.log(`⏳ Waiting... [${i + 1}] status: ${task.status}`);
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!fileUrl) throw new Error("Conversion timeout");
        return res.status(200).json({ success: true, downloadUrl: fileUrl });

    } catch (err) {
        console.error("❌ Conversion failed:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || err.message });
    }
};
