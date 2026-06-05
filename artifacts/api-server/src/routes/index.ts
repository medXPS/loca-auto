import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import carsRouter from "./cars";
import rentalRequestsRouter from "./rental-requests";
import customersRouter from "./customers";
import agentsRouter from "./agents";
import expensesRouter from "./expenses";
import blogRouter from "./blog";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import documentsRouter, { uploadRouter } from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/cars", carsRouter);
router.use("/rental-requests", rentalRequestsRouter);
router.use("/customers", customersRouter);
router.use("/agents", agentsRouter);
router.use("/expenses", expensesRouter);
router.use("/blog", blogRouter);
router.use("/notifications", notificationsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/settings", settingsRouter);
router.use("/documents", documentsRouter);
router.use("/upload", uploadRouter);

export default router;
