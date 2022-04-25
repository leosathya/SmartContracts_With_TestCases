require("@nomiclabs/hardhat-waffle");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
	networks: {
		mumbai: {
			url: process.env.URL,
			accounts: [process.env.ACCOUNT],
		},
	},
	solidity: {
		version: "0.8.0",
	},
};
