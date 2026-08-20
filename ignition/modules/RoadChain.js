import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RoadChainModule", (m) => {
  const roadChain = m.contract("RoadChain");

  return { roadChain };
});
