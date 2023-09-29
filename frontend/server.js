import express from "express";
import ViteExpress from "vite-express";

const app = express();

ViteExpress.config({
    mode: "production"
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const httpServer = ViteExpress.listen(app, 3000, () => console.log("Server is listening!"));