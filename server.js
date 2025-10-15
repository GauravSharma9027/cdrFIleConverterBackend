import express from "express";
import path from "path";
import convertRoutes from "./routes/convertRoutes.js";
import cors from "cors";
import { configDotenv } from "dotenv";
configDotenv()
const app = express();
const Port = process.env.PORT;

app.use(cors({
    // origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_VERCEL],
    origin: "https://cdrconverterfrontend.netlify.app",
    credentials: true
}));

app.use(express.json());

// Static folder to serve converted files
app.use("/converted", express.static(path.join(process.cwd(), "converted")));

// Routes
app.use("/api/convert", convertRoutes);

app.listen(Port, () => {
    console.log(`✅Server running on http://localhost:${Port}`);
});
