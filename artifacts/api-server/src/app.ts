import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { findStoredUploadPath, uploadsDir } from "./lib/uploads";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));
app.get("/uploads/:fileName", (req, res) => {
  const filePath = findStoredUploadPath(String(req.params.fileName));
  if (!filePath) {
    res.status(404).json({ error: "Fichier introuvable" });
    return;
  }

  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: "Fichier introuvable" });
    }
  });
});

app.use("/api", router);

export default app;
