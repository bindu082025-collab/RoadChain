import hardhatIgnition from "@nomicfoundation/hardhat-ignition";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatIgnition],
  solidity: "0.8.28",
});