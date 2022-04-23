// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

contract LockMyEth{
    struct Lock{
        address sender;
        uint amout;
        uint unStakeTime;
    }

    mapping(address => Lock) private lockedAccounts;
    uint public constant LOCKED_PERIOD = 2 * 365 days;

    event StakeIn(address indexed sender, uint amount, uint withdrawalTime);
    event StakeOut(address indexed receiver, uint amount);

    function deposite() external payable {
        require(msg.value > 0, "Stake Something.");
        Lock storage acc = lockedAccounts[msg.sender];
        if(acc.amout == 0){
            acc.sender = msg.sender;
            acc.amout = msg.value;
            acc.unStakeTime = block.timestamp + LOCKED_PERIOD;
        }else{
            acc.amout += msg.value;
        }

        emit StakeIn(msg.sender, msg.value, acc.unStakeTime);
    }

    function withdraw() external {
        Lock storage acc = lockedAccounts[msg.sender];
        uint bal = acc.amout;
        require(acc.unStakeTime < block.timestamp, "Staking Period not over yet.");
        require( bal > 0, "nothing to withdraw.");
        acc.amout = 0;
        (bool sent, ) = payable(msg.sender).call{value: bal}("");
        require(sent, "Transaction Failed.");

        emit StakeOut(msg.sender, bal);
    }

    function lockAccountDetails(address account) external view returns(Lock memory lockDetails){
        lockDetails = lockedAccounts[account];
    }

    function lockedAmount(address account) external view returns(uint bal){
        //Lock memory acc = lockedAccounts[account];
        bal = lockedAccounts[account].amout;
    }
}