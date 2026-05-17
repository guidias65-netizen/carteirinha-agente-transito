import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentesRouter from "./agentes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentesRouter);

export default router;
