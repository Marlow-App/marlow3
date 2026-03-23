import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { customPinyin } from "pinyin-pro";

customPinyin({ "东西": "dōng xi" });

createRoot(document.getElementById("root")!).render(<App />);
