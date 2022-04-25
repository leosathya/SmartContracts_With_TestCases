// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Airdrop {
    uint immutable dropStartTime;
    uint immutable dropEndTime;
    uint lastDropTime;
    
    uint constant MAX_LIMIT = 150;
    uint constant TWELVE_MONTHS = 31557600;
    uint constant ONE_DAY = 86400;

    event Drop(address account);

    mapping (address => uint) public airdrops;

    constructor()    {
        dropStartTime = block.timestamp;
        lastDropTime = block.timestamp;
        dropEndTime = block.timestamp + TWELVE_MONTHS;
    }

    function drop (address account) internal {
        // Check drop conditions
        require (isDropAvailable(block.timestamp), "invalid drop");
        require (airdrops[account] + 1 <= MAX_LIMIT, "max drops reached");

        airdrops[account] += 1;
        lastDropTime = block.timestamp;
    }

    function isDropAvailable(uint timestamp) private view returns (bool diff) {
        if (timestamp - lastDropTime > ONE_DAY && timestamp < dropEndTime) {
            return true;
        }
        
        return false;
    }
    
    function returnDropTokenCounts_ (address account) public view returns(uint bal){
        bal = airdrops[account];
    }


}