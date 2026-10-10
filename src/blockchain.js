import { ethers } from "ethers";
import RoadChainABI from "./abi/RoadChainABI.json";
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contract = new ethers.Contract(
  contractAddress,
  RoadChainABI,
  provider
);

export { provider, contract };