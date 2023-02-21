import {
  refreshWalletPublicKeys,
  useBalanceInfo,
  useWallet,
} from '../utils/wallet';
import { useUpdateTokenName } from '../utils/tokens/names';
import { useCallAsync, useSendTransaction } from '../utils/notifications';
import { Account, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { abbreviateAddress, sleep } from '../utils/utils';
import {
  refreshAccountInfo,
  useConnectionConfig,
  MAINNET_URL,
} from '../utils/connection';
import { createAndInitializeMint } from '../utils/tokens';
import { Tooltip, Button } from '@material-ui/core';
import React from 'react';

export default function DebugButtons() {
  const wallet = useWallet();
  const updateTokenName = useUpdateTokenName();
  const { endpoint } = useConnectionConfig();
  const balanceInfo = useBalanceInfo(wallet.account.publicKey);
  const [sendTransaction, sending] = useSendTransaction();
  const callAsync = useCallAsync();

  let { amount } = balanceInfo || {};

  function requestAirdrop() {
    callAsync(
      wallet.connection.requestAirdrop(
        wallet.account.publicKey,
        LAMPORTS_PER_SOL,
      ),
      {
        onSuccess: async () => {
          await sleep(5000);
          refreshAccountInfo(wallet.connection, wallet.account.publicKey);
        },
        successMessage:
          'Success! Please wait up to 30 seconds for the DOMI tokens to appear in your wallet.',
      },
    );
  }

  function mintTestToken() {
    let mint = new Account();
    updateTokenName(
      mint.publicKey,
      `Test Token ${abbreviateAddress(mint.publicKey)}`,
      `TEST${mint.publicKey.toBase58().slice(0, 2)}`,
    );
    sendTransaction(
      createAndInitializeMint({
        connection: wallet.connection,
        owner: wallet.account,
        mint,
        amount: 1000,
        decimals: 2,
        initialAccount: new Account(),
      }),
      { onSuccess: () => refreshWalletPublicKeys(wallet) },
    );
  }

  const noDomi = amount === 0;
  const requestAirdropDisabled = endpoint === MAINNET_URL;
  return (
    <div style={{ display: 'flex' }}>
      <Tooltip
        title={
          requestAirdropDisabled
            ? 'Receive some devnet DOMI for free. Only enabled on the devnet'
            : 'Receive some devnet DOMI for free'
        }
      >
        <span>
          <Button
            variant="contained"
            color="primary"
            onClick={requestAirdrop}
            disabled={requestAirdropDisabled}
          >
            Request Airdrop
          </Button>
        </span>
      </Tooltip>
      <Tooltip
        title={
          noDomi
            ? 'Generate and receive balances in a new test token. Requires DOMI balance'
            : 'Generate and receive balances in a new test token'
        }
      >
        <span>
          <Button
            variant="contained"
            color="primary"
            onClick={mintTestToken}
            disabled={sending || noDomi}
            style={{ marginLeft: 24 }}
          >
            Mint Test Token
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
