import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployCrossChainNameService } from "../script/deploy";

describe("CrossChainNameService", function () {
    const DNS = 'alice.ccns';

    describe("Cross-chain name service registration and lookup", function () {
        it("should correctly register and lookup a cross-chain DNS name", async function () {
            const {
                CrossChainNameServiceLookupSource,
                CrossChainNameServiceLookupDestination,
                CrossChainNameServiceRegisterSource,
                CrossChainNameServiceReceiver,
                config,
                deployer,
                alice,
                GAS_LIMIT
            } = await loadFixture(deployCrossChainNameService);

            // Step 1: Set CrossChainNameService addresses for source and destination lookups
            await CrossChainNameServiceLookupSource.connect(deployer).setCrossChainNameServiceAddress(CrossChainNameServiceRegisterSource.target);
            await CrossChainNameServiceLookupDestination.connect(deployer).setCrossChainNameServiceAddress(CrossChainNameServiceReceiver.target);

            // Step 2: Enable the CrossChainNameServiceRegister contract on the source chain
            await CrossChainNameServiceRegisterSource.connect(deployer).enableChain(
                config.chainSelector_,
                CrossChainNameServiceReceiver.target,
                GAS_LIMIT
            );

            // Step 3: Register the DNS name "alice.ccns" using Alice's account
            await CrossChainNameServiceRegisterSource.connect(alice).register(DNS);

            // Step 4: Lookup the registered DNS name on the destination chain
            const registeredAddress = await CrossChainNameServiceLookupDestination.lookup(DNS);

            // Assert that the lookup returns Alice's address
            expect(registeredAddress).to.equal(alice.address, "The DNS name was not correctly registered and resolved.");
        });
    });
});
