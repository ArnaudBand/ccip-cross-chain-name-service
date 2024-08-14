import { ethers } from "hardhat";

interface Config {
  chainSelector_: bigint;
  sourceRouter_: string;
  destinationRouter_: string;
  wrappedNative_: string;
  linkToken_: string;
  ccipBnM_: string;
  ccipLnM_: string;
}

interface DeploymentResult {
  localSimulator: any;
  CrossChainNameServiceLookupSource: any;
  CrossChainNameServiceLookupDestination: any;
  CrossChainNameServiceRegisterSource: any;
  CrossChainNameServiceRegisterDestination: any;
  CrossChainNameServiceReceiver: any;
  config: Config;
  deployer: any;
  alice: any;
  GAS_LIMIT: number;
}

// Deploys the CrossChainNameService contracts and returns the deployed instances
export async function deployCrossChainNameService(): Promise<DeploymentResult> {
  const [deployer, alice] = await ethers.getSigners();
  const GAS_LIMIT = 1_000_000; // 1 million gas limit

  // Deploy the local simulator contract
  const localSimulatorFactory = await ethers.getContractFactory("CCIPLocalSimulator");
  const localSimulator = await localSimulatorFactory.deploy();
  const config: Config = await localSimulator.configuration();

  // Deploy the CrossChainNameServiceLookup contracts for source and destination chains
  const CrossChainNameServiceLookup = await ethers.getContractFactory('CrossChainNameServiceLookup');
  const CrossChainNameServiceLookupSource = await CrossChainNameServiceLookup.connect(deployer).deploy();
  const CrossChainNameServiceLookupDestination = await CrossChainNameServiceLookup.connect(deployer).deploy();

  // Deploy the CrossChainNameServiceRegister contracts for source and destination chains
  const CrossChainNameServiceRegister = await ethers.getContractFactory('CrossChainNameServiceRegister');
  const CrossChainNameServiceRegisterSource = await CrossChainNameServiceRegister.connect(deployer).deploy(
      config.sourceRouter_,
      CrossChainNameServiceLookupSource.target
  );
  const CrossChainNameServiceRegisterDestination = await CrossChainNameServiceRegister.connect(deployer).deploy(
      config.destinationRouter_,
      CrossChainNameServiceLookupDestination.target
  );

  // Deploy the CrossChainNameServiceReceiver contract
  const CrossChainNameServiceReceiverFactory = await ethers.getContractFactory('CrossChainNameServiceReceiver');
  const CrossChainNameServiceReceiver = await CrossChainNameServiceReceiverFactory.connect(deployer).deploy(
      config.sourceRouter_,
      CrossChainNameServiceLookupDestination.target,
      config.chainSelector_
  );

  return {
      localSimulator,
      CrossChainNameServiceLookupSource,
      CrossChainNameServiceLookupDestination,
      CrossChainNameServiceRegisterSource,
      CrossChainNameServiceRegisterDestination,
      CrossChainNameServiceReceiver,
      config,
      deployer,
      alice,
      GAS_LIMIT,
  };
}