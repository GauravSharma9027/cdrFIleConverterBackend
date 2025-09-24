// import axios from "axios";
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import FormData from "form-data";

// console.log("convertController loaded");

// // Multer setup
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, "uploads/"),
//     filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// export const upload = multer({ storage });

// // Main Route: One call does everything
// export const convertFile = async (req, res) => {
//     const filePath = req.file.path;
//     const output_format = req.body.output_format || "pdf";

//     try {
//         console.log("🔥 [Step 1] Creating Job for format:", output_format);

//         // Step 1: Create Job
//         const payload = {
//             tasks: {
//                 "upload-crd": { operation: "import/upload" },
//                 "convert-to-target": {
//                     operation: "convert",
//                     input: "upload-crd",
//                     input_format: "cdr",
//                     output_format,
//                     engine: "inkscape",
//                     filename: `converted.${output_format}`
//                 },
//                 "export-file": { operation: "export/url", input: "convert-to-target" }
//             }
//         };

//         const jobResponse = await axios.post(
//             "https://api.cloudconvert.com/v2/jobs",
//             payload,
//             { headers: { Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2Q5NDJhYzgwYWUxNjkzNTc1YzI5ZTA0MDhhYWQ3YWNkMjJmMDk1NGE1YTk5Mzc2MTcyMzYyODNlZjVkMzE5OTM1ODE1OTQ3YzQ4YmIyNGQiLCJpYXQiOjE3NTg2MzQyMDAuNzE0MzksIm5iZiI6MTc1ODYzNDIwMC43MTQzOTIsImV4cCI6NDkxNDMwNzgwMC43MDk1MjgsInN1YiI6IjcyOTkxNjI5Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInRhc2sucmVhZCIsInVzZXIud3JpdGUiLCJ0YXNrLndyaXRlIiwid2ViaG9vay53cml0ZSIsInByZXNldC5yZWFkIiwicHJlc2V0LndyaXRlIiwid2ViaG9vay5yZWFkIl19.JrftRewwzt__fn6JUC5ts_6PU9_d4AW58PVmUgfNiWaIJxRxlKyUEOeEV24V9WBkTGWRcM6Wow6B-ZizmCJSq3Opn5XND7-cXx0UJkRRINoAHC0Pq0n-uBu3EXthbpVces0d_e1VUHXtOxqIg1kCgAfH9mZtJsyIVnsZo-PydX0Ud4462Fkl7dviK58TVIJ6fugl0auubyqSfLbsCvFK08lfiogysUbOoP3RSVnnwg216iFjX-1Ymntv95A_sjWphFoNnr-huKfNQf7nvEy2phKs37Zzf6GBUrJRMtqVJcDIuRD_P7IWG3ChzItCJwhzf3ULihhMYES-eaWrJTc3YHzdw1ra-pu8jSoJJ7RnkE2ePkMr2VqVkKuMylTTUItNDsvpmxLcDi-kT1Gw9ryJsWteY87BbY9ztz2DtsFIbQ1ZB2el0BtrdpAnD-9k0qTX19trQQS62ES7-DNhsJCoCr3ANy9aONwP6okyPi9nB49ch8j450ug0-8-7aahd3A-6X6ukgWUT4-pxzW4vyiBRYmFkjBVmlh-ynZ5kaIh5ra-peARpxmKU4BHMU934Y7RpASV1KxwVpHLLsCkRvpyvtN7nGXrDg0Skte4rcZYFFfVkEYIIk97bRptu--B42hJSzYvmAyWNYtLHxOn34yITSoRAEdUZjeVvalhA3q1fns` } }
//         );

//         const job = jobResponse.data.data;
//         console.log("✅ Job created:", job.id);

//         // Step 2: Upload File
//         const uploadTask = job.tasks.find(t => t.name === "upload-crd");
//         if (!uploadTask?.result?.form) throw new Error("Upload task form missing");

//         console.log("🔥 [Step 2] Uploading file...");
//         const form = new FormData();
//         Object.entries(uploadTask.result.form.parameters).forEach(([k, v]) => form.append(k, v));
//         form.append("file", fs.createReadStream(filePath));

//         await axios.post(uploadTask.result.form.url, form, { headers: form.getHeaders() });
//         fs.unlinkSync(filePath); // delete local file
//         console.log("✅ File uploaded!");

//         // Step 3: Poll until converted file ready
//         const exportTask = job.tasks.find(t => t.name === "export-file");

