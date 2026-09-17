import { Router } from "express";
import * as userController from "../controller/user.controller.js";
import { validate, registerRules } from "../middleware/validate.js";

const router = Router();

router.get("/", userController.getAllUser);
router.get("/:id", userController.getUserById);
router.post("/", validate(registerRules), userController.addUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
