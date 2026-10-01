import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
  path: "../../.env",
});

const port = Number(process.env.PROCUREMENT_SERVICE_PORT) || 3002;

app.listen(port, () => {
  console.log(`Procurement service running on port ${port}`);
});
