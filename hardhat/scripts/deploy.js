async function main() {
  const now = Math.floor(Date.now() / 1000);
  const unlockTime = now + 60; // unlock in 60 seconds

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime);

  await lock.waitForDeployment();

  console.log("Lock deployed at:", await lock.getAddress());
  console.log("Unlock time:", unlockTime);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
