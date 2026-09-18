import dotenv from "dotenv";
import app from "./app.js";
import { startInventoryEventConsumer } from "./events/rabbitmqConsumer.js";
import { isFeatureEnabled } from "@mms/feature-flags";

dotenv.config({
  path: "../../.env",
});

const port = Number(process.env.INVENTORY_SERVICE_PORT ?? 3003);

if (isFeatureEnabled("inventory")) {
  startInventoryEventConsumer().catch((error) => {
    console.error("Failed to start inventory event consumer", error);
  });
}

app.listen(port, () => {
  console.log(`Inventory service running on port ${port}`);
});