//         console.log("🔥 [Step 3] Polling for result...");
//         let fileUrl = null;
//         for (let i = 0; i < 15; i++) { // max 15 retries
//             const taskRes = await axios.get(
//                 `https://api.cloudconvert.com/v2/tasks/${exportTask.id}`,
//                 { headers: { Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2Q5NDJhYzgwYWUxNjkzNTc1YzI5ZTA0MDhhYWQ3YWNkMjJmMDk1NGE1YTk5Mzc2MTcyMzYyODNlZjVkMzE5OTM1ODE1OTQ3YzQ4YmIyNGQiLCJpYXQiOjE3NTg2MzQyMDAuNzE0MzksIm5iZiI6MTc1ODYzNDIwMC43MTQzOTIsImV4cCI6NDkxNDMwNzgwMC43MDk1MjgsInN1YiI6IjcyOTkxNjI5Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInRhc2sucmVhZCIsInVzZXIud3JpdGUiLCJ0YXNrLndyaXRlIiwid2ViaG9vay53cml0ZSIsInByZXNldC5yZWFkIiwicHJlc2V0LndyaXRlIiwid2ViaG9vay5yZWFkIl19.JrftRewwzt__fn6JUC5ts_6PU9_d4AW58PVmUgfNiWaIJxRxlKyUEOeEV24V9WBkTGWRcM6Wow6B-ZizmCJSq3Opn5XND7-cXx0UJkRRINoAHC0Pq0n-uBu3EXthbpVces0d_e1VUHXtOxqIg1kCgAfH9mZtJsyIVnsZo-PydX0Ud4462Fkl7dviK58TVIJ6fugl0auubyqSfLbsCvFK08lfiogysUbOoP3RSVnnwg216iFjX-1Ymntv95A_sjWphFoNnr-huKfNQf7nvEy2phKs37Zzf6GBUrJRMtqVJcDIuRD_P7IWG3ChzItCJwhzf3ULihhMYES-eaWrJTc3YHzdw1ra-pu8jSoJJ7RnkE2ePkMr2VqVkKuMylTTUItNDsvpmxLcDi-kT1Gw9ryJsWteY87BbY9ztz2DtsFIbQ1ZB2el0BtrdpAnD-9k0qTX19trQQS62ES7-DNhsJCoCr3ANy9aONwP6okyPi9nB49ch8j450ug0-8-7aahd3A-6X6ukgWUT4-pxzW4vyiBRYmFkjBVmlh-ynZ5kaIh5ra-peARpxmKU4BHMU934Y7RpASV1KxwVpHLLsCkRvpyvtN7nGXrDg0Skte4rcZYFFfVkEYIIk97bRptu--B42hJSzYvmAyWNYtLHxOn34yITSoRAEdUZjeVvalhA3q1fns` } }
//             );

//             const task = taskRes.data.data;
//             if (task.status === "finished" && task.result?.files?.length > 0) {
//                 fileUrl = task.result.files[0].url;
//                 console.log("✅ File ready:", fileUrl);
//                 break;
//             }

//             console.log(`⏳ Waiting... [${i + 1}] status: ${task.status}`);
//             await new Promise(r => setTimeout(r, 3000)); // wait 3s
//         }

//         if (!fileUrl) throw new Error("Conversion timeout");

//         return res.status(200).json({ success: true, downloadUrl:fileUrl });

//     } catch (err) {
//         console.error("❌ Conversion failed:", err.response?.data || err.message);
//         res.status(500).json({ error: err.response?.data || err.message });
//     }
// };


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

// Supported formats
const SUPPORTED_OUTPUTS = ["pdf", "svg", "png", "tiff", "jpg", "jpeg", "ps"];

export const convertFile = async (req, res) => {
    const filePath = req.file.path;
    const requestedFormat = (req.body.output_format || "pdf").toLowerCase();

    if (!SUPPORTED_OUTPUTS.includes(requestedFormat)) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: `Output format ${requestedFormat} not supported.` });
    }

    try {
        console.log(`🔥 [Step 1] Creating Job for format: ${requestedFormat}`);

        // Decide conversion steps
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
        } else {
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
console.log("${process?.env?.CLOUDCONVERT_API_KEY: ",`${process?.env?.CLOUDCONVERT_API_KEY}`);
        // Step 1: Create Job
        const jobResponse = await axios.post(
            "https://api.cloudconvert.com/v2/jobs",
            { tasks },
            {
                headers: {
                    Authorization: `Bearer ${process?.env?.CLOUDCONVERT_API_KEY}`
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
                    headers:
                        { Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}` }
                }
            );

            const task = taskRes.data.data;
            if (task.status === "finished" && task.result?.files?.length > 0) {
                fileUrl = task.result.files[0].url;
                console.log("✅ File ready:", fileUrl);
                break;
            }

            console.log(`⏳ Waiting... [${i + 1}] status: ${task.status}`);
            await new Promise(r => setTimeout(r, 3000));
        }

        if (!fileUrl) throw new Error("Conversion timeout");
        return res.status(200).json({ success: true, downloadUrl: fileUrl });

    } catch (err) {
        console.error("❌ Conversion failed:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || err.message });
    }
};
