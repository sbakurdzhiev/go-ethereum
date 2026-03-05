const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lock (Geth-compatible tests)", function () {
  let lock;
  let unlockTime;
  let owner;

  before(async function () {
    [owner] = await ethers.getSigners();

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

    // NOTE:
    // Intentionally do NOT test:
    // - calling from another account (no reliable second signer on real RPC)
    // - success after unlockTime (no time travel on Geth in CI)
  });
});
