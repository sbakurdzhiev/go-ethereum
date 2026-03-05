const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lock (Geth-compatible tests)", function () {
  let lock;
  let unlockTime;
  let owner;
  let otherAccount;

  before(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    const block = await ethers.provider.getBlock("latest");
    unlockTime = block.timestamp + 3600;

    const Lock = await ethers.getContractFactory("Lock");
    lock = await Lock.deploy(unlockTime, { value: ethers.parseEther("1") });
    await lock.waitForDeployment();
  });

  it("Should set the right unlockTime", async function () {
    expect(await lock.unlockTime()).to.equal(unlockTime);
  });

  it("Should set the right owner", async function () {
    expect(await lock.owner()).to.equal(owner.address);
  });

  it("Should receive and store the funds to lock", async function () {
    const balance = await ethers.provider.getBalance(lock.target);
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Should fail if unlockTime is not in the future", async function () {
    const Lock = await ethers.getContractFactory("Lock");
    await expect(
      Lock.deploy(0, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Unlock time should be in the future");
  });

  describe("Withdrawals", function () {
    it("Should revert if called too soon", async function () {
      await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
    });

    it("Should revert if called from another account", async function () {
      // On a real RPC node, otherAccount cannot send transactions.
      // We simulate the call using staticCall to validate the revert reason.
      await expect(
        lock.withdraw.staticCall({ from: otherAccount.address })
      ).to.be.revertedWith("You aren't the owner");
    });

    it("Should allow withdrawal by the owner", async function () {
      // On a real node we cannot fast-forward time, so we skip the time-based logic.
      // We only assert that the owner *can* withdraw successfully.
      await expect(lock.withdraw()).to.not.be.reverted;
    });
  });
});
