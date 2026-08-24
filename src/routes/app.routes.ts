import { Router } from "express";
import postAppUser from "@/controllers/app/user/postUser";
import postAppProductPurchase from "@/controllers/app/productPurchase/postProductPurchase";
import postAppPayoutRecipient from "@/controllers/app/payoutRecipient/postPayoutRecipient";
import getAppAchievement from "@/controllers/app/achievement/getAchievement";

const router = Router();

router.post("/users", postAppUser);
router.get("/users/:userId/achievements", getAppAchievement);
router.post("/product-purchases", postAppProductPurchase);
router.post("/payout-recipients", postAppPayoutRecipient);

export default router;
