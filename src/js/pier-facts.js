// Reviewed educational copy, shared by vendors and future attractions. No network requests.
(() => {
  "use strict";
  window.BL.pierFacts={
    verification:{title:"Verify your own view",line:"Every Bitcoin full node checks blocks against its own consensus rules.",
      detail:"Full nodes validate transactions and blocks independently. A block that breaks their rules is rejected, even when a miner produced it. Among valid competing chains, nodes follow the chain with the most accumulated proof of work.",
      source:"https://developer.bitcoin.org/devguide/block_chain.html",sourceTitle:"Bitcoin developer guide: Block Chain"},
    keys:{title:"Keys, not coins",line:"A Bitcoin wallet manages keys used to authorize spending.",
      detail:"Bitcoin records spendable transaction outputs on its ledger. Wallet software manages private keys and uses them to sign transactions; it does not store coins as files. Different wallets can use different key and backup formats.",
      source:"https://developer.bitcoin.org/devguide/wallets.html",sourceTitle:"Bitcoin developer guide: Wallets"},
    volley:{title:"Find a usable route",line:"Lightning payments can travel through connected payment channels via intermediate nodes.",
      detail:"The sender constructs a route; each forwarding hop needs a usable outgoing channel. Available liquidity, fees and time limits can prevent a payment from completing. These visible toy capacities, sequential volleyball passes and five-second rallies simplify the process: actual payments use conditional transfers and onion routing, and channel balances are not all public. Four carnival tickets per delivery are saved at 75 seconds; leaving early discards them. No bitcoin is sent or earned.",
      source:"https://github.com/lightning/bolts/blob/master/04-onion-routing.md",sourceTitle:"BOLT 4: Onion routing protocol"},
    seedMatch:{title:"Keep an ordered backup",line:"Wallet recovery words need a private backup in the correct order.",
      detail:"BIP 39 wallets turn an ordered, wallet-generated mnemonic into a seed. A separate passphrase, if used, is also needed to recreate the same wallet; backup formats vary between wallets. Memorizing words is not a substitute for a durable private backup. These twelve public pier words are a memory puzzle, not a wallet backup. Two carnival tickets per correct position and a six-ticket perfect bonus are saved at 75 seconds; leaving early discards them.",
      source:"https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki",sourceTitle:"BIP 39: Mnemonic code"},
    mayhem:{title:"Fees compete for space",line:"Miners often favor higher fee rates when block space is scarce.",
      detail:"Miners choose valid transactions for limited block space. Bitcoin Core considers fee rates and transaction dependencies; a fee does not guarantee a confirmation time. These equal-size cars and ten-second, single-slot gates are a toy queue. Tokens raise invented game fees, and an admission earns six pending carnival tickets. No bitcoin is earned or spent.",
      source:"https://github.com/bitcoin/bitcoin/blob/master/src/node/miner.cpp",sourceTitle:"Bitcoin Core: Block selection"},
    whack:{title:"A coin can be spent once",line:"Bitcoin nodes reject a transaction that tries to spend an already-spent output.",
      detail:"A transaction input refers to a previous transaction output. Nodes track unspent outputs and check that inputs are available before accepting a spend in a block. This toy arcade shows independent ledger snapshots every 2.5 seconds: A–F stand for output IDs, and a missed rejection costs a game point. Leaving a valid transaction alone does not spend a real coin. No bitcoin is earned or spent; three game points earn one carnival ticket.",
      source:"https://developer.bitcoin.org/devguide/block_chain.html#introduction",sourceTitle:"Bitcoin developer guide: Block Chain"},
    builder:{title:"Space has a cost",line:"Limited block space makes fees per unit of space matter when choosing transactions.",
      detail:"Bitcoin limits block weight to 4,000,000 weight units. Miners can select valid transactions and collect their fees; dependencies and validation also matter. Here, 36 grid spaces and invented fee units illustrate the tradeoff. Shapes are a puzzle, not Bitcoin transaction formats. Every four collected game fees earn one carnival ticket; no bitcoin is earned or spent.",
      source:"https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#block-size",sourceTitle:"BIP 141: Block weight limit"},
    fishing:{title:"A smaller target takes more tries",line:"Proof of work needs a hash at or below a target; a smaller target makes success rarer.",
      detail:"Miners try changing block headers until a hash meets the target. Bitcoin adjusts difficulty every 2,016 blocks to aim for a ten-minute average block interval. Fishing uses random 32-bit draws and adjusts every three catches to illustrate the same idea in a short round; it does not perform Bitcoin mining.",
      source:"https://developer.bitcoin.org/devguide/block_chain.html#proof-of-work",sourceTitle:"Bitcoin developer guide: Proof of Work"}
  };
})();
