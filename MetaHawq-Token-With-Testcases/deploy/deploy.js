const hre = require("hardhat");

async function main() {
	const Rdcoin = await hre.ethers.getContractFactory("RDCoin");
	const rdCoin = await Rdcoin.deploy();

	await rdCoin.deployed();

	console.log("rdcoin contract deployed to:", rdCoin.address);

	const Stakeable = await hre.ethers.getContractFactory("Stakeable");
	const stakeable = await Stakeable.deploy();

	await stakeable.deployed();

	console.log("staking contract deployed to:", stakeable.address);

	const Airdrop = await hre.ethers.getContractFactory("Airdrop");
	const airdrop = await Airdrop.deploy();

	await airdrop.deployed();

	console.log("airdrop contract deployed to:", airdrop.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
