import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const PORT = env.port ?? 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
